import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Check, Star, Zap, Crown, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionPlan } from "@shared/schema";

interface PlansResponse {
  plans: SubscriptionPlan[];
  wompiEnabled: boolean;
  publicKey: string;
}

interface SubscriptionResponse {
  subscription: (SubscriptionPlan & { status: string; expiresAt: string | null }) | null;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  gratis: <Star className="w-6 h-6" />,
  basico: <Zap className="w-6 h-6" />,
  premium: <Crown className="w-6 h-6" />,
};

const PLAN_COLORS: Record<string, string> = {
  gratis: "from-slate-400 to-slate-500",
  basico: "from-emerald-500 to-teal-500",
  premium: "from-violet-500 to-purple-600",
};

function formatCOP(cents: number): string {
  if (cents === 0) return "Gratis";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function Pricing() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);

  const { data: plansData, isLoading: plansLoading } = useQuery<PlansResponse>({
    queryKey: ["/api/plans"],
  });

  const { data: subData, refetch: refetchSub } = useQuery<SubscriptionResponse>({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (planSlug: string) => {
      const res = await apiRequest("POST", "/api/subscription/checkout", { planSlug });
      return res.json() as Promise<{ checkoutUrl: string; reference: string }>;
    },
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (err: Error) => {
      toast({
        title: "Error al procesar el pago",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] ?? "");
    const ref = params.get("ref");
    if (!ref || !user) return;

    setPendingRef(ref);
    setVerifyStatus("verifying");

    fetch(`/api/subscription/verify/${ref}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: { status: string }) => {
        setVerifyStatus(data.status);
        refetchSub();
        if (data.status === "approved") {
          toast({ title: "¡Pago exitoso!", description: "Tu suscripción está activa." });
        } else if (data.status === "declined" || data.status === "error") {
          toast({
            title: "Pago no aprobado",
            description: "El pago fue rechazado. Intenta nuevamente.",
            variant: "destructive",
          });
        }
      })
      .catch(() => setVerifyStatus("error"));
  }, []);

  const activeSub = subData?.subscription;
  const plans = plansData?.plans ?? [];
  const wompiEnabled = plansData?.wompiEnabled ?? false;

  if (plansLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Planes y Precios
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Elige el plan que mejor se adapte a tu ritmo de aprendizaje. Paga fácilmente con
            PSE (Banco Popular y más), tarjeta o Nequi.
          </p>
        </div>

        {/* Payment return status */}
        {pendingRef && verifyStatus && (
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
            verifyStatus === "approved"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : verifyStatus === "verifying"
              ? "bg-blue-50 border-blue-200 text-blue-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            {verifyStatus === "approved" && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
            {verifyStatus === "verifying" && <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />}
            {(verifyStatus === "declined" || verifyStatus === "error") && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium">
              {verifyStatus === "approved" && "¡Tu suscripción está activa! Disfruta tu plan."}
              {verifyStatus === "verifying" && "Verificando tu pago..."}
              {verifyStatus === "declined" && "Tu pago fue rechazado. Intenta con otro método."}
              {verifyStatus === "error" && "Ocurrió un error al verificar el pago."}
            </span>
          </div>
        )}

        {/* Active subscription banner */}
        {activeSub && (
          <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-foreground">Plan activo: {(activeSub as any).plan?.name ?? "Premium"}</span>
              {(activeSub as any).expiresAt && (
                <span className="text-muted-foreground ml-2">
                  — Vence el {new Date((activeSub as any).expiresAt).toLocaleDateString("es-CO")}
                </span>
              )}
            </div>
          </div>
        )}

        {/* PSE Info Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <div className="text-blue-600 text-xl mt-0.5">🏦</div>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Pagos seguros con PSE</p>
              <p>Acepta pagos desde <strong>Banco Popular</strong>, Bancolombia, Davivienda, BBVA, Nequi, tarjetas de crédito/débito y más — procesado por <strong>Wompi</strong>.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <div className="text-emerald-600 text-xl mt-0.5">💳</div>
            <div className="text-sm text-emerald-800">
              <p className="font-semibold mb-1">Transferencia directa Banco Popular</p>
              <p className="font-mono font-bold text-base tracking-widest text-emerald-900">230560175432</p>
              <p className="mt-1">Cuenta de ahorros · <span className="font-medium">fundacionstudy@gmail.com</span></p>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isPopular = plan.slug === "basico";
            const isCurrent = (activeSub as any)?.plan?.slug === plan.slug || (!activeSub && plan.slug === "gratis");
            const icon = PLAN_ICONS[plan.slug] ?? <Star className="w-6 h-6" />;
            const gradient = PLAN_COLORS[plan.slug] ?? "from-slate-400 to-slate-500";

            return (
              <Card
                key={plan.id}
                data-testid={`card-plan-${plan.slug}`}
                className={`relative flex flex-col border-2 transition-shadow ${
                  isPopular
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-border hover:border-primary/30"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1 shadow-sm">
                      Más popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-3`}>
                    {icon}
                  </div>
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>

                  <div className="mt-3">
                    <span className="text-3xl font-black text-foreground">
                      {formatCOP(plan.priceInCents)}
                    </span>
                    {plan.priceInCents > 0 && (
                      <span className="text-muted-foreground text-sm ml-2">/mes</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 gap-4">
                  <ul className="space-y-2 flex-1">
                    {(plan.features as string[]).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button
                      data-testid={`button-plan-current-${plan.slug}`}
                      variant="outline"
                      disabled
                      className="w-full"
                    >
                      Plan actual
                    </Button>
                  ) : plan.priceInCents === 0 ? (
                    <Button
                      data-testid={`button-plan-select-${plan.slug}`}
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      Incluido
                    </Button>
                  ) : (
                    <Button
                      data-testid={`button-plan-subscribe-${plan.slug}`}
                      className={`w-full font-bold ${isPopular ? "" : "variant-outline"}`}
                      variant={isPopular ? "default" : "outline"}
                      disabled={!wompiEnabled || checkoutMutation.isPending}
                      onClick={() => checkoutMutation.mutate(plan.slug)}
                    >
                      {checkoutMutation.isPending && checkoutMutation.variables === plan.slug ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      {wompiEnabled ? `Suscribirse — ${formatCOP(plan.priceInCents)}/mes` : "Próximamente"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground">
          Todos los precios en pesos colombianos (COP) · Cancela cuando quieras ·
          Pagos procesados de forma segura por <strong>Wompi</strong>
        </p>
      </div>
    </Layout>
  );
}
