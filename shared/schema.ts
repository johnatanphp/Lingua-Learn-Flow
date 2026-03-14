import { pgTable, text, serial, integer, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, sessions } from "./models/auth";
export { users, sessions };

export const levels = pgTable("levels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull(),
  requiredXp: integer("required_xp").notNull().default(0),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  levelId: integer("level_id").notNull().references(() => levels.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'conversation', 'pronunciation', 'reading'
  order: integer("order").notNull(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  xp: integer("xp").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  lastActive: timestamp("last_active"),
});

export const lessonCompletions = pgTable("lesson_completions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  score: integer("score").notNull().default(0),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  requiredXp: integer("required_xp").notNull(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const liveClasses = pgTable("live_classes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  instructorId: varchar("instructor_id").notNull().references(() => users.id),
  meetingUrl: text("meeting_url"),
  youtubeStreamId: varchar("youtube_stream_id", { length: 64 }),
  youtubeChannelId: varchar("youtube_channel_id", { length: 64 }),
  driveResourceUrl: text("drive_resource_url"),
  maxStudents: integer("max_students").notNull().default(20),
  durationMinutes: integer("duration_minutes").notNull().default(45),
  level: varchar("level", { length: 30 }).notNull().default("todos"),
});

export const classRegistrations = pgTable("class_registrations", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => liveClasses.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  registeredAt: timestamp("registered_at").defaultNow(),
});

// ─── Subscription Plans ──────────────────────────────────────────
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  priceInCents: integer("price_in_cents").notNull().default(0),
  currency: varchar("currency", { length: 10 }).notNull().default("COP"),
  features: text("features").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  wompiTransactionId: varchar("wompi_transaction_id", { length: 100 }),
  wompiReference: varchar("wompi_reference", { length: 100 }),
  startedAt: timestamp("started_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Course Resources (Google Drive + YouTube) ───────────────────
export const courseResources = pgTable("course_resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  resourceType: varchar("resource_type", { length: 30 }).notNull().default("document"),
  url: text("url").notNull(),
  driveFileId: varchar("drive_file_id", { length: 100 }),
  youtubeVideoId: varchar("youtube_video_id", { length: 30 }),
  levelId: integer("level_id").references(() => levels.id),
  isPublic: boolean("is_public").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Payment Receipts (Banco Popular manual transfers) ────────────
export const paymentReceipts = pgTable("payment_receipts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  amountCOP: integer("amount_cop").notNull(),
  bankName: varchar("bank_name", { length: 100 }).notNull().default("Banco Popular"),
  senderName: text("sender_name").notNull(),
  senderAccount: varchar("sender_account", { length: 50 }),
  driveReceiptUrl: text("drive_receipt_url"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  adminNotes: text("admin_notes"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Schemas
export const insertLevelSchema = createInsertSchema(levels).omit({ id: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true });
export const insertLiveClassSchema = createInsertSchema(liveClasses).omit({ id: true });
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ id: true });
export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({ id: true });
export const insertCourseResourceSchema = createInsertSchema(courseResources).omit({ id: true, createdAt: true });
export const insertPaymentReceiptSchema = createInsertSchema(paymentReceipts).omit({ id: true, submittedAt: true, reviewedAt: true });

export type Level = typeof levels.$inferSelect;
export type InsertLevel = z.infer<typeof insertLevelSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type LiveClass = typeof liveClasses.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type LessonCompletion = typeof lessonCompletions.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type CourseResource = typeof courseResources.$inferSelect;
export type PaymentReceipt = typeof paymentReceipts.$inferSelect;
