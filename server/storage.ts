import { db } from "./db";
import { 
  levels, 
  lessons, 
  userProgress, 
  lessonCompletions, 
  achievements, 
  userAchievements,
  liveClasses,
  classRegistrations,
  subscriptionPlans,
  userSubscriptions,
  courseResources,
  paymentReceipts,
  type Level,
  type Lesson,
  type UserProgress,
  type Achievement,
  type LiveClass,
  type LessonCompletion,
  type SubscriptionPlan,
  type UserSubscription,
  type CourseResource,
  type PaymentReceipt,
} from "@shared/schema";
import { users, type User } from "@shared/models/auth";
import { authStorage } from "./replit_integrations/auth/storage";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Levels & Lessons
  getLevels(): Promise<Level[]>;
  getLessonsByLevel(levelId: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  
  // Progress
  getUserProgress(userId: string): Promise<UserProgress | undefined>;
  updateUserXp(userId: string, xpToAdd: number): Promise<UserProgress>;
  
  // Classes
  getLiveClasses(): Promise<LiveClass[]>;
  registerForClass(userId: string, classId: number): Promise<boolean>;
  
  // Achievements
  getAchievements(): Promise<Achievement[]>;

  // Subscriptions
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlanBySlug(slug: string): Promise<SubscriptionPlan | undefined>;
  getUserActiveSubscription(userId: string): Promise<(UserSubscription & { plan: SubscriptionPlan }) | undefined>;
  createPendingSubscription(userId: string, planId: number, reference: string): Promise<UserSubscription>;
  updateSubscriptionStatus(reference: string, status: string, transactionId?: string): Promise<UserSubscription | undefined>;
  seedSubscriptionPlans(): Promise<void>;

  // Admin
  getAdminStats(): Promise<{ totalUsers: number; totalClasses: number; activeSubscriptions: number; totalLevels: number }>;
  getAdminUsers(): Promise<User[]>;
  getAdminClasses(): Promise<Array<{ id: number; title: string; description: string; scheduledAt: Date; level: string; maxStudents: number; durationMinutes: number; meetingUrl: string | null; youtubeStreamId: string | null; youtubeChannelId: string | null; driveResourceUrl: string | null; instructorName: string; registrationCount: number; }>>;
  createLiveClass(data: { title: string; description: string; scheduledAt: Date | string; instructorId: string; level: string; maxStudents: number; durationMinutes: number; meetingUrl?: string; youtubeStreamId?: string; youtubeChannelId?: string; driveResourceUrl?: string; }): Promise<LiveClass>;
  deleteLiveClass(id: number): Promise<void>;
  updateUserRole(userId: string, role: string): Promise<User>;

  // Course Resources
  getCourseResources(levelId?: number): Promise<CourseResource[]>;
  createCourseResource(data: Omit<CourseResource, "id" | "createdAt">): Promise<CourseResource>;
  deleteCourseResource(id: number): Promise<void>;

  // Payment Receipts
  createPaymentReceipt(data: { userId: string; planId: number; amountCOP: number; senderName: string; senderAccount?: string; driveReceiptUrl?: string; bankName?: string; }): Promise<PaymentReceipt>;
  getUserReceipts(userId: string): Promise<PaymentReceipt[]>;
  getPendingReceipts(): Promise<Array<PaymentReceipt & { user: Partial<User>; planName: string }>>;
  updateReceiptStatus(id: number, status: string, adminNotes?: string): Promise<PaymentReceipt>;
}

export class DatabaseStorage implements IStorage {
  async getLevels(): Promise<Level[]> {
    return await db.select().from(levels).orderBy(levels.order);
  }

  async getLessonsByLevel(levelId: number): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.levelId, levelId)).orderBy(lessons.order);
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async getUserProgress(userId: string): Promise<UserProgress | undefined> {
    const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));
    
    // Auto-create if doesn't exist
    if (!progress) {
      const [newProgress] = await db.insert(userProgress).values({ userId, xp: 0, streakDays: 0 }).returning();
      return newProgress;
    }
    
    return progress;
  }

  async updateUserXp(userId: string, xpToAdd: number): Promise<UserProgress> {
    const currentProgress = await this.getUserProgress(userId);
    const newXp = (currentProgress?.xp || 0) + xpToAdd;
    
    const [updated] = await db.update(userProgress)
      .set({ xp: newXp, lastActive: new Date() })
      .where(eq(userProgress.userId, userId))
      .returning();
      
    return updated;
  }

  async getLiveClasses(): Promise<LiveClass[]> {
    return await db.select().from(liveClasses).orderBy(liveClasses.scheduledAt);
  }

  async registerForClass(userId: string, classId: number): Promise<boolean> {
    try {
      await db.insert(classRegistrations).values({ userId, classId });
      return true;
    } catch (e) {
      return false; // likely unique constraint violation or non-existent class
    }
  }

  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  // ─── Subscriptions ────────────────────────────────────────────
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.sortOrder);
  }

  async getSubscriptionPlanBySlug(slug: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.slug, slug));
    return plan;
  }

  async getUserActiveSubscription(userId: string): Promise<(UserSubscription & { plan: SubscriptionPlan }) | undefined> {
    const rows = await db.select({
      sub: userSubscriptions,
      plan: subscriptionPlans,
    })
      .from(userSubscriptions)
      .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, "approved"),
      ))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);

    if (!rows[0]) return undefined;
    return { ...rows[0].sub, plan: rows[0].plan };
  }

  async createPendingSubscription(userId: string, planId: number, reference: string): Promise<UserSubscription> {
    const [sub] = await db.insert(userSubscriptions).values({
      userId,
      planId,
      status: "pending",
      wompiReference: reference,
    }).returning();
    return sub;
  }

  async updateSubscriptionStatus(reference: string, status: string, transactionId?: string): Promise<UserSubscription | undefined> {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);

    const [sub] = await db.update(userSubscriptions)
      .set({
        status,
        wompiTransactionId: transactionId,
        startedAt: status === "approved" ? now : undefined,
        expiresAt: status === "approved" ? expiresAt : undefined,
        updatedAt: now,
      })
      .where(eq(userSubscriptions.wompiReference, reference))
      .returning();
    return sub;
  }

  async getAdminStats(): Promise<{ totalUsers: number; totalClasses: number; activeSubscriptions: number; totalLevels: number }> {
    const [usersResult, classesResult, subsResult, levelsResult] = await Promise.all([
      db.select().from(users),
      db.select().from(liveClasses),
      db.select().from(userSubscriptions).where(eq(userSubscriptions.status, "approved")),
      db.select().from(levels),
    ]);
    return {
      totalUsers: usersResult.length,
      totalClasses: classesResult.length,
      activeSubscriptions: subsResult.length,
      totalLevels: levelsResult.length,
    };
  }

  async getAdminUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async getAdminClasses(): Promise<Array<{
    id: number; title: string; description: string; scheduledAt: Date;
    level: string; maxStudents: number; durationMinutes: number;
    meetingUrl: string | null; youtubeStreamId: string | null; youtubeChannelId: string | null;
    driveResourceUrl: string | null; instructorName: string; registrationCount: number;
  }>> {
    const classes = await db.select().from(liveClasses).orderBy(liveClasses.scheduledAt);
    const result = await Promise.all(classes.map(async (cls) => {
      const instructor = await authStorage.getUser(cls.instructorId);
      const regs = await db.select().from(classRegistrations).where(eq(classRegistrations.classId, cls.id));
      return {
        id: cls.id,
        title: cls.title,
        description: cls.description,
        scheduledAt: cls.scheduledAt,
        level: cls.level,
        maxStudents: cls.maxStudents,
        durationMinutes: cls.durationMinutes,
        meetingUrl: cls.meetingUrl ?? null,
        youtubeStreamId: cls.youtubeStreamId ?? null,
        youtubeChannelId: cls.youtubeChannelId ?? null,
        driveResourceUrl: cls.driveResourceUrl ?? null,
        instructorName: instructor ? `${instructor.firstName ?? ""} ${instructor.lastName ?? ""}`.trim() || instructor.email || "Admin" : "Admin",
        registrationCount: regs.length,
      };
    }));
    return result;
  }

  async createLiveClass(data: {
    title: string; description: string; scheduledAt: Date | string;
    instructorId: string; level: string; maxStudents: number;
    durationMinutes: number; meetingUrl?: string;
    youtubeStreamId?: string; youtubeChannelId?: string; driveResourceUrl?: string;
  }): Promise<LiveClass> {
    const [cls] = await db.insert(liveClasses).values({
      title: data.title,
      description: data.description,
      scheduledAt: new Date(data.scheduledAt),
      instructorId: data.instructorId,
      level: data.level,
      maxStudents: data.maxStudents,
      durationMinutes: data.durationMinutes,
      meetingUrl: data.meetingUrl || null,
      youtubeStreamId: data.youtubeStreamId || null,
      youtubeChannelId: data.youtubeChannelId || null,
      driveResourceUrl: data.driveResourceUrl || null,
    }).returning();
    return cls;
  }

  // ── Course Resources ─────────────────────────────────────────────
  async getCourseResources(levelId?: number): Promise<CourseResource[]> {
    if (levelId) {
      return await db.select().from(courseResources)
        .where(eq(courseResources.levelId, levelId))
        .orderBy(courseResources.sortOrder, courseResources.createdAt);
    }
    return await db.select().from(courseResources).orderBy(courseResources.sortOrder, courseResources.createdAt);
  }

  async createCourseResource(data: Omit<CourseResource, "id" | "createdAt">): Promise<CourseResource> {
    const [resource] = await db.insert(courseResources).values(data).returning();
    return resource;
  }

  async deleteCourseResource(id: number): Promise<void> {
    await db.delete(courseResources).where(eq(courseResources.id, id));
  }

  // ── Payment Receipts ─────────────────────────────────────────────
  async createPaymentReceipt(data: {
    userId: string; planId: number; amountCOP: number; senderName: string;
    senderAccount?: string; driveReceiptUrl?: string; bankName?: string;
  }): Promise<PaymentReceipt> {
    const [receipt] = await db.insert(paymentReceipts).values({
      userId: data.userId,
      planId: data.planId,
      amountCOP: data.amountCOP,
      senderName: data.senderName,
      senderAccount: data.senderAccount || null,
      driveReceiptUrl: data.driveReceiptUrl || null,
      bankName: data.bankName || "Banco Popular",
      status: "pending",
    }).returning();
    return receipt;
  }

  async getUserReceipts(userId: string): Promise<PaymentReceipt[]> {
    return await db.select().from(paymentReceipts)
      .where(eq(paymentReceipts.userId, userId))
      .orderBy(desc(paymentReceipts.submittedAt));
  }

  async getPendingReceipts(): Promise<Array<PaymentReceipt & { user: Partial<User>; planName: string }>> {
    const receipts = await db.select().from(paymentReceipts)
      .orderBy(desc(paymentReceipts.submittedAt));
    return await Promise.all(receipts.map(async (r) => {
      const user = await authStorage.getUser(r.userId);
      const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, r.planId));
      return {
        ...r,
        user: { id: user?.id, email: user?.email, firstName: user?.firstName, lastName: user?.lastName },
        planName: plan?.name ?? "Plan desconocido",
      };
    }));
  }

  async updateReceiptStatus(id: number, status: string, adminNotes?: string): Promise<PaymentReceipt> {
    const [receipt] = await db.update(paymentReceipts).set({
      status,
      adminNotes: adminNotes ?? null,
      reviewedAt: new Date(),
    }).where(eq(paymentReceipts.id, id)).returning();
    return receipt;
  }

  async deleteLiveClass(id: number): Promise<void> {
    await db.delete(classRegistrations).where(eq(classRegistrations.classId, id));
    await db.delete(liveClasses).where(eq(liveClasses.id, id));
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    return await authStorage.updateUserRole(userId, role);
  }

  async seedSubscriptionPlans(): Promise<void> {
    const existing = await db.select().from(subscriptionPlans);
    if (existing.length > 0) return;

    await db.insert(subscriptionPlans).values([
      {
        slug: "gratis",
        name: "Gratis",
        description: "Comienza tu viaje de aprendizaje sin costo alguno",
        priceInCents: 0,
        currency: "COP",
        features: [
          "Acceso a los primeros 3 niveles",
          "5 lecciones por día",
          "Ejercicios básicos de IA",
          "Seguimiento de progreso",
        ],
        sortOrder: 1,
      },
      {
        slug: "basico",
        name: "Básico",
        description: "Aprende más rápido con acceso completo al contenido",
        priceInCents: 2990000,
        currency: "COP",
        features: [
          "Todos los niveles desbloqueados",
          "Lecciones ilimitadas",
          "Sin publicidad",
          "Ejercicios de IA ilimitados",
          "Soporte por correo",
        ],
        sortOrder: 2,
      },
      {
        slug: "premium",
        name: "Premium",
        description: "La experiencia completa para dominar el idioma",
        priceInCents: 5990000,
        currency: "COP",
        features: [
          "Todo lo del plan Básico",
          "Clases en vivo ilimitadas",
          "Certificados de completitud",
          "Tutoría personalizada con IA",
          "Soporte prioritario 24/7",
          "Acceso anticipado a nuevos módulos",
        ],
        sortOrder: 3,
      },
    ]);
  }
}

export const storage = new DatabaseStorage();
