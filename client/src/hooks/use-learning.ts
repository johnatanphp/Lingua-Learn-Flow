import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Level, Lesson, UserProgress, Achievement } from "@shared/schema";

export function useLevels() {
  return useQuery({
    queryKey: [api.levels.list.path],
    queryFn: async () => {
      const res = await fetch(api.levels.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch levels");
      return res.json() as Promise<Level[]>;
    },
  });
}

export function useLevelLessons(levelId: number) {
  return useQuery({
    queryKey: [api.lessons.listByLevel.path, levelId],
    queryFn: async () => {
      const url = buildUrl(api.lessons.listByLevel.path, { levelId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch lessons");
      return res.json() as Promise<Lesson[]>;
    },
    enabled: !!levelId,
  });
}

export function useLesson(id: number) {
  return useQuery({
    queryKey: [api.lessons.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.lessons.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch lesson");
      }
      return res.json() as Promise<Lesson>;
    },
    enabled: !!id,
  });
}

export function useProgress() {
  return useQuery({
    queryKey: [api.progress.get.path],
    queryFn: async () => {
      const res = await fetch(api.progress.get.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to fetch progress");
      }
      // Return a default if missing to avoid breaking UI on new users
      const data = await res.json();
      return (data || { xp: 0, streakDays: 0 }) as UserProgress;
    },
  });
}

export function useAddXp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (xpToAdd: number) => {
      const res = await fetch(api.progress.update.path, {
        method: api.progress.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xpToAdd }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add XP");
      return res.json() as Promise<UserProgress>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.progress.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.achievements.list.path] });
    },
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: [api.achievements.list.path],
    queryFn: async () => {
      const res = await fetch(api.achievements.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json() as Promise<Achievement[]>;
    },
  });
}
