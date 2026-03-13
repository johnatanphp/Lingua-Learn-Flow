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
  type Level,
  type Lesson,
  type UserProgress,
  type Achievement,
  type LiveClass,
  type LessonCompletion,
  type SubscriptionPlan,
  type UserSubscription,
} from "@shared/schema";
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
