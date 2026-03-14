import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users, CalendarDays, CreditCard, Wifi, WifiOff, Trash2,
  Plus, Shield, BookOpen, Star, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AdminStats {
  totalUsers: number;
  totalClasses: number;
  activeSubscriptions: number;
  totalLevels: number;
}

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  authProvider: string;
  createdAt: string;
}

interface AdminClass {
  id: number;
  title: string;
  description: string;
  scheduledAt: string;
  level: string;
  maxStudents: number;
  durationMinutes: number;
  meetingUrl: string | null;
  instructorName: string;
  registrationCount: number;
}

interface ApiStatus {
  openai: boolean;
  wompi: boolean;
  database: boolean;
  googleOAuth: boolean;
}

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [newClass, setNewClass] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    level: "principiante",
    maxStudents: 20,
    durationMinutes: 45,
    meetingUrl: "",
  });
  const [showCreateClass, setShowCreateClass] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.role === "admin",
  });

  const { data: usersData, isLoading: usersLoading } = useQuery<{ users: AdminUser[] }>({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "admin",
  });

  const { data: classesData, isLoading: classesLoading } = useQuery<{ classes: AdminClass[] }>({
    queryKey: ["/api/admin/classes"],
    enabled: user?.role === "admin",
  });

  const { data: apiStatus } = useQuery<ApiStatus>({
    queryKey: ["/api/admin/api-status"],
    enabled: user?.role === "admin",
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Rol actualizado correctamente" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const createClassMutation = useMutation({
    mutationFn: async (data: typeof newClass) => {
      const res = await apiRequest("POST", "/api/admin/classes", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/classes"] });
      qc.invalidateQueries({ queryKey: ["/api/live-classes"] });
      toast({ title: "Clase creada exitosamente" });
      setShowCreateClass(false);
      setNewClass({ title: "", description: "", scheduledAt: "", level: "principiante", maxStudents: 20, durationMinutes: 45, meetingUrl: "" });
    },
    onError: (err: Error) => toast({ title: "Error al crear clase", description: err.message, variant: "destructive" }),
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (classId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/classes/${classId}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/classes"] });
      qc.invalidateQueries({ queryKey: ["/api/live-classes"] });
      toast({ title: "Clase eliminada" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <Shield className="w-16 h-16 text-muted-foreground opacity-30" />
          <h2 className="text-xl font-bold text-muted-foreground">Acceso restringido</h2>
          <p className="text-sm text-muted-foreground">Solo los administradores pueden ver esta sección.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Volver al inicio</Button>
        </div>
      </Layout>
    );
  }

  const ROLE_OPTIONS = ["student", "teacher", "admin", "guest"];
  const ROLE_LABELS: Record<string, string> = { student: "Estudiante", teacher: "Profesor", admin: "Admin", guest: "Invitado" };
  const LEVEL_OPTIONS = ["principiante", "básico", "intermedio", "avanzado", "todos"];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Panel de Administración</h1>
            <p className="text-sm text-muted-foreground">Speak Fluently — Acceso único de administrador</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Usuarios", value: stats?.totalUsers ?? "—", icon: Users, color: "text-blue-600 bg-blue-50" },
            { label: "Clases", value: stats?.totalClasses ?? "—", icon: CalendarDays, color: "text-emerald-600 bg-emerald-50" },
            { label: "Suscripciones", value: stats?.activeSubscriptions ?? "—", icon: CreditCard, color: "text-violet-600 bg-violet-50" },
            { label: "Niveles", value: stats?.totalLevels ?? "—", icon: BookOpen, color: "text-orange-600 bg-orange-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} data-testid={`stat-admin-${label.toLowerCase()}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-foreground">{statsLoading ? "…" : value}</div>
                  <div className="text-xs text-muted-foreground font-medium">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Platform Info — Bank Account & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2 border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white flex-shrink-0 text-lg">🏦</div>
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-0.5">Cuenta Banco Popular</p>
                <p className="font-mono font-black text-xl text-emerald-900 tracking-widest" data-testid="text-bank-account">230560175432</p>
                <p className="text-xs text-emerald-700 mt-0.5">Cuenta de ahorros · PSE / Transferencia</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 text-lg">✉️</div>
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-0.5">Correo administrador</p>
                <p className="font-semibold text-blue-900 text-sm" data-testid="text-admin-email">fundacionstudy@gmail.com</p>
                <p className="text-xs text-blue-700 mt-0.5">Contacto oficial Speak Fluently</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wifi className="w-4 h-4 text-primary" /> Estado de APIs y Conexiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Base de datos", key: "database" },
                { label: "OpenAI", key: "openai" },
                { label: "Wompi Pagos", key: "wompi" },
                { label: "Google OAuth", key: "googleOAuth" },
              ].map(({ label, key }) => {
                const active = apiStatus?.[key as keyof ApiStatus];
                return (
                  <div key={key} data-testid={`api-status-${key}`} className={`flex items-center gap-2 p-3 rounded-xl border ${active ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                    {active
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      : <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                    <div>
                      <div className="text-xs font-bold text-foreground">{label}</div>
                      <div className={`text-[10px] font-medium ${active ? "text-emerald-600" : "text-red-500"}`}>
                        {active ? "Conectado" : "No configurado"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!apiStatus?.wompi && (
              <p className="mt-3 text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                💳 Para activar los pagos Wompi (PSE, Banco Popular, tarjetas), agrega las llaves en la sección de secretos: WOMPI_PUBLIC_KEY, WOMPI_PRIVATE_KEY, WOMPI_INTEGRITY_KEY, WOMPI_EVENTS_KEY.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Live Classes Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" /> Clases en Vivo
            </CardTitle>
            <Button
              data-testid="button-create-class"
              size="sm"
              className="gap-2"
              onClick={() => setShowCreateClass(!showCreateClass)}
            >
              <Plus className="w-4 h-4" /> Nueva clase
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Create class form */}
            {showCreateClass && (
              <div className="border-2 border-primary/20 rounded-2xl p-4 space-y-3 bg-primary/5">
                <h3 className="font-bold text-sm">Crear nueva clase en vivo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="class-title" className="text-xs">Título *</Label>
                    <Input id="class-title" data-testid="input-class-title" placeholder="Inglés conversacional básico" value={newClass.title} onChange={e => setNewClass(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="class-level" className="text-xs">Nivel</Label>
                    <select id="class-level" data-testid="select-class-level" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={newClass.level} onChange={e => setNewClass(p => ({ ...p, level: e.target.value }))}>
                      {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="class-desc" className="text-xs">Descripción *</Label>
                    <Input id="class-desc" data-testid="input-class-desc" placeholder="Practica conversaciones cotidianas con instructor nativo..." value={newClass.description} onChange={e => setNewClass(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="class-date" className="text-xs">Fecha y hora *</Label>
                    <Input id="class-date" data-testid="input-class-date" type="datetime-local" value={newClass.scheduledAt} onChange={e => setNewClass(p => ({ ...p, scheduledAt: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="class-url" className="text-xs">Enlace de reunión (Zoom/Meet)</Label>
                    <Input id="class-url" data-testid="input-class-url" placeholder="https://meet.google.com/..." value={newClass.meetingUrl} onChange={e => setNewClass(p => ({ ...p, meetingUrl: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="class-max" className="text-xs">Máx. estudiantes</Label>
                    <Input id="class-max" data-testid="input-class-max" type="number" min={1} max={100} value={newClass.maxStudents} onChange={e => setNewClass(p => ({ ...p, maxStudents: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="class-duration" className="text-xs">Duración (minutos)</Label>
                    <Input id="class-duration" data-testid="input-class-duration" type="number" min={15} max={180} value={newClass.durationMinutes} onChange={e => setNewClass(p => ({ ...p, durationMinutes: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <Button variant="outline" size="sm" onClick={() => setShowCreateClass(false)}>Cancelar</Button>
                  <Button
                    data-testid="button-save-class"
                    size="sm"
                    disabled={createClassMutation.isPending || !newClass.title || !newClass.description || !newClass.scheduledAt}
                    onClick={() => createClassMutation.mutate(newClass)}
                  >
                    {createClassMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Guardar clase
                  </Button>
                </div>
              </div>
            )}

            {classesLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div>
            ) : classesData?.classes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay clases creadas. Crea la primera.</p>
            ) : (
              <div className="space-y-2">
                {classesData?.classes.map(cls => (
                  <div key={cls.id} data-testid={`admin-class-${cls.id}`} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm truncate">{cls.title}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{cls.level}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(cls.scheduledAt), "d 'de' MMMM yyyy, HH:mm", { locale: es })} ·
                        {cls.durationMinutes} min · {cls.registrationCount}/{cls.maxStudents} inscritos ·
                        Instructor: {cls.instructorName}
                      </div>
                    </div>
                    <Button
                      data-testid={`button-delete-class-${cls.id}`}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                      disabled={deleteClassMutation.isPending}
                      onClick={() => deleteClassMutation.mutate(cls.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users Management */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Gestión de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}</div>
            ) : (
              <div className="space-y-2">
                {usersData?.users.map(u => (
                  <div key={u.id} data-testid={`admin-user-${u.id}`} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {u.firstName?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.email || "Sin email"} · {u.authProvider}</div>
                    </div>
                    <select
                      data-testid={`select-role-${u.id}`}
                      value={u.role}
                      onChange={e => changeRoleMutation.mutate({ userId: u.id, role: e.target.value })}
                      className="text-xs h-8 px-2 rounded-lg border border-input bg-background font-medium flex-shrink-0"
                    >
                      {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
