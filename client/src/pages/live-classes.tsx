import { Layout } from "@/components/layout";
import { useLiveClasses, useRegisterClass } from "@/hooks/use-classes";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Video, Clock, Users, CheckCircle } from "lucide-react";
import { GamifiedButton } from "@/components/gamified-button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useState } from "react";

const CLASS_IMAGES = [
  "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=300&fit=crop",
];

export default function LiveClasses() {
  const { data: classes, isLoading } = useLiveClasses();
  const { mutate: register, isPending, variables: registeredId } = useRegisterClass();
  const { toast } = useToast();
  const [registered, setRegistered] = useState<Set<number>>(new Set());

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
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-black mb-2 flex items-center gap-3">
          <Video className="w-8 h-8 text-secondary" />
          Clases en Vivo
        </h1>
        <p className="text-muted-foreground">
          Practica con instructores expertos en tiempo real y mejora tu fluidez.
        </p>
      </header>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-72 bg-muted animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : classes && classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls, idx) => {
            const isRegistered = registered.has(cls.id);
            const isThisLoading = isPending && registeredId === cls.id;
            const imgSrc = CLASS_IMAGES[idx % CLASS_IMAGES.length];

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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    EN VIVO
                  </div>
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">
                    <Users className="w-3 h-3" />
                    <span>12 plazas</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-display font-bold mb-1.5 leading-tight">{cls.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">{cls.description}</p>

                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{format(new Date(cls.scheduledAt), "d 'de' MMMM, yyyy", { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="w-4 h-4 text-secondary flex-shrink-0" />
                      <span>{format(new Date(cls.scheduledAt), "HH:mm")} hrs · 45 min</span>
                    </div>
                  </div>

                  {isRegistered ? (
                    <div className="flex items-center justify-center gap-2 bg-success/10 text-success border-2 border-success/30 rounded-2xl py-3 font-bold text-sm">
                      <CheckCircle className="w-4 h-4" />
                      ¡Inscrito!
                    </div>
                  ) : (
                    <GamifiedButton
                      fullWidth
                      onClick={() => handleRegister(cls.id)}
                      disabled={isThisLoading || isPending}
                      data-testid={`btn-register-${cls.id}`}
                    >
                      {isThisLoading ? "Inscribiendo..." : "Reservar plaza"}
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
            Pronto agregaremos nuevas clases en vivo. ¡Vuelve a consultar!
          </p>
        </div>
      )}
    </Layout>
  );
}
