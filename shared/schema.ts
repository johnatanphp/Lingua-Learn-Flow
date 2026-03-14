import {
  pgTable, text, serial, integer, timestamp, varchar,
  boolean, numeric, jsonb
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { users, sessions } from "./models/auth";
export { users, sessions };

// ─── Core Learning ──────────────────────────────────────────────────────────

export const levels = pgTable("levels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull(),
  requiredXp: integer("required_xp").notNull().default(0),
  imageUrl: text("image_url"),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  levelId: integer("level_id").notNull().references(() => levels.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(),
  order: integer("order").notNull(),
  durationMinutes: integer("duration_minutes").default(10),
  videoUrl: text("video_url"),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  xp: integer("xp").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  lastActive: timestamp("last_active"),
  level: integer("level").notNull().default(1),
  totalLessonsCompleted: integer("total_lessons_completed").notNull().default(0),
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
  category: text("category").default("general"),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// ─── Live Classes & Video ────────────────────────────────────────────────────

export const liveClasses = pgTable("live_classes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  instructorId: varchar("instructor_id").notNull().references(() => users.id),
  meetingUrl: text("meeting_url"),
  streamRoomId: varchar("stream_room_id"),
  maxStudents: integer("max_students").default(30),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"),
  thumbnailUrl: text("thumbnail_url"),
  price: numeric("price", { precision: 10, scale: 2 }).default("0"),
  isRecorded: boolean("is_recorded").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classRegistrations = pgTable("class_registrations", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => liveClasses.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  registeredAt: timestamp("registered_at").defaultNow(),
});

export const videoRooms = pgTable("video_rooms", {
  id: serial("id").primaryKey(),
  roomCode: varchar("room_code", { length: 50 }).notNull().unique(),
  classId: integer("class_id").references(() => liveClasses.id),
  hostId: varchar("host_id").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("waiting"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => liveClasses.id),
  roomId: integer("room_id").references(() => videoRooms.id),
  title: text("title").notNull(),
  description: text("description"),
  instructorId: varchar("instructor_id").notNull().references(() => users.id),
  duration: integer("duration_seconds"),
  fileSize: integer("file_size_bytes"),
  url: text("url"),
  thumbnailUrl: text("thumbnail_url"),
  isPublic: boolean("is_public").default(false),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Plans & Subscriptions ───────────────────────────────────────────────────

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  billingPeriod: varchar("billing_period", { length: 20 }).notNull().default("monthly"),
  features: jsonb("features").notNull().default(sql`'[]'::jsonb`),
  maxStudents: integer("max_students"),
  maxClasses: integer("max_classes"),
  hasVideoAccess: boolean("has_video_access").notNull().default(false),
  hasAiAccess: boolean("has_ai_access").notNull().default(false),
  hasCertificates: boolean("has_certificates").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  isPopular: boolean("is_popular").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => plans.id),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  autoRenew: boolean("auto_renew").notNull().default(true),
  promoCode: varchar("promo_code", { length: 50 }),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Payments & Invoices ─────────────────────────────────────────────────────

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  method: varchar("method", { length: 30 }),
  gatewayRef: varchar("gateway_ref", { length: 200 }),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 30 }).notNull().unique(),
  userId: varchar("user_id").notNull().references(() => users.id),
  paymentId: integer("payment_id").references(() => payments.id),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  dueDate: timestamp("due_date"),
  issuedAt: timestamp("issued_at").defaultNow(),
  lineItems: jsonb("line_items").notNull().default(sql`'[]'::jsonb`),
  notes: text("notes"),
  billingInfo: jsonb("billing_info").default(sql`'{}'::jsonb`),
});

// ─── Certificates ────────────────────────────────────────────────────────────

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  issuerName: text("issuer_name").notNull().default("Academia Cometa"),
  certificateCode: varchar("certificate_code", { length: 50 }).notNull().unique(),
  type: varchar("type", { length: 30 }).notNull().default("completion"),
  levelId: integer("level_id").references(() => levels.id),
  classId: integer("class_id").references(() => liveClasses.id),
  issuedAt: timestamp("issued_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
});

// ─── Promotions ──────────────────────────────────────────────────────────────

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description").notNull(),
  discountType: varchar("discount_type", { length: 20 }).notNull().default("percent"),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  applicablePlanId: integer("applicable_plan_id").references(() => plans.id),
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

// ─── Notifications ───────────────────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: varchar("type", { length: 30 }).notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Teacher Profiles ────────────────────────────────────────────────────────

export const teacherProfiles = pgTable("teacher_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  bio: text("bio"),
  specialties: text("specialties").array(),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: integer("total_reviews").notNull().default(0),
  totalStudents: integer("total_students").notNull().default(0),
  languages: text("languages").array(),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Insert Schemas ──────────────────────────────────────────────────────────

export const insertLevelSchema = createInsertSchema(levels).omit({ id: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true });
export const insertLiveClassSchema = createInsertSchema(liveClasses).omit({ id: true, createdAt: true });
export const insertPlanSchema = createInsertSchema(plans).omit({ id: true, createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true });
export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true, issuedAt: true });
export const insertPromotionSchema = createInsertSchema(promotions).omit({ id: true, createdAt: true, usedCount: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertTeacherProfileSchema = createInsertSchema(teacherProfiles).omit({ id: true, createdAt: true });
export const insertVideoRoomSchema = createInsertSchema(videoRooms).omit({ id: true, createdAt: true });
export const insertRecordingSchema = createInsertSchema(recordings).omit({ id: true, createdAt: true });

// ─── Types ───────────────────────────────────────────────────────────────────

export type Level = typeof levels.$inferSelect;
export type InsertLevel = z.infer<typeof insertLevelSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type LiveClass = typeof liveClasses.$inferSelect;
export type InsertLiveClass = z.infer<typeof insertLiveClassSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type LessonCompletion = typeof lessonCompletions.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type Notification = typeof notifications.$inferSelect;
export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type VideoRoom = typeof videoRooms.$inferSelect;
export type Recording = typeof recordings.$inferSelect;
