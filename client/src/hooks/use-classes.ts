import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { LiveClass } from "@shared/schema";

export function useLiveClasses() {
  return useQuery({
    queryKey: [api.liveClasses.list.path],
    queryFn: async () => {
      const res = await fetch(api.liveClasses.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch classes");
      return res.json() as Promise<LiveClass[]>;
    },
  });
}

export function useRegisterClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.liveClasses.register.path, { id });
      const res = await fetch(url, {
        method: api.liveClasses.register.method,
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Class not found");
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to register");
      }
      return res.json() as Promise<{ success: boolean }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.liveClasses.list.path] });
    },
  });
}
