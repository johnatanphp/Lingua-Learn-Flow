import { z } from "zod";
import { insertLevelSchema, insertLessonSchema, insertLiveClassSchema, levels, lessons, liveClasses, userProgress, achievements } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

export const api = {
  levels: {
    list: {
      method: "GET" as const,
      path: "/api/levels" as const,
      responses: {
        200: z.array(z.custom<typeof levels.$inferSelect>()),
      }
    }
  },
  lessons: {
    listByLevel: {
      method: "GET" as const,
      path: "/api/levels/:levelId/lessons" as const,
      responses: {
        200: z.array(z.custom<typeof lessons.$inferSelect>()),
        404: errorSchemas.notFound,
      }
    },
    get: {
      method: "GET" as const,
      path: "/api/lessons/:id" as const,
      responses: {
        200: z.custom<typeof lessons.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    }
  },
  progress: {
    get: {
      method: "GET" as const,
      path: "/api/progress" as const,
      responses: {
        200: z.custom<typeof userProgress.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    update: {
      method: "POST" as const,
      path: "/api/progress/xp" as const,
      input: z.object({ xpToAdd: z.number() }),
      responses: {
        200: z.custom<typeof userProgress.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  liveClasses: {
    list: {
      method: "GET" as const,
      path: "/api/live-classes" as const,
      responses: {
        200: z.array(z.custom<typeof liveClasses.$inferSelect>()),
      }
    },
    register: {
      method: "POST" as const,
      path: "/api/live-classes/:id/register" as const,
      responses: {
        201: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    }
  },
  achievements: {
    list: {
      method: "GET" as const,
      path: "/api/achievements" as const,
      responses: {
        200: z.array(z.custom<typeof achievements.$inferSelect>()),
      }
    }
  },
  ai: {
    generateExercise: {
      method: "POST" as const,
      path: "/api/ai/exercise" as const,
      input: z.object({ level: z.string(), topic: z.string() }),
      responses: {
        200: z.object({
          scenario: z.string(),
          questions: z.array(z.string())
        }),
        500: errorSchemas.internal,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
