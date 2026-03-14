import { db } from "./db";
import { 
  levels, lessons, userProgress, lessonCompletions,
  achievements, userAchievements, liveClasses, classRegistrations,
  plans, subscriptions, payments, invoices, certificates,
  promotions, notifications, teacherProfiles, videoRooms, recordings,
  users,
  type Level, type Lesson, type UserProgress, type Achievement,
  type LiveClass, type LessonCompletion, type Plan, type Subscription,
  type Payment, type Invoice, type Certificate, type Promotion,
  type Notification, type TeacherProfile, type VideoRoom, type Recording,
} from "@shared/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import type { User } from "@shared/models/auth";

// ─── Interface ───────────────────────────────────────────────────────────────

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
  getLiveClass(id: number): Promise<LiveClass | undefined>;
  createLiveClass(data: Partial<typeof liveClasses.$inferInsert>): Promise<LiveClass>;
  updateLiveClass(id: number, data: Partial<typeof liveClasses.$inferInsert>): Promise<LiveClass>;
  deleteLiveClass(id: number): Promise<void>;
  registerForClass(userId: string, classId: number): Promise<boolean>;
  getClassRegistrations(classId: number): Promise<{ userId: string }[]>;

  // Achievements
  getAchievements(): Promise<Achievement[]>;

  // Plans
  getPlans(): Promise<Plan[]>;
  getPlan(id: number): Promise<Plan | undefined>;
  createPlan(data: Partial<typeof plans.$inferInsert>): Promise<Plan>;
  updatePlan(id: number, data: Partial<typeof plans.$inferInsert>): Promise<Plan>;

  // Subscriptions
  getUserSubscription(userId: string): Promise<(Subscription & { plan: Plan }) | undefined>;
  createSubscription(data: Partial<typeof subscriptions.$inferInsert>): Promise<Subscription>;
  updateSubscription(id: number, data: Partial<typeof subscriptions.$inferInsert>): Promise<Subscription>;
  getAllSubscriptions(): Promise<(Subscription & { plan: Plan; user: User })[]>;

  // Payments
  createPayment(data: Partial<typeof payments.$inferInsert>): Promise<Payment>;
  getUserPayments(userId: string): Promise<Payment[]>;
  getAllPayments(): Promise<(Payment & { user: User })[]>;
  updatePayment(id: number, data: Partial<typeof payments.$inferInsert>): Promise<Payment>;

  // Invoices
  getUserInvoices(userId: string): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(number: string): Promise<Invoice | undefined>;
  createInvoice(data: Partial<typeof invoices.$inferInsert>): Promise<Invoice>;
  getAllInvoices(): Promise<(Invoice & { user: User })[]>;
  updateInvoice(id: number, data: Partial<typeof invoices.$inferInsert>): Promise<Invoice>;

  // Certificates
  getUserCertificates(userId: string): Promise<Certificate[]>;
  getCertificate(id: number): Promise<Certificate | undefined>;
  getCertificateByCode(code: string): Promise<Certificate | undefined>;
  createCertificate(data: Partial<typeof certificates.$inferInsert>): Promise<Certificate>;
  getAllCertificates(): Promise<(Certificate & { user: User })[]>;

  // Promotions
  getPromotions(): Promise<Promotion[]>;
  getPromotion(id: number): Promise<Promotion | undefined>;
  getPromotionByCode(code: string): Promise<Promotion | undefined>;
  createPromotion(data: Partial<typeof promotions.$inferInsert>): Promise<Promotion>;
  updatePromotion(id: number, data: Partial<typeof promotions.$inferInsert>): Promise<Promotion>;
  deletePromotion(id: number): Promise<void>;

  // Notifications
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(data: Partial<typeof notifications.$inferInsert>): Promise<Notification>;
  markNotificationRead(id: number, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  // Teacher Profiles
  getTeacherProfile(userId: string): Promise<TeacherProfile | undefined>;
  upsertTeacherProfile(userId: string, data: Partial<typeof teacherProfiles.$inferInsert>): Promise<TeacherProfile>;
  getTeachers(): Promise<(User & { profile: TeacherProfile | null })[]>;

  // Video Rooms
  createVideoRoom(data: Partial<typeof videoRooms.$inferInsert>): Promise<VideoRoom>;
  getVideoRoom(roomCode: string): Promise<VideoRoom | undefined>;
  updateVideoRoom(id: number, data: Partial<typeof videoRooms.$inferInsert>): Promise<VideoRoom>;

  // Recordings
  getRecordings(): Promise<Recording[]>;
  getRecording(id: number): Promise<Recording | undefined>;
  createRecording(data: Partial<typeof recordings.$inferInsert>): Promise<Recording>;
  updateRecording(id: number, data: Partial<typeof recordings.$inferInsert>): Promise<Recording>;
  deleteRecording(id: number): Promise<void>;

  // Admin stats
  getAdminStats(): Promise<{
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalRevenue: number;
    activeSubscriptions: number;
    totalClasses: number;
  }>;

  // Users
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User>;
}

// ─── Implementation ──────────────────────────────────────────────────────────

export class DatabaseStorage implements IStorage {

  // Levels & Lessons
  async getLevels(): Promise<Level[]> {
    return await db.select().from(levels).orderBy(levels.order);
  }
  async getLessonsByLevel(levelId: number): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.levelId, levelId)).orderBy(lessons.order);
  }
  async getLesson(id: number): Promise<Lesson | undefined> {
    const [r] = await db.select().from(lessons).where(eq(lessons.id, id));
    return r;
  }

  // Progress
  async getUserProgress(userId: string): Promise<UserProgress | undefined> {
    const [p] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));
    if (!p) {
      const [np] = await db.insert(userProgress).values({ userId, xp: 0, streakDays: 0 }).returning();
      return np;
    }
    return p;
  }
  async updateUserXp(userId: string, xpToAdd: number): Promise<UserProgress> {
    const cur = await this.getUserProgress(userId);
    const newXp = (cur?.xp || 0) + xpToAdd;
    const newCompleted = (cur?.totalLessonsCompleted || 0) + 1;
    const [u] = await db.update(userProgress)
      .set({ xp: newXp, lastActive: new Date(), totalLessonsCompleted: newCompleted })
      .where(eq(userProgress.userId, userId)).returning();
    return u;
  }

  // Live Classes
  async getLiveClasses(): Promise<LiveClass[]> {
    return await db.select().from(liveClasses).orderBy(liveClasses.scheduledAt);
  }
  async getLiveClass(id: number): Promise<LiveClass | undefined> {
    const [r] = await db.select().from(liveClasses).where(eq(liveClasses.id, id));
    return r;
  }
  async createLiveClass(data: Partial<typeof liveClasses.$inferInsert>): Promise<LiveClass> {
    const [r] = await db.insert(liveClasses).values(data as any).returning();
    return r;
  }
  async updateLiveClass(id: number, data: Partial<typeof liveClasses.$inferInsert>): Promise<LiveClass> {
    const [r] = await db.update(liveClasses).set(data as any).where(eq(liveClasses.id, id)).returning();
    return r;
  }
  async deleteLiveClass(id: number): Promise<void> {
    await db.delete(liveClasses).where(eq(liveClasses.id, id));
  }
  async registerForClass(userId: string, classId: number): Promise<boolean> {
    try {
      await db.insert(classRegistrations).values({ userId, classId });
      return true;
    } catch { return false; }
  }
  async getClassRegistrations(classId: number): Promise<{ userId: string }[]> {
    return await db.select({ userId: classRegistrations.userId })
      .from(classRegistrations).where(eq(classRegistrations.classId, classId));
  }

  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  // Plans
  async getPlans(): Promise<Plan[]> {
    return await db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.sortOrder);
  }
  async getPlan(id: number): Promise<Plan | undefined> {
    const [r] = await db.select().from(plans).where(eq(plans.id, id));
    return r;
  }
  async createPlan(data: Partial<typeof plans.$inferInsert>): Promise<Plan> {
    const [r] = await db.insert(plans).values(data as any).returning();
    return r;
  }
  async updatePlan(id: number, data: Partial<typeof plans.$inferInsert>): Promise<Plan> {
    const [r] = await db.update(plans).set(data as any).where(eq(plans.id, id)).returning();
    return r;
  }

  // Subscriptions
  async getUserSubscription(userId: string): Promise<(Subscription & { plan: Plan }) | undefined> {
    const [r] = await db.select({
      id: subscriptions.id, userId: subscriptions.userId,
      planId: subscriptions.planId, status: subscriptions.status,
      startDate: subscriptions.startDate, endDate: subscriptions.endDate,
      autoRenew: subscriptions.autoRenew, promoCode: subscriptions.promoCode,
      discountAmount: subscriptions.discountAmount,
      createdAt: subscriptions.createdAt, updatedAt: subscriptions.updatedAt,
      plan: plans,
    }).from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
      .orderBy(desc(subscriptions.createdAt)).limit(1);
    return r as any;
  }
  async createSubscription(data: Partial<typeof subscriptions.$inferInsert>): Promise<Subscription> {
    const [r] = await db.insert(subscriptions).values(data as any).returning();
    return r;
  }
  async updateSubscription(id: number, data: Partial<typeof subscriptions.$inferInsert>): Promise<Subscription> {
    const [r] = await db.update(subscriptions).set({ ...data as any, updatedAt: new Date() })
      .where(eq(subscriptions.id, id)).returning();
    return r;
  }
  async getAllSubscriptions(): Promise<(Subscription & { plan: Plan; user: User })[]> {
    const rows = await db.select({
      id: subscriptions.id, userId: subscriptions.userId,
      planId: subscriptions.planId, status: subscriptions.status,
      startDate: subscriptions.startDate, endDate: subscriptions.endDate,
      autoRenew: subscriptions.autoRenew, promoCode: subscriptions.promoCode,
      discountAmount: subscriptions.discountAmount,
      createdAt: subscriptions.createdAt, updatedAt: subscriptions.updatedAt,
      plan: plans,
      user: users,
    }).from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.createdAt));
    return rows as any;
  }

  // Payments
  async createPayment(data: Partial<typeof payments.$inferInsert>): Promise<Payment> {
    const [r] = await db.insert(payments).values(data as any).returning();
    return r;
  }
  async getUserPayments(userId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
  }
  async getAllPayments(): Promise<(Payment & { user: User })[]> {
    const rows = await db.select({ payment: payments, user: users })
      .from(payments).innerJoin(users, eq(payments.userId, users.id))
      .orderBy(desc(payments.createdAt));
    return rows.map(r => ({ ...r.payment, user: r.user })) as any;
  }
  async updatePayment(id: number, data: Partial<typeof payments.$inferInsert>): Promise<Payment> {
    const [r] = await db.update(payments).set(data as any).where(eq(payments.id, id)).returning();
    return r;
  }

  // Invoices
  async getUserInvoices(userId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.issuedAt));
  }
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [r] = await db.select().from(invoices).where(eq(invoices.id, id));
    return r;
  }
  async getInvoiceByNumber(number: string): Promise<Invoice | undefined> {
    const [r] = await db.select().from(invoices).where(eq(invoices.invoiceNumber, number));
    return r;
  }
  async createInvoice(data: Partial<typeof invoices.$inferInsert>): Promise<Invoice> {
    const [r] = await db.insert(invoices).values(data as any).returning();
    return r;
  }
  async getAllInvoices(): Promise<(Invoice & { user: User })[]> {
    const rows = await db.select({ invoice: invoices, user: users })
      .from(invoices).innerJoin(users, eq(invoices.userId, users.id))
      .orderBy(desc(invoices.issuedAt));
    return rows.map(r => ({ ...r.invoice, user: r.user })) as any;
  }
  async updateInvoice(id: number, data: Partial<typeof invoices.$inferInsert>): Promise<Invoice> {
    const [r] = await db.update(invoices).set(data as any).where(eq(invoices.id, id)).returning();
    return r;
  }

  // Certificates
  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return await db.select().from(certificates).where(eq(certificates.userId, userId)).orderBy(desc(certificates.issuedAt));
  }
  async getCertificate(id: number): Promise<Certificate | undefined> {
    const [r] = await db.select().from(certificates).where(eq(certificates.id, id));
    return r;
  }
  async getCertificateByCode(code: string): Promise<Certificate | undefined> {
    const [r] = await db.select().from(certificates).where(eq(certificates.certificateCode, code));
    return r;
  }
  async createCertificate(data: Partial<typeof certificates.$inferInsert>): Promise<Certificate> {
    const [r] = await db.insert(certificates).values(data as any).returning();
    return r;
  }
  async getAllCertificates(): Promise<(Certificate & { user: User })[]> {
    const rows = await db.select({ cert: certificates, user: users })
      .from(certificates).innerJoin(users, eq(certificates.userId, users.id))
      .orderBy(desc(certificates.issuedAt));
    return rows.map(r => ({ ...r.cert, user: r.user })) as any;
  }

  // Promotions
  async getPromotions(): Promise<Promotion[]> {
    return await db.select().from(promotions).orderBy(desc(promotions.createdAt));
  }
  async getPromotion(id: number): Promise<Promotion | undefined> {
    const [r] = await db.select().from(promotions).where(eq(promotions.id, id));
    return r;
  }
  async getPromotionByCode(code: string): Promise<Promotion | undefined> {
    const [r] = await db.select().from(promotions).where(eq(promotions.code, code.toUpperCase()));
    return r;
  }
  async createPromotion(data: Partial<typeof promotions.$inferInsert>): Promise<Promotion> {
    const [r] = await db.insert(promotions).values({ ...data as any, code: (data.code as string)?.toUpperCase() }).returning();
    return r;
  }
  async updatePromotion(id: number, data: Partial<typeof promotions.$inferInsert>): Promise<Promotion> {
    const [r] = await db.update(promotions).set(data as any).where(eq(promotions.id, id)).returning();
    return r;
  }
  async deletePromotion(id: number): Promise<void> {
    await db.delete(promotions).where(eq(promotions.id, id));
  }

  // Notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt)).limit(50);
  }
  async createNotification(data: Partial<typeof notifications.$inferInsert>): Promise<Notification> {
    const [r] = await db.insert(notifications).values(data as any).returning();
    return r;
  }
  async markNotificationRead(id: number, userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }
  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  // Teacher Profiles
  async getTeacherProfile(userId: string): Promise<TeacherProfile | undefined> {
    const [r] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId));
    return r;
  }
  async upsertTeacherProfile(userId: string, data: Partial<typeof teacherProfiles.$inferInsert>): Promise<TeacherProfile> {
    const existing = await this.getTeacherProfile(userId);
    if (existing) {
      const [r] = await db.update(teacherProfiles).set(data as any).where(eq(teacherProfiles.userId, userId)).returning();
      return r;
    }
    const [r] = await db.insert(teacherProfiles).values({ userId, ...data as any }).returning();
    return r;
  }
  async getTeachers(): Promise<(User & { profile: TeacherProfile | null })[]> {
    const rows = await db.select({ user: users, profile: teacherProfiles })
      .from(users).where(eq(users.role, "teacher"))
      .leftJoin(teacherProfiles, eq(users.id, teacherProfiles.userId));
    return rows.map(r => ({ ...r.user, profile: r.profile })) as any;
  }

  // Video Rooms
  async createVideoRoom(data: Partial<typeof videoRooms.$inferInsert>): Promise<VideoRoom> {
    const [r] = await db.insert(videoRooms).values(data as any).returning();
    return r;
  }
  async getVideoRoom(roomCode: string): Promise<VideoRoom | undefined> {
    const [r] = await db.select().from(videoRooms).where(eq(videoRooms.roomCode, roomCode));
    return r;
  }
  async updateVideoRoom(id: number, data: Partial<typeof videoRooms.$inferInsert>): Promise<VideoRoom> {
    const [r] = await db.update(videoRooms).set(data as any).where(eq(videoRooms.id, id)).returning();
    return r;
  }

  // Recordings
  async getRecordings(): Promise<Recording[]> {
    return await db.select().from(recordings).orderBy(desc(recordings.createdAt));
  }
  async getRecording(id: number): Promise<Recording | undefined> {
    const [r] = await db.select().from(recordings).where(eq(recordings.id, id));
    return r;
  }
  async createRecording(data: Partial<typeof recordings.$inferInsert>): Promise<Recording> {
    const [r] = await db.insert(recordings).values(data as any).returning();
    return r;
  }
  async updateRecording(id: number, data: Partial<typeof recordings.$inferInsert>): Promise<Recording> {
    const [r] = await db.update(recordings).set(data as any).where(eq(recordings.id, id)).returning();
    return r;
  }
  async deleteRecording(id: number): Promise<void> {
    await db.delete(recordings).where(eq(recordings.id, id));
  }

  // Admin Stats
  async getAdminStats() {
    const [totalUsersRow] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [studentsRow] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "student"));
    const [teachersRow] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "teacher"));
    const [revenueRow] = await db.select({ total: sql<string>`coalesce(sum(amount), 0)` }).from(payments).where(eq(payments.status, "completed"));
    const [activeSubs] = await db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.status, "active"));
    const [classesRow] = await db.select({ count: sql<number>`count(*)` }).from(liveClasses);
    return {
      totalUsers: Number(totalUsersRow?.count || 0),
      totalStudents: Number(studentsRow?.count || 0),
      totalTeachers: Number(teachersRow?.count || 0),
      totalRevenue: Number(revenueRow?.total || 0),
      activeSubscriptions: Number(activeSubs?.count || 0),
      totalClasses: Number(classesRow?.count || 0),
    };
  }

  // Users
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  async updateUserRole(userId: string, role: string): Promise<User> {
    const [r] = await db.update(users).set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, userId)).returning();
    return r;
  }
}

export const storage = new DatabaseStorage();
