import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    tableName: "sessions",
    createTableIfMissing: true,
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
  user.provider = "replit";
}

async function upsertReplitUser(claims: any) {
  return await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    authProvider: "replit",
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  // ─── Replit OIDC Strategy ────────────────────────────────────────
  const verify: VerifyFunction = async (tokens, verified) => {
    const user: any = {};
    updateUserSession(user, tokens);
    await upsertReplitUser(tokens.claims());
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  // ─── Google OAuth2 Strategy ──────────────────────────────────────
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
              dbUser,
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

  // ─── Replit Login Routes ─────────────────────────────────────────
  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/login",
    })(req, res, next);
  });

  // ─── Google Login Routes ─────────────────────────────────────────
  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      successRedirect: "/",
      failureRedirect: "/login?error=google_failed",
    })
  );

  // ─── Guest Session Route ─────────────────────────────────────────
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
        dbUser: guestUser,
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
    const provider = (req.user as any)?.provider;
    req.logout(() => {
      if (provider === "google" || provider === "guest") {
        res.redirect("/login");
      } else {
        client
          .buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          })
          .href;
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}/login`,
          }).href
        );
      }
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
