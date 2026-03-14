import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { isAuthenticated, requireRole } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import { authStorage } from "./replit_integrations/auth/storage";
import { openai } from "./replit_integrations/chat/client";
import { db } from "./db";
import { levels, lessons, achievements, subscriptionPlans } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  wompiEnabled,
  generateReference,
  generateIntegritySignature,
  buildCheckoutUrl,
  getTransaction,
  verifyWebhookSignature,
  WOMPI_PUBLIC_KEY,
} from "./wompi";
import bcrypt from "bcryptjs";

// Seed default admin account
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "fundacionstudy@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Marzo2026.";
const LEGACY_ADMIN_EMAIL = "admin@speakfluently.co";

async function seedAdminAccount() {
  try {
    // Migrate legacy admin account to new credentials if it exists
    const legacy = await authStorage.getUserByEmail(LEGACY_ADMIN_EMAIL);
    if (legacy && legacy.role === "admin") {
      const { db } = await import("./db");
      const { users } = await import("@shared/models/auth");
      const { eq } = await import("drizzle-orm");
      const newPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      await db.update(users).set({
        email: ADMIN_EMAIL,
        passwordHash: newPasswordHash,
        firstName: "Fundación",
        lastName: "Study",
        updatedAt: new Date(),
      }).where(eq(users.id, legacy.id));
      console.log(`[admin] Cuenta admin migrada a: ${ADMIN_EMAIL}`);
      return;
    }
    const existing = await authStorage.getUserByEmail(ADMIN_EMAIL);
    if (!existing) {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      await authStorage.createLocalUser({
        email: ADMIN_EMAIL,
        passwordHash,
        firstName: "Fundación",
        lastName: "Study",
        role: "admin",
      });
      console.log(`[admin] Cuenta admin creada: ${ADMIN_EMAIL}`);
    }
  } catch (e) {
    console.error("[admin] Error al crear cuenta admin:", e);
  }
}

// Seed function to initialize the database with basic gamified content
async function seedDatabase() {
  const existingLevels = await storage.getLevels();
  if (existingLevels.length === 0) {
    console.log("Seeding database...");
    
    // Default levels
    const level1 = await db.insert(levels).values({
      name: "Basics 1",
      description: "Learn basic greetings and common phrases.",
      order: 1,
      requiredXp: 0
    }).returning();

    const level2 = await db.insert(levels).values({
      name: "Travel",
      description: "Essential vocabulary for traveling.",
      order: 2,
      requiredXp: 100
    }).returning();

    // Default lessons
    if (level1[0]) {
      await db.insert(lessons).values({
        levelId: level1[0].id,
        title: "Hello & Goodbye",
        content: "Learn how to greet people and say goodbye in formal and informal situations.",
        type: "conversation",
        order: 1
      });
    }

    // Default achievements
    await db.insert(achievements).values([
      { name: "First Steps", description: "Completed your first lesson", icon: "Trophy", requiredXp: 10 },
      { name: "Rising Star", description: "Reached 100 XP", icon: "Star", requiredXp: 100 },
      { name: "Language Master", description: "Reached 500 XP", icon: "Award", requiredXp: 500 }
    ]);

    // Default live classes
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Just a placeholder since instructorId is required and must match a user.
    // For now, we will skip seeding live classes until a user exists, or we create a dummy instructor.
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Register auth routes (register, login, logout, role update)
  registerAuthRoutes(app);

  // Levels & Lessons
  app.get(api.levels.list.path, async (req, res) => {
    const levels = await storage.getLevels();
    res.json(levels);
  });

  app.get(api.lessons.listByLevel.path, async (req, res) => {
    const levelId = Number(req.params.levelId);
    const lessons = await storage.getLessonsByLevel(levelId);
    res.json(lessons);
  });

  app.get(api.lessons.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const lesson = await storage.getLesson(id);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }
    res.json(lesson);
  });

  // User Progress (Protected)
  app.get(api.progress.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const progress = await storage.getUserProgress(userId);
    res.json(progress);
  });

  app.post(api.progress.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { xpToAdd } = api.progress.update.input.parse(req.body);
      const progress = await storage.updateUserXp(userId, xpToAdd);
      res.json(progress);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Live Classes
  app.get(api.liveClasses.list.path, async (req, res) => {
    const classes = await storage.getLiveClasses();
    res.json(classes);
  });

  app.post(api.liveClasses.register.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const classId = Number(req.params.id);
    
    const success = await storage.registerForClass(userId, classId);
    if (success) {
      res.status(201).json({ success: true });
    } else {
      res.status(400).json({ message: "Failed to register" });
    }
  });

  // Achievements
  app.get(api.achievements.list.path, async (req, res) => {
    const achievements = await storage.getAchievements();
    res.json(achievements);
  });

  // AI Exercises
  app.post(api.ai.generateExercise.path, isAuthenticated, async (req, res) => {
    try {
      const { level, topic } = api.ai.generateExercise.input.parse(req.body);
      
      const prompt = `Generate a short language learning conversation exercise for a ${level} level student about ${topic}.
      Return the response in strictly JSON format matching this structure:
      {
        "scenario": "A brief description of the situation",
        "questions": ["Question 1", "Question 2", "Question 3"]
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(result);
    } catch (err) {
      console.error("AI Generation Error:", err);
      res.status(500).json({ message: "Failed to generate exercise" });
    }
  });

  // ─── YouTube API ──────────────────────────────────────────────
  app.get("/api/youtube/search", isAuthenticated, async (req, res) => {
    const { q, max } = req.query;
    const { searchYouTubeVideos, youtubeEnabled } = await import("./youtube");
    if (!youtubeEnabled()) return res.status(503).json({ message: "YouTube API key not configured (YOUTUBE_API_KEY)" });
    try {
      const videos = await searchYouTubeVideos(String(q || "english learning"), Number(max || 8));
      res.json({ videos });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/youtube/embed/:videoId", (req, res) => {
    const { buildYouTubeEmbedUrl } = require("./youtube");
    res.json({ embedUrl: buildYouTubeEmbedUrl(req.params.videoId) });
  });

  app.get("/api/youtube/status", isAuthenticated, (_req, res) => {
    const { youtubeEnabled } = require("./youtube");
    res.json({ enabled: youtubeEnabled(), hasKey: !!process.env.YOUTUBE_API_KEY });
  });

  // ─── Google Drive API ─────────────────────────────────────────
  app.get("/api/drive/status", isAuthenticated, (_req, res) => {
    const { driveEnabled } = require("./gdrive");
    res.json({
      enabled: driveEnabled(),
      hasOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    });
  });

  app.post("/api/drive/embed", isAuthenticated, (req, res) => {
    const { buildEmbedUrl, isValidDriveUrl, getDriveResourceType, extractDriveFileId } = require("./gdrive");
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: "url required" });
    res.json({
      embedUrl: buildEmbedUrl(url),
      isValid: isValidDriveUrl(url),
      resourceType: getDriveResourceType(url),
      fileId: extractDriveFileId(url),
    });
  });

  // ─── Course Resources ─────────────────────────────────────────
  app.get("/api/resources", async (req, res) => {
    const levelId = req.query.levelId ? Number(req.query.levelId) : undefined;
    const resources = await storage.getCourseResources(levelId);
    res.json({ resources });
  });

  app.post("/api/resources", isAuthenticated, requireRole("admin"), async (req, res) => {
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      resourceType: z.enum(["document", "video", "youtube", "drive", "pdf"]).default("document"),
      url: z.string().url(),
      driveFileId: z.string().optional(),
      youtubeVideoId: z.string().optional(),
      levelId: z.number().int().optional(),
      isPublic: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
    });
    const data = schema.parse(req.body);
    const resource = await storage.createCourseResource(data as any);
    res.status(201).json(resource);
  });

  app.delete("/api/resources/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    await storage.deleteCourseResource(Number(req.params.id));
    res.json({ success: true });
  });

  // ─── Payment Receipts (Banco Popular manual transfer) ─────────
  app.post("/api/receipts", isAuthenticated, async (req: any, res) => {
    const schema = z.object({
      planId: z.number().int(),
      amountCOP: z.number().int().min(1000),
      senderName: z.string().min(1),
      senderAccount: z.string().optional(),
      driveReceiptUrl: z.string().url().optional().or(z.literal("")),
      bankName: z.string().default("Banco Popular"),
    });
    const data = schema.parse(req.body);
    const userId = req.user.claims.sub;
    const receipt = await storage.createPaymentReceipt({ ...data, userId, driveReceiptUrl: data.driveReceiptUrl || undefined });
    res.status(201).json(receipt);
  });

  app.get("/api/receipts/me", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const receipts = await storage.getUserReceipts(userId);
    res.json({ receipts });
  });

  app.get("/api/admin/receipts", isAuthenticated, requireRole("admin"), async (_req, res) => {
    const receipts = await storage.getPendingReceipts();
    res.json({ receipts });
  });

  app.patch("/api/admin/receipts/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    const { status, adminNotes } = z.object({
      status: z.enum(["pending", "verified", "rejected"]),
      adminNotes: z.string().optional(),
    }).parse(req.body);
    const receipt = await storage.updateReceiptStatus(Number(req.params.id), status, adminNotes);
    // If verified, activate subscription
    if (status === "verified") {
      const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, receipt.planId));
      if (plan) {
        const ref = `manual-${receipt.id}-${Date.now()}`;
        const sub = await storage.createPendingSubscription(receipt.userId, receipt.planId, ref);
        await storage.updateSubscriptionStatus(ref, "approved", `receipt-${receipt.id}`);
      }
    }
    res.json(receipt);
  });

  // ─── Admin Routes ─────────────────────────────────────────────
  app.get("/api/admin/stats", isAuthenticated, requireRole("admin"), async (_req, res) => {
    const stats = await storage.getAdminStats();
    res.json(stats);
  });

  app.get("/api/admin/users", isAuthenticated, requireRole("admin"), async (_req, res) => {
    const adminUsers = await storage.getAdminUsers();
    const safe = adminUsers.map(({ passwordHash: _, ...u }: any) => u);
    res.json({ users: safe });
  });

  app.patch("/api/admin/users/:userId/role", isAuthenticated, requireRole("admin"), async (req, res) => {
    const { userId } = req.params;
    const { role } = z.object({ role: z.enum(["student", "teacher", "admin", "guest"]) }).parse(req.body);
    const updated = await storage.updateUserRole(userId, role);
    const { passwordHash: _, ...safe } = updated as any;
    res.json(safe);
  });

  app.get("/api/admin/classes", isAuthenticated, requireRole("admin"), async (_req, res) => {
    const classes = await storage.getAdminClasses();
    res.json({ classes });
  });

  app.post("/api/admin/classes", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      scheduledAt: z.string(),
      level: z.string().default("todos"),
      maxStudents: z.number().int().min(1).default(20),
      durationMinutes: z.number().int().min(15).default(45),
      meetingUrl: z.string().url().optional().or(z.literal("")),
    });
    const data = schema.parse(req.body);
    const instructorId = req.user.claims.sub;
    const cls = await storage.createLiveClass({ ...data, instructorId, meetingUrl: data.meetingUrl || undefined });
    res.status(201).json(cls);
  });

  app.delete("/api/admin/classes/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteLiveClass(id);
    res.json({ success: true });
  });

  app.get("/api/admin/api-status", isAuthenticated, requireRole("admin"), (_req, res) => {
    res.json({
      database: true,
      openai: !!(process.env.AI_INTEGRATIONS_OPENAI_API_KEY),
      wompi: !!(process.env.WOMPI_PUBLIC_KEY && process.env.WOMPI_PRIVATE_KEY),
      googleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      youtube: !!(process.env.YOUTUBE_API_KEY),
      googleDrive: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    });
  });

  // ─── Live Classes (public - enrich with instructor info) ────────
  app.get("/api/live-classes/enriched", async (_req, res) => {
    const classes = await storage.getAdminClasses();
    res.json(classes);
  });

  // ─── Subscription Plans ──────────────────────────────────────
  app.get("/api/plans", async (_req, res) => {
    const plans = await storage.getSubscriptionPlans();
    res.json({ plans, wompiEnabled: wompiEnabled(), publicKey: WOMPI_PUBLIC_KEY });
  });

  app.get("/api/subscription", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const sub = await storage.getUserActiveSubscription(userId);
    res.json({ subscription: sub ?? null });
  });

  app.post("/api/subscription/checkout", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const { planSlug } = z.object({ planSlug: z.string() }).parse(req.body);

    const plan = await storage.getSubscriptionPlanBySlug(planSlug);
    if (!plan) return res.status(404).json({ message: "Plan no encontrado" });
    if (plan.priceInCents === 0) return res.status(400).json({ message: "El plan gratuito no requiere pago" });
    if (!wompiEnabled()) return res.status(503).json({ message: "Pasarela de pago no configurada" });

    const userEmail = req.user?.claims?.email ?? undefined;
    const reference = generateReference(userId, plan.slug);
    const signature = await generateIntegritySignature(reference, plan.priceInCents, plan.currency);

    const host = `${req.protocol}://${req.get("host")}`;
    const redirectUrl = `${host}/planes?ref=${reference}`;

    const checkoutUrl = buildCheckoutUrl(
      reference,
      plan.priceInCents,
      plan.currency,
      signature,
      redirectUrl,
      userEmail,
    );

    await storage.createPendingSubscription(userId, plan.id, reference);
    res.json({ checkoutUrl, reference });
  });

  app.get("/api/subscription/verify/:reference", isAuthenticated, async (req: any, res) => {
    const { reference } = req.params;
    const sub = await storage.updateSubscriptionStatus(reference, "checking");
    if (!sub) return res.status(404).json({ message: "Suscripción no encontrada" });

    if (sub.wompiTransactionId) {
      const tx = await getTransaction(sub.wompiTransactionId);
      if (tx) {
        const status = tx.status === "APPROVED" ? "approved" : tx.status.toLowerCase();
        await storage.updateSubscriptionStatus(reference, status, tx.id);
        return res.json({ status });
      }
    }

    res.json({ status: sub.status });
  });

  app.post("/api/webhooks/wompi", async (req, res) => {
    try {
      const signature = req.headers["x-event-checksum"] as string;
      const timestamp = req.headers["x-timestamp"] as string;
      const rawBody = typeof req.rawBody === "string" ? req.rawBody : JSON.stringify(req.body);

      if (signature && timestamp && !verifyWebhookSignature(rawBody, timestamp, signature)) {
        return res.status(401).json({ message: "Invalid signature" });
      }

      const event = req.body;
      if (event?.event === "transaction.updated") {
        const tx = event?.data?.transaction;
        if (tx?.reference && tx?.id && tx?.status) {
          const status = tx.status === "APPROVED" ? "approved" : tx.status.toLowerCase();
          await storage.updateSubscriptionStatus(tx.reference, status, tx.id);
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Wompi webhook error:", err);
      res.status(400).json({ message: "Webhook error" });
    }
  });

  // Call seed database and admin account
  seedDatabase().catch(console.error);
  storage.seedSubscriptionPlans().catch(console.error);
  seedAdminAccount().catch(console.error);

  return httpServer;
}
