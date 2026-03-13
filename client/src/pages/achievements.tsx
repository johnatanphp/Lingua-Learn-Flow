import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { useAchievements, useProgress } from "@/hooks/use-learning";
import { Medal, Lock, Trophy, Star, Award, Zap } from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  Trophy: <Trophy className="w-9 h-9" />,
  Star:   <Star   className="w-9 h-9" />,
  Award:  <Award  className="w-9 h-9" />,
  Medal:  <Medal  className="w-9 h-9" />,
  Zap:    <Zap    className="w-9 h-9" />,
};

export default function Achievements() {
  const { data: achievements, isLoading } = useAchievements();
  const { data: progress } = useProgress();
  const xp = progress?.xp || 0;

  const unlocked = achievements?.filter(a => xp >= a.requiredXp) ?? [];
  const locked   = achievements?.filter(a => xp < a.requiredXp)  ?? [];

  if (isLoading) {
    return (
      <Layout>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-3xl" />
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-display font-black flex items-center gap-3 mb-2">
          <Medal className="w-9 h-9 text-accent" />
          Logros y Medallas
        </h1>
        <p className="text-muted-foreground">
          Has desbloqueado <strong>{unlocked.length}</strong> de{" "}
          <strong>{achievements?.length || 0}</strong> logros.
        </p>
      </header>

      {/* Progress overview */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-border rounded-3xl p-5 mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">Tu XP actual</p>
          <p className="text-3xl font-black text-primary">{xp} XP</p>
        </div>
        <div className="flex gap-2">
          {unlocked.slice(-3).map((a) => (
            <div
              key={a.id}
              className="w-11 h-11 rounded-full bg-accent/20 text-accent flex items-center justify-center"
              title={a.name}
            >
              {ICON_MAP[a.icon] || <Trophy className="w-6 h-6" />}
            </div>
          ))}
        </div>
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-accent fill-accent" /> Desbloqueados
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {unlocked.map((ach, idx) => (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                data-testid={`achievement-${ach.id}`}
                className="bg-card border-2 border-accent/30 rounded-3xl p-5 text-center shadow-sm hover:shadow-md hover:border-accent/60 transition-all"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-accent/20 text-accent flex items-center justify-center mb-3 border-4 border-accent/20">
                  {ICON_MAP[ach.icon] || <Trophy className="w-9 h-9" />}
                </div>
                <h3 className="font-display font-bold text-base mb-1 leading-tight">{ach.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{ach.description}</p>
                <span className="inline-block bg-accent/10 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {ach.requiredXp} XP
                </span>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <section>
          <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2 text-muted-foreground">
            <Lock className="w-5 h-5" /> Por desbloquear
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {locked.map((ach) => (
              <div
                key={ach.id}
                data-testid={`achievement-locked-${ach.id}`}
                className="bg-card border-2 border-border rounded-3xl p-5 text-center opacity-60 grayscale"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-3 relative">
                  {ICON_MAP[ach.icon] || <Trophy className="w-9 h-9 text-muted-foreground" />}
                  <div className="absolute -bottom-1 -right-1 bg-background border-2 border-border p-1.5 rounded-full">
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="font-display font-bold text-sm mb-1">{ach.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{ach.description}</p>
                <span className="inline-block bg-muted text-muted-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                  {ach.requiredXp} XP necesarios
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {(!achievements || achievements.length === 0) && (
        <div className="py-24 text-center text-muted-foreground">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-bold">No hay logros configurados aún</p>
          <p className="text-sm mt-1">¡Vuelve pronto para ver tus medallas!</p>
        </div>
      )}
    </Layout>
  );
}
