import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { isAuthenticated } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import { openai } from "./replit_integrations/chat/client";
import { db } from "./db";
import { levels, lessons, achievements } from "@shared/schema";

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

  // Call seed database
  seedDatabase().catch(console.error);

  return httpServer;
}
