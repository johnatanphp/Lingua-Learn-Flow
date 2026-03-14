import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { isAuthenticated, requireRole } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import { getOpenAIClient } from "./replit_integrations/chat/client";
import { db } from "./db";
import { levels, lessons, achievements, plans } from "@shared/schema";
import { setupWebSocketSignaling } from "./ws-signaling";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";

function generateInvoiceNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `AC-${y}${m}-${rand}`;
}

function generateCertCode(): string {
  return `CERT-${nanoid(10).toUpperCase()}`;
}

// ─── Seed ────────────────────────────────────────────────────────────────────

async function seedDatabase() {
  const existingLevels = await storage.getLevels();
  if (existingLevels.length === 0) {
    console.log("Seeding database...");
    const [l1] = await db.insert(levels).values({ name: "Basics 1", description: "Saludos y frases comunes.", order: 1, requiredXp: 0 }).returning();
    const [l2] = await db.insert(levels).values({ name: "Travel", description: "Vocabulario esencial para viajar.", order: 2, requiredXp: 100 }).returning();
    const [l3] = await db.insert(levels).values({ name: "Business", description: "Inglés de negocios profesional.", order: 3, requiredXp: 300 }).returning();

    if (l1) {
      await db.insert(lessons).values([
        { levelId: l1.id, title: "Hola y Adiós", content: "Aprende a saludar y despedirte en situaciones formales e informales.", type: "conversation", order: 1, durationMinutes: 8 },
        { levelId: l1.id, title: "Números y Colores", content: "Vocabulario básico de números del 1 al 100 y colores principales.", type: "reading", order: 2, durationMinutes: 10 },
        { levelId: l1.id, title: "Pronunciación A-Z", content: "Practica la pronunciación correcta del alfabeto inglés.", type: "pronunciation", order: 3, durationMinutes: 12 },
      ]);
    }
    if (l2) {
      await db.insert(lessons).values([
        { levelId: l2.id, title: "En el Aeropuerto", content: "Frases esenciales para navegar aeropuertos internacionales.", type: "conversation", order: 1, durationMinutes: 15 },
        { levelId: l2.id, title: "Reservas de Hotel", content: "Cómo hacer y gestionar reservas de alojamiento.", type: "reading", order: 2, durationMinutes: 12 },
      ]);
    }
    if (l3) {
      await db.insert(lessons).values([
        { levelId: l3.id, title: "Reuniones Profesionales", content: "Vocabulario y frases para reuniones de negocios.", type: "conversation", order: 1, durationMinutes: 20 },
      ]);
    }
    await db.insert(achievements).values([
      { name: "Primeros Pasos", description: "Completaste tu primera lección", icon: "Trophy", requiredXp: 10, category: "learning" },
      { name: "Estrella en Ascenso", description: "Alcanzaste 100 XP", icon: "Star", requiredXp: 100, category: "xp" },
      { name: "Maestro del Idioma", description: "Alcanzaste 500 XP", icon: "Award", requiredXp: 500, category: "xp" },
      { name: "Racha de 7 días", description: "Estudia 7 días seguidos", icon: "Flame", requiredXp: 200, category: "streak" },
      { name: "Graduado", description: "Completa un nivel completo", icon: "GraduationCap", requiredXp: 150, category: "learning" },
    ]);
  }

  // Seed plans
  const existingPlans = await storage.getPlans();
  if (existingPlans.length === 0) {
    await db.insert(plans).values([
      {
        name: "Gratis", slug: "free", description: "Empieza tu viaje de aprendizaje sin costo.",
        price: "0", currency: "USD", billingPeriod: "monthly",
        features: JSON.stringify(["5 lecciones por mes", "Acceso básico a IA", "Logros"]),
        hasVideoAccess: false, hasAiAccess: true, hasCertificates: false,
        isActive: true, isPopular: false, sortOrder: 0,
      },
      {
        name: "Básico", slug: "basic", description: "Acceso a clases en vivo y más lecciones.",
        price: "9.99", currency: "USD", billingPeriod: "monthly",
        features: JSON.stringify(["Lecciones ilimitadas", "2 clases en vivo/mes", "Práctica con IA", "Certificados básicos"]),
        hasVideoAccess: true, hasAiAccess: true, hasCertificates: true,
        isActive: true, isPopular: false, sortOrder: 1,
      },
      {
        name: "Premium", slug: "premium", description: "Experiencia completa de aprendizaje.",
        price: "24.99", currency: "USD", billingPeriod: "monthly",
        features: JSON.stringify(["Todo en Básico", "Clases en vivo ilimitadas", "Grabaciones HD", "Tutorías 1 a 1", "Certificados oficiales", "Soporte prioritario"]),
        hasVideoAccess: true, hasAiAccess: true, hasCertificates: true,
        isActive: true, isPopular: true, sortOrder: 2,
      },
      {
        name: "Academia", slug: "academy", description: "Para instituciones y grupos de estudiantes.",
        price: "99.99", currency: "USD", billingPeriod: "monthly",
        features: JSON.stringify(["Todo en Premium", "Hasta 50 estudiantes", "Panel de administración", "Analíticas avanzadas", "API de integración", "Facturación empresarial"]),
        hasVideoAccess: true, hasAiAccess: true, hasCertificates: true,
        isActive: true, isPopular: false, sortOrder: 3,
      },
    ]);
  }
}

// ─── Register Routes ─────────────────────────────────────────────────────────

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // WebSocket signaling
  setupWebSocketSignaling(httpServer);

  // Auth routes
  registerAuthRoutes(app);

  // ── Levels & Lessons ─────────────────────────────────────────────────────

  app.get("/api/levels", async (_req, res) => {
    res.json(await storage.getLevels());
  });

  app.get("/api/levels/:levelId/lessons", async (req, res) => {
    res.json(await storage.getLessonsByLevel(Number(req.params.levelId)));
  });

  app.get("/api/lessons/:id", async (req, res) => {
    const lesson = await storage.getLesson(Number(req.params.id));
    if (!lesson) return res.status(404).json({ message: "Lección no encontrada" });
    res.json(lesson);
  });

  // ── Progress ─────────────────────────────────────────────────────────────

  app.get("/api/progress", isAuthenticated, async (req: any, res) => {
    res.json(await storage.getUserProgress(req.user.claims.sub));
  });

  app.post("/api/progress/xp", isAuthenticated, async (req: any, res) => {
    try {
      const { xpToAdd } = z.object({ xpToAdd: z.number().positive() }).parse(req.body);
      res.json(await storage.updateUserXp(req.user.claims.sub, xpToAdd));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // ── Live Classes ──────────────────────────────────────────────────────────

  app.get("/api/live-classes", async (_req, res) => {
    res.json(await storage.getLiveClasses());
  });

  app.get("/api/live-classes/:id", async (req, res) => {
    const cls = await storage.getLiveClass(Number(req.params.id));
    if (!cls) return res.status(404).json({ message: "Clase no encontrada" });
    res.json(cls);
  });

  app.post("/api/live-classes", isAuthenticated, requireRole("teacher", "admin"), async (req: any, res) => {
    try {
      const data = req.body;
      data.instructorId = req.user.claims.sub;
      const cls = await storage.createLiveClass(data);
      res.status(201).json(cls);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/live-classes/:id", isAuthenticated, requireRole("teacher", "admin"), async (req: any, res) => {
    try {
      res.json(await storage.updateLiveClass(Number(req.params.id), req.body));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/live-classes/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    await storage.deleteLiveClass(Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/live-classes/:id/register", isAuthenticated, async (req: any, res) => {
    const ok = await storage.registerForClass(req.user.claims.sub, Number(req.params.id));
    if (ok) res.status(201).json({ success: true });
    else res.status(400).json({ message: "No se pudo inscribir" });
  });

  // ── Video Rooms ───────────────────────────────────────────────────────────

  app.post("/api/video-rooms", isAuthenticated, requireRole("teacher", "admin"), async (req: any, res) => {
    try {
      const roomCode = nanoid(12).toUpperCase();
      const room = await storage.createVideoRoom({
        roomCode,
        classId: req.body.classId || null,
        hostId: req.user.claims.sub,
        status: "waiting",
      });
      res.status(201).json(room);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/video-rooms/:code", async (req, res) => {
    const room = await storage.getVideoRoom(req.params.code);
    if (!room) return res.status(404).json({ message: "Sala no encontrada" });
    res.json(room);
  });

  // ── Recordings ────────────────────────────────────────────────────────────

  app.get("/api/recordings", isAuthenticated, async (_req, res) => {
    res.json(await storage.getRecordings());
  });

  app.post("/api/recordings", isAuthenticated, requireRole("teacher", "admin"), async (req: any, res) => {
    try {
      const rec = await storage.createRecording({
        ...req.body,
        instructorId: req.user.claims.sub,
      });
      res.status(201).json(rec);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/recordings/:id", isAuthenticated, requireRole("teacher", "admin"), async (req, res) => {
    try {
      res.json(await storage.updateRecording(Number(req.params.id), req.body));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/recordings/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    await storage.deleteRecording(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Achievements ──────────────────────────────────────────────────────────

  app.get("/api/achievements", async (_req, res) => {
    res.json(await storage.getAchievements());
  });

  // ── Plans ─────────────────────────────────────────────────────────────────

  app.get("/api/plans", async (_req, res) => {
    res.json(await storage.getPlans());
  });

  app.post("/api/plans", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      res.status(201).json(await storage.createPlan(req.body));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/plans/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      res.json(await storage.updatePlan(Number(req.params.id), req.body));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // ── Subscriptions ─────────────────────────────────────────────────────────

  app.get("/api/my-subscription", isAuthenticated, async (req: any, res) => {
    const sub = await storage.getUserSubscription(req.user.claims.sub);
    res.json(sub || null);
  });

  app.post("/api/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const { planId, promoCode } = req.body;
      const plan = await storage.getPlan(planId);
      if (!plan) return res.status(404).json({ message: "Plan no encontrado" });

      // Validate promo code
      let discountAmount = 0;
      let validPromo = null;
      if (promoCode) {
        validPromo = await storage.getPromotionByCode(promoCode);
        if (validPromo && validPromo.isActive) {
          if (validPromo.discountType === "percent") {
            discountAmount = (Number(plan.price) * Number(validPromo.discountValue)) / 100;
          } else {
            discountAmount = Number(validPromo.discountValue);
          }
          await storage.updatePromotion(validPromo.id, { usedCount: validPromo.usedCount + 1 });
        }
      }

      const finalPrice = Math.max(0, Number(plan.price) - discountAmount);

      // Cancel existing subscription
      const existingSub = await storage.getUserSubscription(req.user.claims.sub);
      if (existingSub) {
        await storage.updateSubscription(existingSub.id, { status: "cancelled" });
      }

      // Create subscription
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      const sub = await storage.createSubscription({
        userId: req.user.claims.sub,
        planId,
        status: finalPrice === 0 ? "active" : "pending",
        endDate,
        promoCode: promoCode || null,
        discountAmount: String(discountAmount),
      });

      // Create payment record (for paid plans)
      if (finalPrice > 0) {
        const payment = await storage.createPayment({
          userId: req.user.claims.sub,
          subscriptionId: sub.id,
          amount: String(finalPrice),
          currency: plan.currency,
          status: "pending",
          method: req.body.method || "card",
        });

        // Create invoice
        const invoiceNumber = generateInvoiceNumber();
        await storage.createInvoice({
          invoiceNumber,
          userId: req.user.claims.sub,
          paymentId: payment.id,
          subscriptionId: sub.id,
          subtotal: plan.price,
          discount: String(discountAmount),
          tax: "0",
          total: String(finalPrice),
          currency: plan.currency,
          status: "pending",
          lineItems: JSON.stringify([
            { description: `Plan ${plan.name} - ${plan.billingPeriod}`, amount: plan.price, qty: 1 },
            ...(discountAmount > 0 ? [{ description: `Descuento (${promoCode})`, amount: -discountAmount, qty: 1 }] : []),
          ]),
        });

        return res.status(201).json({ subscription: sub, payment, invoiceNumber, amount: finalPrice });
      }

      res.status(201).json({ subscription: sub, amount: 0 });
    } catch (e: any) {
      console.error("Subscription error:", e);
      res.status(400).json({ message: e.message });
    }
  });

  // Simulate payment confirmation (in real app, this would be a webhook from payment gateway)
  app.post("/api/payments/:id/confirm", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const payment = await storage.updatePayment(Number(req.params.id), {
        status: "completed",
        paidAt: new Date(),
        gatewayRef: req.body.gatewayRef || `manual_${Date.now()}`,
      });
      if (payment.subscriptionId) {
        await storage.updateSubscription(payment.subscriptionId, { status: "active" });
      }
      if (payment.id) {
        const inv = (await storage.getUserInvoices(payment.userId))[0];
        if (inv) await storage.updateInvoice(inv.id, { status: "paid" });
      }
      res.json(payment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // ── Invoices ──────────────────────────────────────────────────────────────

  app.get("/api/invoices", isAuthenticated, async (req: any, res) => {
    const user = req.user;
    if (user?.role === "admin") {
      res.json(await storage.getAllInvoices());
    } else {
      res.json(await storage.getUserInvoices(user.claims.sub));
    }
  });

  app.get("/api/invoices/:id", isAuthenticated, async (req: any, res) => {
    const inv = await storage.getInvoice(Number(req.params.id));
    if (!inv) return res.status(404).json({ message: "Factura no encontrada" });
    if (inv.userId !== req.user.claims.sub && req.user.role !== "admin") {
      return res.status(403).json({ message: "Acceso denegado" });
    }
    res.json(inv);
  });

  // ── Certificates ──────────────────────────────────────────────────────────

  app.get("/api/certificates", isAuthenticated, async (req: any, res) => {
    res.json(await storage.getUserCertificates(req.user.claims.sub));
  });

  app.get("/api/certificates/verify/:code", async (req, res) => {
    const cert = await storage.getCertificateByCode(req.params.code);
    if (!cert) return res.status(404).json({ valid: false, message: "Certificado no encontrado" });
    res.json({ valid: true, certificate: cert });
  });

  app.post("/api/certificates", isAuthenticated, requireRole("teacher", "admin"), async (req: any, res) => {
    try {
      const cert = await storage.createCertificate({
        ...req.body,
        certificateCode: generateCertCode(),
        issuerName: "Academia Cometa",
      });
      // Notify student
      await storage.createNotification({
        userId: req.body.userId,
        title: "¡Nuevo Certificado!",
        body: `Has recibido el certificado: ${cert.title}`,
        type: "certificate",
        link: `/certificates`,
      });
      res.status(201).json(cert);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/admin/certificates", isAuthenticated, requireRole("admin"), async (_req, res) => {
    res.json(await storage.getAllCertificates());
  });

  // ── Promotions ────────────────────────────────────────────────────────────

  app.get("/api/promotions", isAuthenticated, requireRole("admin"), async (_req, res) => {
    res.json(await storage.getPromotions());
  });

  app.post("/api/promotions/validate", async (req, res) => {
    const { code, planId } = req.body;
    const promo = await storage.getPromotionByCode(code);
    if (!promo || !promo.isActive) return res.json({ valid: false, message: "Código no válido" });
    if (promo.validUntil && new Date() > new Date(promo.validUntil)) return res.json({ valid: false, message: "Código expirado" });
    if (promo.maxUses && promo.usedCount >= promo.maxUses) return res.json({ valid: false, message: "Código agotado" });
    res.json({ valid: true, promo });
  });

  app.post("/api/promotions", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const promo = await storage.createPromotion({ ...req.body, createdBy: req.user.claims.sub });
      res.status(201).json(promo);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/promotions/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      res.json(await storage.updatePromotion(Number(req.params.id), req.body));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/promotions/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    await storage.deletePromotion(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Notifications ─────────────────────────────────────────────────────────

  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    res.json(await storage.getUserNotifications(req.user.claims.sub));
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    await storage.markNotificationRead(Number(req.params.id), req.user.claims.sub);
    res.json({ success: true });
  });

  app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    await storage.markAllNotificationsRead(req.user.claims.sub);
    res.json({ success: true });
  });

  // ── Teacher Profile ───────────────────────────────────────────────────────

  app.get("/api/teacher-profile", isAuthenticated, async (req: any, res) => {
    const profile = await storage.getTeacherProfile(req.user.claims.sub);
    res.json(profile || null);
  });

  app.put("/api/teacher-profile", isAuthenticated, requireRole("teacher", "admin"), async (req: any, res) => {
    try {
      res.json(await storage.upsertTeacherProfile(req.user.claims.sub, req.body));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/teachers", async (_req, res) => {
    res.json(await storage.getTeachers());
  });

  // ── Admin ─────────────────────────────────────────────────────────────────

  app.get("/api/admin/stats", isAuthenticated, requireRole("admin"), async (_req, res) => {
    res.json(await storage.getAdminStats());
  });

  app.get("/api/admin/users", isAuthenticated, requireRole("admin"), async (_req, res) => {
    res.json(await storage.getAllUsers());
  });

  app.patch("/api/admin/users/:id/role", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { role } = z.object({ role: z.enum(["student", "teacher", "admin", "guest"]) }).parse(req.body);
      res.json(await storage.updateUserRole(req.params.id, role));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/admin/subscriptions", isAuthenticated, requireRole("admin"), async (_req, res) => {
    res.json(await storage.getAllSubscriptions());
  });

  app.get("/api/admin/payments", isAuthenticated, requireRole("admin"), async (_req, res) => {
    res.json(await storage.getAllPayments());
  });

  // ── AI Exercise ───────────────────────────────────────────────────────────

  app.post("/api/ai/exercise", isAuthenticated, async (req: any, res) => {
    try {
      const { level, topic } = req.body;
      const prompt = `Genera un ejercicio de conversación en inglés para nivel ${level} sobre ${topic}.
Responde ÚNICAMENTE con JSON válido con esta estructura exacta:
{
  "scenario": "Descripción breve de la situación (en español)",
  "questions": ["Pregunta 1 en inglés", "Pregunta 2 en inglés", "Pregunta 3 en inglés"]
}`;
      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(result);
    } catch (err: any) {
      console.error("AI Error:", err);
      res.status(500).json({ message: "No se pudo generar el ejercicio" });
    }
  });

  await seedDatabase().catch(console.error);

  return httpServer;
}
