import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { useProgress, useLevels, useAchievements } from "@/hooks/use-learning";
import { useAuth } from "@/hooks/use-auth";
import { Trophy, Star, Target, Flame, ArrowRight, BookOpen, CalendarDays, Sparkles, Zap, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { GamifiedButton } from "@/components/gamified-button";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: levels, isLoading: levelsLoading } = useLevels();
  const { data: achievements } = useAchievements();

  if (progressLoading || levelsLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-40 bg-muted rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-40 bg-muted rounded-3xl md:col-span-2" />
            <div className="h-40 bg-muted rounded-3xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="h-32 bg-muted rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  const xp = progress?.xp || 0;
  const currentLevel = levels?.slice().reverse().find(l => xp >= l.requiredXp) || levels?.[0];
  const nextLevel = levels?.find(l => l.requiredXp > xp);
  const xpProgress = nextLevel
    ? Math.min(((xp - (currentLevel?.requiredXp || 0)) / ((nextLevel.requiredXp - (currentLevel?.requiredXp || 0)) || 1)) * 100, 100)
    : 100;

  const firstName = user?.firstName || "Estudiante";
  const unlockedCount = achievements?.filter(a => xp >= a.requiredXp).length || 0;

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6 pb-24 md:pb-0"
      >
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-br from-primary via-primary to-secondary rounded-3xl p-7 md:p-10 text-white shadow-2xl overflow-hidden">
          <div className="absolute -top-8 -right-8 opacity-10 pointer-events-none">
            <Trophy className="w-52 h-52" />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-semibold mb-1 uppercase tracking-widest">¡Bienvenido de nuevo!</p>
            <h2 className="text-3xl md:text-4xl font-display font-black mb-3">
              Hola, {firstName} 👋
            </h2>
            <p className="text-white/80 text-base mb-6 max-w-sm">
              {nextLevel
                ? `Estás a ${nextLevel.requiredXp - xp} XP de alcanzar "${nextLevel.name}". ¡Sigue así!`
                : "¡Has alcanzado el nivel máximo! Eres un maestro del idioma."}
            </p>
            <Link href="/path">
              <GamifiedButton variant="accent" size="lg" data-testid="btn-continue-learning">
                Continuar aprendiendo <ArrowRight className="w-5 h-5" />
              </GamifiedButton>
            </Link>
          </div>
        </section>

        {/* Progress + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Level Progress Card */}
          <div className="lg:col-span-2 bg-card border-2 border-border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold">Nivel actual</h3>
                  <p className="text-muted-foreground text-sm">{currentLevel?.name || "Principiante"}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-primary">{xp} XP</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {nextLevel ? `Meta: ${nextLevel.requiredXp} XP` : "¡Nivel máximo!"}
                </p>
              </div>
            </div>

            {/* XP Bar */}
            <div className="relative h-5 bg-muted rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
              </motion.div>
            </div>
            <div className="flex justify-between text-xs font-bold text-muted-foreground">
              <span>{currentLevel?.name || "Inicio"}</span>
              <span>{Math.round(xpProgress)}%</span>
              <span>{nextLevel?.name || "Maestro"}</span>
            </div>

            {/* Mini stats row */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { icon: Flame, label: "Racha", value: `${progress?.streakDays || 0} días`, color: "text-orange-500 bg-orange-50" },
                { icon: Zap,   label: "XP Total", value: `${xp}`, color: "text-primary bg-primary/10" },
                { icon: TrendingUp, label: "Logros", value: `${unlockedCount}/${achievements?.length || 0}`, color: "text-emerald-600 bg-emerald-50" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-muted/50 rounded-2xl p-3 text-center">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-1.5 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-black text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Goal */}
          <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-sm flex flex-col">
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-accent" /> Meta diaria
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <div className="relative w-28 h-28 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                  <motion.circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="251.2"
                    initial={{ strokeDashoffset: 251.2 }}
                    animate={{ strokeDashoffset: 251.2 * (1 - Math.min(xp / 50, 1)) }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black">{Math.min(xp, 50)}</span>
                  <span className="text-xs text-muted-foreground">/ 50 XP</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {xp >= 50 ? "🎉 ¡Meta de hoy completada!" : `Gana ${50 - Math.min(xp, 50)} XP más hoy`}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <section>
          <h3 className="text-xl font-display font-bold mb-4">Acciones rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                href: "/path",
                icon: BookOpen,
                title: "Camino de aprendizaje",
                desc: "Continúa donde lo dejaste",
                color: "bg-primary/10 text-primary",
                border: "hover:border-primary/50",
              },
              {
                href: "/classes",
                icon: CalendarDays,
                title: "Clases en vivo",
                desc: "Practica con instructores",
                color: "bg-secondary/10 text-secondary",
                border: "hover:border-secondary/50",
              },
              {
                href: "/ai-practice",
                icon: Sparkles,
                title: "Práctica con IA",
                desc: "Conversación libre con IA",
                color: "bg-accent/15 text-amber-600",
                border: "hover:border-accent/50",
              },
            ].map(({ href, icon: Icon, title, desc, color, border }) => (
              <Link key={href} href={href}>
                <div
                  data-testid={`card-action-${href.replace("/", "")}`}
                  className={`bg-card border-2 border-border ${border} hover:shadow-md transition-all duration-200 rounded-2xl p-5 cursor-pointer group`}
                >
                  <div className={`${color} w-11 h-11 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base">{title}</h4>
                  <p className="text-muted-foreground text-sm mt-0.5">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </motion.div>
    </Layout>
  );
}
