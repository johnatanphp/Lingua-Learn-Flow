import { Layout } from "@/components/layout";
import { useLiveClasses, useRegisterClass } from "@/hooks/use-classes";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Video, Clock, Users, CheckCircle, Link as LinkIcon, GraduationCap, Youtube, X, FileText } from "lucide-react";
import { GamifiedButton } from "@/components/gamified-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useState } from "react";
import type { LiveClass } from "@shared/schema";

const CLASS_IMAGES = [
  "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1610484826967-09c5720778c7?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=300&fit=crop",
];

const LEVEL_COLORS: Record<string, string> = {
  principiante: "bg-emerald-100 text-emerald-700 border-emerald-200",
  básico: "bg-blue-100 text-blue-700 border-blue-200",
  intermedio: "bg-orange-100 text-orange-700 border-orange-200",
  avanzado: "bg-red-100 text-red-700 border-red-200",
  todos: "bg-violet-100 text-violet-700 border-violet-200",
};

interface ClassWithDetails extends LiveClass {
  instructorName?: string;
  registrationCount?: number;
  youtubeStreamId?: string | null;
  youtubeChannelId?: string | null;
  driveResourceUrl?: string | null;
}

interface ClassesResponse {
  classes: ClassWithDetails[];
}

export default function LiveClasses() {
  const { data: classes, isLoading } = useLiveClasses() as { data: ClassWithDetails[] | undefined; isLoading: boolean };
  const { mutate: register, isPending, variables: registeredId } = useRegisterClass();
  const { toast } = useToast();
  const [registered, setRegistered] = useState<Set<number>>(new Set());
  const [activeYouTube, setActiveYouTube] = useState<{ id: string; title: string; isChannel?: boolean } | null>(null);

  const handleRegister = (id: number) => {
    register(id, {
      onSuccess: () => {
        setRegistered((prev) => new Set(prev).add(id));
        toast({
          title: "✅ ¡Inscrito con éxito!",
          description: "Te notificaremos antes de que empiece la clase.",
        });
      },
      onError: (err) => {
        toast({
          title: "Error al inscribirse",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Layout>
      {/* YouTube Player Modal */}
      {activeYouTube && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActiveYouTube(null)}>
          <div className="bg-black rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 bg-black/80">
              <div className="flex items-center gap-2 text-white">
                <Youtube className="w-5 h-5 text-red-500" />
                <span className="font-bold text-sm">{activeYouTube.title}</span>
                <Badge className="bg-red-600 text-white text-[10px] border-0">EN VIVO</Badge>
              </div>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setActiveYouTube(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={
                  activeYouTube.isChannel
                    ? `https://www.youtube.com/embed/live_stream?channel=${activeYouTube.id}&rel=0&modestbranding=1&autoplay=1`
                    : `https://www.youtube.com/embed/${activeYouTube.id}?rel=0&modestbranding=1&autoplay=1`
                }
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                title={activeYouTube.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-black mb-2 flex items-center gap-3">
          <Video className="w-8 h-8 text-secondary" />
          Clases en Vivo
        </h1>
        <p className="text-muted-foreground">
          Practica con instructores expertos en tiempo real y mejora tu fluidez en Speak Fluently.
        </p>
      </header>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : classes && classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls, idx) => {
            const isRegistered = registered.has(cls.id);
            const isThisLoading = isPending && registeredId === cls.id;
            const imgSrc = CLASS_IMAGES[idx % CLASS_IMAGES.length];
            const spotsLeft = (cls.maxStudents ?? 20) - (cls.registrationCount ?? 0);
            const levelColor = LEVEL_COLORS[cls.level ?? "todos"] ?? LEVEL_COLORS.todos;

            return (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                data-testid={`card-class-${cls.id}`}
                className="bg-card border-2 border-border hover:border-secondary/40 hover:shadow-lg transition-all rounded-3xl overflow-hidden flex flex-col group"
              >
                {/* Cover Image */}
                <div className="h-36 relative overflow-hidden bg-muted">
                  <img
                    src={imgSrc}
                    alt={cls.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    EN VIVO
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className={`text-[10px] border font-semibold capitalize ${levelColor}`}>
                      {cls.level ?? "Todos"}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">
                    <Users className="w-3 h-3" />
                    <span>{spotsLeft > 0 ? `${spotsLeft} plazas` : "Completo"}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-display font-bold mb-1.5 leading-tight">{cls.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3 flex-1">{cls.description}</p>

                  {/* Instructor */}
                  {cls.instructorName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <GraduationCap className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-medium">{cls.instructorName}</span>
                    </div>
                  )}

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{format(new Date(cls.scheduledAt), "d 'de' MMMM, yyyy", { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="w-4 h-4 text-secondary flex-shrink-0" />
                      <span>{format(new Date(cls.scheduledAt), "HH:mm")} hrs · {cls.durationMinutes ?? 45} min</span>
                    </div>
                  </div>

                  {isRegistered ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border-2 border-emerald-200 rounded-2xl py-2.5 font-bold text-sm">
                        <CheckCircle className="w-4 h-4" /> ¡Inscrito!
                      </div>
                      {(cls.youtubeStreamId || cls.youtubeChannelId) && (
                        <button
                          data-testid={`btn-watch-youtube-${cls.id}`}
                          onClick={() => setActiveYouTube({
                            id: (cls.youtubeStreamId || cls.youtubeChannelId)!,
                            title: cls.title,
                            isChannel: !cls.youtubeStreamId && !!cls.youtubeChannelId,
                          })}
                          className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 py-2.5 rounded-2xl transition-colors"
                        >
                          <Youtube className="w-4 h-4" /> Ver clase en YouTube
                        </button>
                      )}
                      {cls.meetingUrl && (
                        <a
                          href={cls.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`link-meeting-${cls.id}`}
                          className="flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline py-2 bg-primary/5 rounded-2xl border border-primary/20 transition-colors hover:bg-primary/10"
                        >
                          <LinkIcon className="w-4 h-4" /> Unirse (Zoom/Meet)
                        </a>
                      )}
                      {cls.driveResourceUrl && (
                        <a
                          href={cls.driveResourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`link-drive-${cls.id}`}
                          className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:underline py-2 bg-blue-50 rounded-2xl border border-blue-200 transition-colors hover:bg-blue-100"
                        >
                          <FileText className="w-4 h-4" /> Material de clase (Drive)
                        </a>
                      )}
                    </div>
                  ) : (
                    <GamifiedButton
                      fullWidth
                      onClick={() => handleRegister(cls.id)}
                      disabled={isThisLoading || isPending || spotsLeft <= 0}
                      data-testid={`btn-register-${cls.id}`}
                    >
                      {isThisLoading ? "Inscribiendo..." : spotsLeft <= 0 ? "Sin plazas" : "Reservar plaza"}
                    </GamifiedButton>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <Video className="w-10 h-10 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-display font-bold text-muted-foreground mb-2">
            No hay clases disponibles
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Pronto agregaremos nuevas clases en vivo. El administrador puede crearlas desde el panel de administración.
          </p>
        </div>
      )}
    </Layout>
  );
}
