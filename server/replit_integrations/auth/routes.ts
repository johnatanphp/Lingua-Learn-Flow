import type { Express } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().optional(),
  role: z.enum(["student", "teacher", "admin"]).default("student"),
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export function registerAuthRoutes(app: Express): void {
  // ─── Get current user ────────────────────────────────────────────
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Error al obtener usuario" });
    }
  });

  // ─── Register with email + password ──────────────────────────────
  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }
      const { email, password, firstName, lastName, role } = parsed.data;

      const existing = await authStorage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "Ya existe una cuenta con este email" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await authStorage.createLocalUser({ email, passwordHash, firstName, lastName, role });

      const sessionUser: any = { claims: { sub: user.id, email: user.email }, provider: "local" };
      req.login(sessionUser, (err: any) => {
        if (err) return res.status(500).json({ message: "Error al crear sesión" });
        const { passwordHash: _, ...safeUser } = user;
        res.status(201).json(safeUser);
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Error al registrar usuario" });
    }
  });

  // ─── Login with email + password ─────────────────────────────────
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }
      const { email, password } = parsed.data;

      const user = await authStorage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Email o contraseña incorrectos" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Email o contraseña incorrectos" });
      }

      const sessionUser: any = { claims: { sub: user.id, email: user.email }, provider: "local" };
      req.login(sessionUser, (err: any) => {
        if (err) return res.status(500).json({ message: "Error al iniciar sesión" });
        const { passwordHash: _, ...safeUser } = user;
        res.json(safeUser);
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Error al iniciar sesión" });
    }
  });

  // ─── Update role ──────────────────────────────────────────────────
  app.patch("/api/auth/user/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      const validRoles = ["student", "teacher", "admin", "guest"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Rol inválido" });
      }
      const user = await authStorage.updateUserRole(userId, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Error al actualizar rol" });
    }
  });

  // ─── Providers info ───────────────────────────────────────────────
  app.get("/api/auth/providers", (_req, res) => {
    res.json([
      { id: "local", name: "Email", available: true },
      {
        id: "google",
        name: "Google",
        available: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
      { id: "guest", name: "Invitado", available: true },
    ]);
  });

  // ─── Logout (local + OAuth) ───────────────────────────────────────
  app.post("/api/auth/logout", (req: any, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
}
