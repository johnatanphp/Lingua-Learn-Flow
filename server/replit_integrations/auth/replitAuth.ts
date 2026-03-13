import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    tableName: "sessions",
    createTableIfMissing: true,
  });
  return session({
    secret: process.env.SESSION_SECRET ?? "lingua-learn-secret-fallback",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // ─── Google OAuth2 Strategy (optional) ──────────────────────────
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
          scope: ["profile", "email"],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const dbUser = await authStorage.upsertUser({
              id: `google_${profile.id}`,
              email: email ?? null,
              firstName: profile.name?.givenName ?? null,
              lastName: profile.name?.familyName ?? null,
              profileImageUrl: profile.photos?.[0]?.value ?? null,
              authProvider: "google",
            });
            const sessionUser: any = {
              claims: { sub: dbUser.id, email: dbUser.email },
              provider: "google",
            };
            done(null, sessionUser);
          } catch (err) {
            done(err as Error);
          }
        }
      )
    );
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // ─── Redirect any legacy /api/login → our login page ────────────
  app.get("/api/login", (_req, res) => {
    res.redirect("/login");
  });

  // ─── Google OAuth routes ─────────────────────────────────────────
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", {
        successRedirect: "/",
        failureRedirect: "/login?error=google_failed",
      })
    );
  }

  // ─── Guest Session ────────────────────────────────────────────────
  app.post("/api/auth/guest", async (req, res) => {
    try {
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const guestUser = await authStorage.upsertUser({
        id: guestId,
        email: null,
        firstName: "Invitado",
        lastName: null,
        profileImageUrl: null,
        role: "guest",
        authProvider: "guest",
      });
      const sessionUser: any = {
        claims: { sub: guestUser.id, email: null },
        provider: "guest",
      };
      req.login(sessionUser, (err) => {
        if (err) return res.status(500).json({ message: "Error al crear sesión de invitado" });
        res.json({ success: true, user: guestUser });
      });
    } catch (err) {
      console.error("Guest session error:", err);
      res.status(500).json({ message: "Error al crear sesión de invitado" });
    }
  });

  // ─── Logout ──────────────────────────────────────────────────────
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/login");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export const requireRole = (...roles: string[]): RequestHandler => {
  return async (req: any, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const dbUser = await authStorage.getUser(userId);
    if (!dbUser || !roles.includes(dbUser.role ?? "student")) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
};
