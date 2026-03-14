import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { usePlans, useMySubscription, useSubscribe, useValidatePromo } from "@/hooks/use-platform";
import { useToast } from "@/hooks/use-toast";
import { Check, Zap, Star, Crown, Building2, Tag, Loader2, CheckCircle } from "lucide-react";

const PLAN_ICONS: Record<string, any> = {
  free: Zap,
  basic: Star,
  premium: Crown,
  academy: Building2,
};

const PLAN_COLORS: Record<string, string> = {
  free: "from-slate-400 to-slate-600",
  basic: "from-blue-400 to-blue-600",
  premium: "from-violet-500 to-purple-700",
  academy: "from-amber-400 to-orange-600",
};

export default function Plans() {
  const { data: plans = [], isLoading } = usePlans();
  const { data: currentSub } = useMySubscription();
  const subscribe = useSubscribe();
  const validatePromo = useValidatePromo();
  const { toast } = useToast();

  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [subscribing, setSubscribing] = useState<number | null>(null);

  async function handleValidatePromo() {
    if (!promoCode.trim()) return;
    const result = await validatePromo.mutateAsync({ code: promoCode });
    setPromoResult(result);
    if (result.valid) {
      toast({ title: "¡Código válido!", description: `Descuento: ${result.promo.discountType === "percent" ? result.promo.discountValue + "%" : "$" + result.promo.discountValue}` });
    } else {
      toast({ title: "Código inválido", description: result.message, variant: "destructive" });
    }
  }

  async function handleSubscribe(planId: number) {
    setSubscribing(planId);
    try {
      const result = await subscribe.mutateAsync({
        planId,
        promoCode: promoResult?.valid ? promoCode : undefined,
        method: "card",
      });
      toast({
        title: "¡Suscripción creada!",
        description: result.amount === 0
          ? "Plan gratuito activado correctamente."
          : `Pago de $${result.amount} pendiente. Factura: ${result.invoiceNumber}`,
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubscribing(null);
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-black">Elige tu Plan</h1>
          <p className="text-muted-foreground text-lg">Accede a todo el contenido de Academia Cometa</p>
          {currentSub && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-sm px-4 py-1">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Plan activo: <strong className="ml-1">{currentSub.plan?.name}</strong>
            </Badge>
          )}
        </div>

        {/* Promo Code */}
        <div className="flex justify-center">
          <div className="flex gap-2 items-center bg-muted/50 rounded-2xl p-3 border border-dashed border-primary/30">
            <Tag className="w-4 h-4 text-primary" />
            <Input
              data-testid="input-promo"
              placeholder="Código de descuento"
              value={promoCode}
              onChange={e => setPromoCode(e.target.value.toUpperCase())}
              className="border-0 bg-transparent h-8 w-40 text-sm font-mono focus-visible:ring-0"
            />
            <Button
              data-testid="button-validate-promo"
              variant="outline"
              size="sm"
              onClick={handleValidatePromo}
              disabled={validatePromo.isPending}
              className="rounded-xl"
            >
              {validatePromo.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Aplicar"}
            </Button>
          </div>
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-96 rounded-3xl bg-muted animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan: any) => {
              const Icon = PLAN_ICONS[plan.slug] || Star;
              const gradient = PLAN_COLORS[plan.slug] || "from-slate-400 to-slate-600";
              const isCurrentPlan = currentSub?.planId === plan.id;
              const features: string[] = typeof plan.features === "string" ? JSON.parse(plan.features) : (plan.features || []);

              let discountedPrice = Number(plan.price);
              if (promoResult?.valid) {
                const promo = promoResult.promo;
                if (promo.discountType === "percent") discountedPrice = discountedPrice * (1 - promo.discountValue / 100);
                else discountedPrice = Math.max(0, discountedPrice - Number(promo.discountValue));
              }

              return (
                <Card
                  key={plan.id}
                  data-testid={`card-plan-${plan.id}`}
                  className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-200 ${
                    plan.isPopular ? "border-primary shadow-lg shadow-primary/20 scale-105" : "border-border"
                  } ${isCurrentPlan ? "ring-2 ring-emerald-400" : ""}`}
                >
                  {plan.isPopular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-secondary text-white text-[11px] font-bold text-center py-1">
                      ⭐ MÁS POPULAR
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 right-0 bg-emerald-500 text-white text-[11px] font-bold text-center py-1">
                      ✓ PLAN ACTUAL
                    </div>
                  )}
                  <CardHeader className={`pt-${plan.isPopular || isCurrentPlan ? "8" : "6"}`}>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    <div className="flex items-end gap-1 mt-2">
                      {promoResult?.valid && Number(plan.price) > 0 ? (
                        <>
                          <span className="text-2xl font-black">${discountedPrice.toFixed(2)}</span>
                          <span className="text-sm text-muted-foreground line-through ml-1">${Number(plan.price).toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-3xl font-black">
                          {Number(plan.price) === 0 ? "Gratis" : `$${Number(plan.price).toFixed(2)}`}
                        </span>
                      )}
                      {Number(plan.price) > 0 && <span className="text-muted-foreground text-xs mb-1">/mes</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      data-testid={`button-subscribe-${plan.id}`}
                      className={`w-full rounded-2xl font-bold ${plan.isPopular ? "bg-primary text-white hover:bg-primary/90" : ""}`}
                      variant={plan.isPopular ? "default" : "outline"}
                      disabled={isCurrentPlan || subscribing === plan.id}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {subscribing === plan.id ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
                      ) : isCurrentPlan ? (
                        "Plan actual"
                      ) : Number(plan.price) === 0 ? (
                        "Comenzar gratis"
                      ) : (
                        "Suscribirse"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* FAQ */}
        <div className="bg-muted/30 rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-bold">Preguntas frecuentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              ["¿Puedo cancelar en cualquier momento?", "Sí, puedes cancelar tu suscripción cuando quieras sin penalización."],
              ["¿Aceptan pagos en USD y otras monedas?", "Actualmente los precios están en USD. Próximamente en más monedas."],
              ["¿Los certificados son reconocidos?", "Nuestros certificados de Academia Cometa son reconocidos por nuestras empresas aliadas."],
              ["¿Puedo cambiar de plan?", "Sí, puedes actualizar o cambiar tu plan en cualquier momento desde esta página."],
            ].map(([q, a]) => (
              <div key={q} className="space-y-1">
                <p className="font-semibold">{q}</p>
                <p className="text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
