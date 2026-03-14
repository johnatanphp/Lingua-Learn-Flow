import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Plans
export function usePlans() {
  return useQuery<any[]>({ queryKey: ["/api/plans"] });
}

// Subscription
export function useMySubscription() {
  return useQuery<any | null>({ queryKey: ["/api/my-subscription"] });
}

export function useSubscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { planId: number; promoCode?: string; method?: string }) =>
      apiRequest("POST", "/api/subscriptions", data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/my-subscription"] });
      qc.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
  });
}

// Invoices
export function useInvoices() {
  return useQuery<any[]>({ queryKey: ["/api/invoices"] });
}

export function useInvoice(id: number) {
  return useQuery<any>({ queryKey: ["/api/invoices", id] });
}

// Certificates
export function useCertificates() {
  return useQuery<any[]>({ queryKey: ["/api/certificates"] });
}

// Promotions (admin)
export function usePromotions() {
  return useQuery<any[]>({ queryKey: ["/api/promotions"] });
}

export function useValidatePromo() {
  return useMutation({
    mutationFn: (data: { code: string; planId?: number }) =>
      apiRequest("POST", "/api/promotions/validate", data).then(r => r.json()),
  });
}

// Notifications
export function useNotifications() {
  return useQuery<any[]>({ queryKey: ["/api/notifications"] });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/notifications/${id}/read`).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/read-all").then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });
}

// Admin
export function useAdminStats() {
  return useQuery<any>({ queryKey: ["/api/admin/stats"] });
}

export function useAdminUsers() {
  return useQuery<any[]>({ queryKey: ["/api/admin/users"] });
}

export function useAdminSubscriptions() {
  return useQuery<any[]>({ queryKey: ["/api/admin/subscriptions"] });
}

export function useAdminPayments() {
  return useQuery<any[]>({ queryKey: ["/api/admin/payments"] });
}

export function useAdminCertificates() {
  return useQuery<any[]>({ queryKey: ["/api/admin/certificates"] });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiRequest("PATCH", `/api/admin/users/${id}/role`, { role }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/users"] }),
  });
}

// Teacher
export function useTeacherProfile() {
  return useQuery<any | null>({ queryKey: ["/api/teacher-profile"] });
}

export function useUpdateTeacherProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/teacher-profile", data).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/teacher-profile"] }),
  });
}

export function useTeachers() {
  return useQuery<any[]>({ queryKey: ["/api/teachers"] });
}

// Recordings
export function useRecordings() {
  return useQuery<any[]>({ queryKey: ["/api/recordings"] });
}

export function useCreateRecording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/recordings", data).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/recordings"] }),
  });
}

// Live classes mutations
export function useCreateLiveClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/live-classes", data).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/live-classes"] }),
  });
}

export function useUpdateLiveClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/live-classes/${id}`, data).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/live-classes"] }),
  });
}

export function useDeleteLiveClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/live-classes/${id}`).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/live-classes"] }),
  });
}

// Confirm payment (admin)
export function useConfirmPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: number) =>
      apiRequest("POST", `/api/payments/${paymentId}/confirm`, {}).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
    },
  });
}

// Promotions CRUD
export function useCreatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/promotions", data).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/promotions"] }),
  });
}

export function useUpdatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/promotions/${id}`, data).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/promotions"] }),
  });
}

export function useDeletePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/promotions/${id}`).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/promotions"] }),
  });
}

// Issue certificate
export function useIssueCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/certificates", data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/certificates"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/certificates"] });
    },
  });
}

// Create plan (admin)
export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/plans", data).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/plans"] }),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/plans/${id}`, data).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/plans"] }),
  });
}
