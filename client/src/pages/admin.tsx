import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminStats, useAdminUsers, useAdminSubscriptions, useAdminPayments,
  useAdminCertificates, useUpdateUserRole, usePromotions, useCreatePromotion,
  useDeletePromotion, useConfirmPayment, useIssueCertificate, useUpdatePromotion,
} from "@/hooks/use-platform";
import { usePlans } from "@/hooks/use-platform";
import { useToast } from "@/hooks/use-toast";
import {
  Users, DollarSign, TrendingUp, BookOpen, Award, Tag, CheckCircle,
  Shield, GraduationCap, User, Crown, Clock, Loader2, Trash2, Plus, FileText
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

function StatCard({ icon: Icon, label, value, color, sub }: any) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-2xl font-black">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  student: { label: "Estudiante", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  teacher: { label: "Profesor", color: "bg-blue-50 text-blue-700 border-blue-200" },
  admin: { label: "Admin", color: "bg-purple-50 text-purple-700 border-purple-200" },
  guest: { label: "Invitado", color: "bg-orange-50 text-orange-700 border-orange-200" },
};

export default function Admin() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  if (user && user.role !== "admin") { navigate("/"); return null; }

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: subscriptions = [] } = useAdminSubscriptions();
  const { data: payments = [] } = useAdminPayments();
  const { data: certificates = [] } = useAdminCertificates();
  const { data: promos = [] } = usePromotions();
  const { data: plans = [] } = usePlans();
  const updateRole = useUpdateUserRole();
  const createPromo = useCreatePromotion();
  const deletePromo = useDeletePromotion();
  const confirmPayment = useConfirmPayment();
  const issueCert = useIssueCertificate();
  const updatePromo = useUpdatePromotion();
  const { toast } = useToast();

  const [userSearch, setUserSearch] = useState("");
  const [newPromo, setNewPromo] = useState({ code: "", description: "", discountType: "percent", discountValue: "10", maxUses: "", validUntil: "" });
  const [certForm, setCertForm] = useState({ userId: "", title: "", description: "", type: "completion" });

  const filteredUsers = users.filter((u: any) =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
  );

  async function handleRoleChange(userId: string, role: string) {
    await updateRole.mutateAsync({ id: userId, role });
    toast({ title: "Rol actualizado" });
  }

  async function handleCreatePromo() {
    if (!newPromo.code || !newPromo.description) return;
    try {
      await createPromo.mutateAsync({
        code: newPromo.code,
        description: newPromo.description,
        discountType: newPromo.discountType,
        discountValue: newPromo.discountValue,
        maxUses: newPromo.maxUses ? Number(newPromo.maxUses) : null,
        validUntil: newPromo.validUntil ? new Date(newPromo.validUntil) : null,
        isActive: true,
        validFrom: new Date(),
      });
      setNewPromo({ code: "", description: "", discountType: "percent", discountValue: "10", maxUses: "", validUntil: "" });
      toast({ title: "Promoción creada" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  async function handleIssueCert() {
    if (!certForm.userId || !certForm.title) return;
    try {
      await issueCert.mutateAsync(certForm);
      setCertForm({ userId: "", title: "", description: "", type: "completion" });
      toast({ title: "Certificado emitido" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black">Panel de Administración</h1>
            <p className="text-sm text-muted-foreground">Academia Cometa — Control total</p>
          </div>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard icon={Users} label="Total Usuarios" value={stats?.totalUsers || 0} color="bg-blue-500" />
            <StatCard icon={GraduationCap} label="Estudiantes" value={stats?.totalStudents || 0} color="bg-emerald-500" />
            <StatCard icon={User} label="Profesores" value={stats?.totalTeachers || 0} color="bg-cyan-500" />
            <StatCard icon={DollarSign} label="Ingresos" value={`$${Number(stats?.totalRevenue || 0).toFixed(0)}`} color="bg-green-600" sub="USD total" />
            <StatCard icon={TrendingUp} label="Suscripciones" value={stats?.activeSubscriptions || 0} color="bg-violet-500" sub="activas" />
            <StatCard icon={BookOpen} label="Clases" value={stats?.totalClasses || 0} color="bg-orange-500" />
          </div>
        )}

        <Tabs defaultValue="users">
          <TabsList className="rounded-2xl bg-muted/50 h-auto p-1 flex-wrap gap-1">
            {["users","payments","subscriptions","certificates","promotions"].map(t => (
              <TabsTrigger key={t} value={t} className="rounded-xl capitalize text-xs font-semibold">
                {t === "users" ? "Usuarios" : t === "payments" ? "Pagos" : t === "subscriptions" ? "Suscripciones" : t === "certificates" ? "Certificados" : "Promociones"}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Users ── */}
          <TabsContent value="users" className="mt-4">
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Gestión de Usuarios ({users.length})</CardTitle>
                  <Input
                    data-testid="input-user-search"
                    placeholder="Buscar usuario..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-48 h-8 rounded-xl text-sm"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {usersLoading ? (
                  <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30 border-b border-border">
                        <tr>
                          <th className="text-left p-3 font-semibold">Usuario</th>
                          <th className="text-left p-3 font-semibold">Email</th>
                          <th className="text-left p-3 font-semibold">Rol</th>
                          <th className="text-left p-3 font-semibold">Registro</th>
                          <th className="p-3 font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u: any) => {
                          const roleConf = ROLE_LABELS[u.role] || ROLE_LABELS.student;
                          return (
                            <tr key={u.id} data-testid={`row-user-${u.id}`} className="border-b border-border/50 hover:bg-muted/20">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                    {u.firstName?.[0] || "?"}
                                  </div>
                                  <span className="font-medium">{u.firstName} {u.lastName}</span>
                                </div>
                              </td>
                              <td className="p-3 text-muted-foreground text-xs">{u.email || "—"}</td>
                              <td className="p-3">
                                <Badge className={`text-xs border ${roleConf.color}`}>{roleConf.label}</Badge>
                              </td>
                              <td className="p-3 text-muted-foreground text-xs">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString("es-ES") : "—"}
                              </td>
                              <td className="p-3">
                                <div className="flex gap-1 justify-center">
                                  {["student","teacher","admin"].map(role => (
                                    <Button key={role} variant="ghost" size="sm"
                                      className={`h-6 text-xs px-2 rounded-lg ${u.role === role ? "bg-primary/10 text-primary" : ""}`}
                                      onClick={() => handleRoleChange(u.id, role)}
                                      disabled={u.role === role || updateRole.isPending}
                                    >
                                      {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </Button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Payments ── */}
          <TabsContent value="payments" className="mt-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Pagos ({payments.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 border-b border-border">
                      <tr>
                        <th className="text-left p-3 font-semibold">ID</th>
                        <th className="text-left p-3 font-semibold">Usuario</th>
                        <th className="text-left p-3 font-semibold">Monto</th>
                        <th className="text-left p-3 font-semibold">Método</th>
                        <th className="text-left p-3 font-semibold">Estado</th>
                        <th className="text-left p-3 font-semibold">Fecha</th>
                        <th className="p-3 font-semibold">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p: any) => (
                        <tr key={p.id} data-testid={`row-payment-${p.id}`} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="p-3 font-mono text-xs text-muted-foreground">#{p.id}</td>
                          <td className="p-3 text-sm">{p.user?.firstName} {p.user?.lastName}</td>
                          <td className="p-3 font-bold">${Number(p.amount).toFixed(2)} <span className="text-xs text-muted-foreground">{p.currency}</span></td>
                          <td className="p-3 text-xs capitalize">{p.method || "—"}</td>
                          <td className="p-3">
                            <Badge className={`text-xs border ${p.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : p.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                              {p.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleDateString("es-ES") : "—"}</td>
                          <td className="p-3">
                            {p.status === "pending" && (
                              <Button size="sm" className="h-7 text-xs rounded-lg"
                                onClick={async () => { await confirmPayment.mutateAsync(p.id); toast({ title: "Pago confirmado" }); }}
                                disabled={confirmPayment.isPending}
                              >
                                Confirmar
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {payments.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Sin pagos registrados</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Subscriptions ── */}
          <TabsContent value="subscriptions" className="mt-4">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="text-base">Suscripciones Activas ({subscriptions.filter((s: any) => s.status === "active").length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 border-b border-border">
                      <tr>
                        <th className="text-left p-3 font-semibold">Usuario</th>
                        <th className="text-left p-3 font-semibold">Plan</th>
                        <th className="text-left p-3 font-semibold">Estado</th>
                        <th className="text-left p-3 font-semibold">Inicio</th>
                        <th className="text-left p-3 font-semibold">Fin</th>
                        <th className="text-left p-3 font-semibold">Promo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.map((s: any) => (
                        <tr key={s.id} data-testid={`row-sub-${s.id}`} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="p-3">{s.user?.firstName} {s.user?.lastName}</td>
                          <td className="p-3 font-semibold">{s.plan?.name}</td>
                          <td className="p-3">
                            <Badge className={`text-xs border ${s.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                              {s.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{s.startDate ? new Date(s.startDate).toLocaleDateString("es-ES") : "—"}</td>
                          <td className="p-3 text-xs text-muted-foreground">{s.endDate ? new Date(s.endDate).toLocaleDateString("es-ES") : "—"}</td>
                          <td className="p-3 text-xs font-mono text-primary">{s.promoCode || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {subscriptions.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Sin suscripciones</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Certificates ── */}
          <TabsContent value="certificates" className="mt-4 space-y-4">
            {/* Issue cert form */}
            <Card className="rounded-2xl bg-primary/5 border-primary/20">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Award className="w-4 h-4" />Emitir Certificado</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">ID de Usuario</label>
                    <Input data-testid="input-cert-userid" placeholder="user_id..." value={certForm.userId}
                      onChange={e => setCertForm(p => ({ ...p, userId: e.target.value }))} className="rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Título del Certificado</label>
                    <Input data-testid="input-cert-title" placeholder="Ej: Inglés Nivel B1..." value={certForm.title}
                      onChange={e => setCertForm(p => ({ ...p, title: e.target.value }))} className="rounded-xl text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Descripción (opcional)</label>
                  <Input data-testid="input-cert-desc" placeholder="Descripción..." value={certForm.description}
                    onChange={e => setCertForm(p => ({ ...p, description: e.target.value }))} className="rounded-xl text-sm" />
                </div>
                <Button data-testid="button-issue-cert" onClick={handleIssueCert} disabled={issueCert.isPending} className="rounded-xl">
                  {issueCert.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Award className="w-4 h-4 mr-2" />}
                  Emitir Certificado
                </Button>
              </CardContent>
            </Card>
            {/* List */}
            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="text-base">Todos los Certificados ({certificates.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 border-b border-border">
                      <tr>
                        <th className="text-left p-3 font-semibold">Código</th>
                        <th className="text-left p-3 font-semibold">Estudiante</th>
                        <th className="text-left p-3 font-semibold">Título</th>
                        <th className="text-left p-3 font-semibold">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.map((c: any) => (
                        <tr key={c.id} data-testid={`row-cert-${c.id}`} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="p-3 font-mono text-xs text-primary">{c.certificateCode}</td>
                          <td className="p-3">{c.user?.firstName} {c.user?.lastName}</td>
                          <td className="p-3 font-semibold">{c.title}</td>
                          <td className="p-3 text-xs text-muted-foreground">{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString("es-ES") : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {certificates.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Sin certificados emitidos</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Promotions ── */}
          <TabsContent value="promotions" className="mt-4 space-y-4">
            <Card className="rounded-2xl bg-primary/5 border-primary/20">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Tag className="w-4 h-4" />Nueva Promoción</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Código</label>
                    <Input data-testid="input-promo-code" placeholder="VERANO25" value={newPromo.code}
                      onChange={e => setNewPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                      className="rounded-xl text-sm font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tipo</label>
                    <select className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                      value={newPromo.discountType} onChange={e => setNewPromo(p => ({ ...p, discountType: e.target.value }))}>
                      <option value="percent">Porcentaje %</option>
                      <option value="fixed">Importe fijo $</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Valor</label>
                    <Input data-testid="input-promo-value" type="number" placeholder="10" value={newPromo.discountValue}
                      onChange={e => setNewPromo(p => ({ ...p, discountValue: e.target.value }))}
                      className="rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Usos máx.</label>
                    <Input data-testid="input-promo-maxuses" type="number" placeholder="100" value={newPromo.maxUses}
                      onChange={e => setNewPromo(p => ({ ...p, maxUses: e.target.value }))}
                      className="rounded-xl text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Descripción</label>
                    <Input data-testid="input-promo-desc" placeholder="Promo de verano..." value={newPromo.description}
                      onChange={e => setNewPromo(p => ({ ...p, description: e.target.value }))}
                      className="rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Válida hasta</label>
                    <Input type="date" value={newPromo.validUntil}
                      onChange={e => setNewPromo(p => ({ ...p, validUntil: e.target.value }))}
                      className="rounded-xl text-sm" />
                  </div>
                </div>
                <Button data-testid="button-create-promo" onClick={handleCreatePromo} disabled={createPromo.isPending} className="rounded-xl">
                  {createPromo.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Crear Promoción
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="text-base">Promociones ({promos.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 border-b border-border">
                      <tr>
                        <th className="text-left p-3 font-semibold">Código</th>
                        <th className="text-left p-3 font-semibold">Descripción</th>
                        <th className="text-left p-3 font-semibold">Descuento</th>
                        <th className="text-left p-3 font-semibold">Uso</th>
                        <th className="text-left p-3 font-semibold">Estado</th>
                        <th className="p-3 font-semibold">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promos.map((p: any) => (
                        <tr key={p.id} data-testid={`row-promo-${p.id}`} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="p-3 font-mono font-bold text-primary">{p.code}</td>
                          <td className="p-3 text-sm">{p.description}</td>
                          <td className="p-3">{p.discountValue}{p.discountType === "percent" ? "%" : "$"}</td>
                          <td className="p-3 text-muted-foreground text-xs">{p.usedCount}{p.maxUses ? `/${p.maxUses}` : ""}</td>
                          <td className="p-3">
                            <Badge className={`text-xs border ${p.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                              {p.isActive ? "Activa" : "Inactiva"}
                            </Badge>
                          </td>
                          <td className="p-3 flex gap-1 justify-center">
                            <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg"
                              onClick={async () => { await updatePromo.mutateAsync({ id: p.id, isActive: !p.isActive }); }}>
                              {p.isActive ? "Desactivar" : "Activar"}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 rounded-lg text-red-500 hover:text-red-600"
                              onClick={async () => { await deletePromo.mutateAsync(p.id); toast({ title: "Promoción eliminada" }); }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {promos.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Sin promociones creadas</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
