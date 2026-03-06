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
  type Level,
  type Lesson,
  type UserProgress,
  type Achievement,
  type LiveClass,
  type LessonCompletion
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
