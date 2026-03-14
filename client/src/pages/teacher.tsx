import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  useTeacherProfile, useUpdateTeacherProfile, useCreateLiveClass,
  useUpdateLiveClass, useDeleteLiveClass, useRecordings,
} from "@/hooks/use-platform";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Users, Video, Plus, BookOpen, Loader2, Trash2, Edit,
  Radio, PlayCircle, Settings, CheckCircle, Calendar, Clock
} from "lucide-react";
import { useLocation } from "wouter";

export default function Teacher() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  if (user && user.role !== "teacher" && user.role !== "admin") { navigate("/"); return null; }

  const { data: profile, isLoading: profileLoading } = useTeacherProfile();
  const { data: classes = [] } = useQuery<any[]>({ queryKey: ["/api/live-classes"] });
  const { data: recordings = [] } = useRecordings();
  const updateProfile = useUpdateTeacherProfile();
  const createClass = useCreateLiveClass();
  const updateClass = useUpdateLiveClass();
  const deleteClass = useDeleteLiveClass();
  const { toast } = useToast();

  const [profileForm, setProfileForm] = useState({
    bio: profile?.bio || "",
    specialties: (profile?.specialties || []).join(", "),
    languages: (profile?.languages || []).join(", "),
    hourlyRate: profile?.hourlyRate || "",
  });

  const [classForm, setClassForm] = useState({
    title: "", description: "", scheduledAt: "", maxStudents: "30", price: "0",
  });
  const [editingClass, setEditingClass] = useState<any>(null);
  const [startingRoom, setStartingRoom] = useState<number | null>(null);

  const myClasses = classes.filter((c: any) => c.instructorId === user?.id);

  async function handleSaveProfile() {
    try {
      await updateProfile.mutateAsync({
        bio: profileForm.bio,
        specialties: profileForm.specialties.split(",").map(s => s.trim()).filter(Boolean),
        languages: profileForm.languages.split(",").map(s => s.trim()).filter(Boolean),
        hourlyRate: profileForm.hourlyRate || null,
      });
      toast({ title: "Perfil actualizado" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  async function handleCreateClass() {
    if (!classForm.title) return;
    try {
      await createClass.mutateAsync({
        ...classForm,
        scheduledAt: new Date(classForm.scheduledAt),
        maxStudents: Number(classForm.maxStudents),
        price: classForm.price,
        isRecorded: true,
      });
      setClassForm({ title: "", description: "", scheduledAt: "", maxStudents: "30", price: "0" });
      toast({ title: "Clase creada" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  async function handleStartStream(classId: number) {
    setStartingRoom(classId);
    try {
      const res = await apiRequest("POST", "/api/video-rooms", { classId });
      const room = await res.json();
      navigate(`/video-room/${room.roomCode}`);
    } catch (e: any) {
      toast({ title: "Error al crear sala", description: e.message, variant: "destructive" });
    } finally {
      setStartingRoom(null);
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black">Panel del Profesor</h1>
            <p className="text-sm text-muted-foreground">Academia Cometa — {user?.firstName} {user?.lastName}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Mis Clases", value: myClasses.length, icon: BookOpen, color: "bg-blue-500" },
            { label: "Grabaciones", value: recordings.length, icon: Video, color: "bg-violet-500" },
            { label: "En Vivo", value: myClasses.filter((c: any) => c.status === "live").length, icon: Radio, color: "bg-red-500" },
            { label: "Programadas", value: myClasses.filter((c: any) => c.status === "scheduled").length, icon: Calendar, color: "bg-emerald-500" },
          ].map(s => (
            <Card key={s.label} className="rounded-2xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl font-black">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="classes">
          <TabsList className="rounded-2xl bg-muted/50 p-1 h-auto">
            <TabsTrigger value="classes" className="rounded-xl">Clases</TabsTrigger>
            <TabsTrigger value="create" className="rounded-xl">Crear Clase</TabsTrigger>
            <TabsTrigger value="recordings" className="rounded-xl">Grabaciones</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-xl">Mi Perfil</TabsTrigger>
          </TabsList>

          {/* ── My Classes ── */}
          <TabsContent value="classes" className="mt-4">
            <div className="space-y-3">
              {myClasses.length === 0 ? (
                <Card className="rounded-2xl border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
                    <p className="font-semibold text-muted-foreground">No tienes clases creadas</p>
                    <p className="text-sm text-muted-foreground mt-1">Crea tu primera clase en la pestaña "Crear Clase"</p>
                  </CardContent>
                </Card>
              ) : myClasses.map((cls: any) => (
                <Card key={cls.id} data-testid={`card-class-${cls.id}`} className="rounded-2xl hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold truncate">{cls.title}</h3>
                          <Badge className={`text-xs border shrink-0 ${cls.status === "live" ? "bg-red-50 text-red-700 border-red-200 animate-pulse" : cls.status === "scheduled" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                            {cls.status === "live" ? "🔴 En vivo" : cls.status === "scheduled" ? "Programada" : "Finalizada"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{cls.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(cls.scheduledAt).toLocaleString("es-ES")}</span>
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />Máx. {cls.maxStudents}</span>
                          {Number(cls.price) > 0 && <span>${Number(cls.price).toFixed(2)}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          data-testid={`button-stream-${cls.id}`}
                          size="sm"
                          className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => handleStartStream(cls.id)}
                          disabled={startingRoom === cls.id}
                        >
                          {startingRoom === cls.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5 mr-1" />}
                          {startingRoom !== cls.id && "Transmitir"}
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-xl"
                          onClick={() => deleteClass.mutateAsync(cls.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Create Class ── */}
          <TabsContent value="create" className="mt-4">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plus className="w-4 h-4" />Nueva Clase</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Título de la clase *</label>
                    <Input data-testid="input-class-title" placeholder="Ej: Inglés Conversacional Avanzado"
                      value={classForm.title} onChange={e => setClassForm(p => ({ ...p, title: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Fecha y hora</label>
                    <Input data-testid="input-class-date" type="datetime-local"
                      value={classForm.scheduledAt} onChange={e => setClassForm(p => ({ ...p, scheduledAt: e.target.value }))} className="rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Descripción</label>
                  <Input data-testid="input-class-desc" placeholder="Describe el contenido de la clase..."
                    value={classForm.description} onChange={e => setClassForm(p => ({ ...p, description: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Estudiantes máximos</label>
                    <Input data-testid="input-class-maxstudents" type="number" value={classForm.maxStudents}
                      onChange={e => setClassForm(p => ({ ...p, maxStudents: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Precio (0 = gratis)</label>
                    <Input data-testid="input-class-price" type="number" step="0.01" placeholder="0.00" value={classForm.price}
                      onChange={e => setClassForm(p => ({ ...p, price: e.target.value }))} className="rounded-xl" />
                  </div>
                </div>
                <Button data-testid="button-create-class" onClick={handleCreateClass} disabled={createClass.isPending} className="rounded-xl w-full">
                  {createClass.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Crear Clase
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Recordings ── */}
          <TabsContent value="recordings" className="mt-4">
            {recordings.length === 0 ? (
              <Card className="rounded-2xl border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Video className="w-10 h-10 text-muted-foreground/40 mb-3" />
                  <p className="font-semibold text-muted-foreground">Sin grabaciones</p>
                  <p className="text-sm text-muted-foreground mt-1">Las grabaciones de tus clases aparecerán aquí</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recordings.map((r: any) => (
                  <Card key={r.id} data-testid={`card-recording-${r.id}`} className="rounded-2xl hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                          <PlayCircle className="w-5 h-5 text-violet-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold truncate">{r.title}</h3>
                          <p className="text-xs text-muted-foreground">{r.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{r.duration ? `${Math.floor(r.duration / 60)}min` : "—"}</span>
                        <span>{r.views} vistas</span>
                        <span>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("es-ES") : "—"}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Profile ── */}
          <TabsContent value="profile" className="mt-4">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="w-4 h-4" />Perfil Docente</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Biografía</label>
                  <textarea
                    data-testid="input-teacher-bio"
                    placeholder="Cuéntanos sobre tu experiencia..."
                    value={profileForm.bio}
                    onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                    rows={4}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Especialidades (separadas por coma)</label>
                    <Input data-testid="input-teacher-specialties" placeholder="Inglés, IELTS, Business..."
                      value={profileForm.specialties} onChange={e => setProfileForm(p => ({ ...p, specialties: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Idiomas que enseña</label>
                    <Input data-testid="input-teacher-languages" placeholder="Inglés, Español..."
                      value={profileForm.languages} onChange={e => setProfileForm(p => ({ ...p, languages: e.target.value }))} className="rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Tarifa por hora (USD)</label>
                  <Input data-testid="input-teacher-rate" type="number" step="0.50" placeholder="25.00"
                    value={profileForm.hourlyRate} onChange={e => setProfileForm(p => ({ ...p, hourlyRate: e.target.value }))} className="rounded-xl" />
                </div>
                <Button data-testid="button-save-profile" onClick={handleSaveProfile} disabled={updateProfile.isPending} className="rounded-xl w-full">
                  {updateProfile.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Guardar Perfil
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
