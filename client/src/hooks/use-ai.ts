import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useGenerateExercise() {
  return useMutation({
    mutationFn: async (data: { level: string; topic: string }) => {
      const res = await fetch(api.ai.generateExercise.path, {
        method: api.ai.generateExercise.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate exercise");
      return res.json() as Promise<{ scenario: string; questions: string[] }>;
    },
  });
}
