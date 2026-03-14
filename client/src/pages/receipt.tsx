import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import {
  CreditCard, Building2, CheckCircle2, Clock, XCircle,
  Send, Loader2, ArrowLeft, ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { SubscriptionPlan, PaymentReceipt } from "@shared/schema";

const BANCO_POPULAR_ACCOUNT = "230560175432";
const CONTACT_EMAIL = "fundacionstudy@gmail.com";

interface PlansResponse { plans: SubscriptionPlan[] }
interface ReceiptsResponse { receipts: PaymentReceipt[] }

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  pending: { label: "En revisión",   icon: <Clock className="w-3.5 h-3.5" />,        cls: "bg-amber-50 text-amber-700 border-amber-200" },
  verified: { label: "Aprobado",     icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rechazado",    icon: <XCircle className="w-3.5 h-3.5" />,      cls: "bg-red-50 text-red-700 border-red-200" },
};

function formatCOP(cents: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(cents / 100);
}

export default function Receipt() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState({
    senderName: user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "",
    senderAccount: "",
    driveReceiptUrl: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const { data: plansData, isLoading: plansLoading } = useQuery<PlansResponse>({ queryKey: ["/api/plans"] });
  const { data: receiptsData } = useQuery<ReceiptsResponse>({ queryKey: ["/api/receipts/me"], enabled: !!user });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) throw new Error("Selecciona un plan");
      const res = await apiRequest("POST", "/api/receipts", {
        planId: selectedPlan.id,
        amountCOP: selectedPlan.priceInCents,
        senderName: form.senderName,
        senderAccount: form.senderAccount || undefined,
        driveReceiptUrl: form.driveReceiptUrl || undefined,
        bankName: "Banco Popular",
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/receipts/me"] });
      setSubmitted(true);
      toast({ title: "¡Comprobante enviado!", description: "Revisaremos tu pago en máximo 24 horas." });
    },
    onError: (e: Error) => toast({ title: "Error al enviar", description: e.message, variant: "destructive" }),
  });

  const paidPlans = (plansData?.plans ?? []).filter(p => p.priceInCents > 0);
  const myReceipts = receiptsData?.receipts ?? [];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/planes")}>
            <ArrowLeft className="w-4 h-4" /> Planes
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Transferencia Banco Popular</h1>
            <p className="text-sm text-muted-foreground">Pago manual · Confirmación en 24 horas</p>
          </div>
        </div>

        {/* Bank details card */}
        <Card className="border-2 border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-bold text-emerald-900 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Datos de transferencia
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-emerald-700 text-xs font-medium mb-0.5">Banco</p>
                <p className="font-bold text-emerald-900">Banco Popular</p>
              </div>
              <div>
                <p className="text-emerald-700 text-xs font-medium mb-0.5">Tipo de cuenta</p>
                <p className="font-bold text-emerald-900">Ahorro</p>
              </div>
              <div className="col-span-2">
                <p className="text-emerald-700 text-xs font-medium mb-0.5">Número de cuenta</p>
                <p className="font-mono font-black text-2xl tracking-widest text-emerald-900" data-testid="text-account-number">{BANCO_POPULAR_ACCOUNT}</p>
              </div>
              <div className="col-span-2">
                <p className="text-emerald-700 text-xs font-medium mb-0.5">Titular / Contacto</p>
                <p className="font-semibold text-emerald-900">{CONTACT_EMAIL}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit form */}
        {!submitted ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Registrar mi transferencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan selection */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">Plan a suscribir *</Label>
                {plansLoading
                  ? <div className="h-20 bg-muted animate-pulse rounded-xl" />
                  : (
                    <div className="grid grid-cols-2 gap-2">
                      {paidPlans.map(plan => (
                        <button
                          key={plan.id}
                          data-testid={`btn-select-plan-${plan.slug}`}
                          onClick={() => setSelectedPlan(plan)}
                          className={`rounded-xl border-2 p-3 text-left transition-all ${selectedPlan?.id === plan.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                        >
                          <p className="font-bold text-sm">{plan.name}</p>
                          <p className="text-primary font-black">{formatCOP(plan.priceInCents)}/mes</p>
                        </button>
                      ))}
                    </div>
                  )
                }
              </div>

              {/* Sender info */}
              <div className="space-y-1">
                <Label className="text-xs font-bold">Nombre del titular que realizó la transferencia *</Label>
                <Input
                  data-testid="input-sender-name"
                  placeholder="Tu nombre completo"
                  value={form.senderName}
                  onChange={e => setForm(p => ({ ...p, senderName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">Cuenta origen (opcional)</Label>
                <Input
                  data-testid="input-sender-account"
                  placeholder="Número de cuenta desde la que transferiste"
                  value={form.senderAccount}
                  onChange={e => setForm(p => ({ ...p, senderAccount: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">Enlace al comprobante en Drive (opcional)</Label>
                <p className="text-xs text-muted-foreground">Sube una foto o captura del comprobante a Google Drive y comparte el enlace público aquí</p>
                <Input
                  data-testid="input-drive-receipt"
                  placeholder="https://drive.google.com/..."
                  value={form.driveReceiptUrl}
                  onChange={e => setForm(p => ({ ...p, driveReceiptUrl: e.target.value }))}
                />
                {form.driveReceiptUrl && (
                  <a href={form.driveReceiptUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                    <ExternalLink className="w-3 h-3" /> Verificar enlace
                  </a>
                )}
              </div>

              <Button
                data-testid="button-submit-receipt"
                className="w-full gap-2 font-bold"
                disabled={!selectedPlan || !form.senderName || submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
              >
                {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Enviar comprobante
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Revisaremos tu pago en máximo 24 horas hábiles. Te confirmaremos por correo.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-emerald-200 bg-emerald-50/50 text-center p-8">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-black text-emerald-900 mb-2">¡Comprobante recibido!</h3>
            <p className="text-emerald-700 text-sm mb-4">Revisaremos tu transferencia en máximo 24 horas hábiles. Recibirás una confirmación.</p>
            <Button variant="outline" onClick={() => navigate("/planes")}>Volver a Planes</Button>
          </Card>
        )}

        {/* History */}
        {myReceipts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Mis comprobantes enviados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {myReceipts.map(r => {
                const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
                return (
                  <div key={r.id} data-testid={`receipt-${r.id}`} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{formatCOP(r.amountCOP)} · {r.bankName}</div>
                      <div className="text-xs text-muted-foreground">{r.senderName} · {r.submittedAt ? format(new Date(r.submittedAt), "d MMM yyyy", { locale: es }) : ""}</div>
                      {r.adminNotes && <div className="text-xs text-muted-foreground mt-0.5 italic">"{r.adminNotes}"</div>}
                    </div>
                    <Badge className={`flex items-center gap-1 text-xs border ${cfg.cls}`}>
                      {cfg.icon} {cfg.label}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
