import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { useProgress, useLevels, useAchievements } from "@/hooks/use-learning";
import { Trophy, Star, Target, Flame, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { GamifiedButton } from "@/components/gamified-button";

export default function Dashboard() {
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: levels, isLoading: levelsLoading } = useLevels();
  const { data: achievements } = useAchievements();

  if (progressLoading || levelsLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-muted rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-48 bg-muted rounded-3xl" />
            <div className="h-48 bg-muted rounded-3xl" />
            <div className="h-48 bg-muted rounded-3xl" />
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate level based on XP
  const xp = progress?.xp || 0;
  const currentLevel = levels?.slice().reverse().find(l => xp >= l.requiredXp) || levels?.[0];
  const nextLevel = levels?.find(l => l.requiredXp > xp);
  
  const xpProgress = nextLevel 
    ? ((xp - (currentLevel?.requiredXp || 0)) / (nextLevel.requiredXp - (currentLevel?.requiredXp || 0))) * 100 
    : 100;

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Welcome Hero */}
        <section className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-10 translate-x-10 opacity-10">
            <Trophy className="w-64 h-64" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-display font-black mb-4">Ready to learn?</h2>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl">
              You're making great progress! Continue your journey to reach {nextLevel?.name || "the top"}.
            </p>
            <Link href="/path">
              <GamifiedButton variant="accent" size="lg" className="text-accent-foreground">
                Continue Learning <ArrowRight className="w-5 h-5" />
              </GamifiedButton>
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Level Progress */}
          <div className="lg:col-span-2 bg-card border-2 border-border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold">Current Level</h3>
                  <p className="text-muted-foreground">{currentLevel?.name || "Beginner"}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">{xp} XP</span>
                <p className="text-sm text-muted-foreground">{nextLevel ? `${nextLevel.requiredXp} XP for next level` : "Max level!"}</p>
              </div>
            </div>

            <div className="relative h-6 bg-muted rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-0 left-0 bottom-0 bg-success rounded-full"
              >
                <div className="absolute inset-0 bg-white/20 w-full h-1/3"></div>
              </motion.div>
            </div>
            
            <div className="mt-6 flex justify-between text-sm font-bold text-muted-foreground">
              <span>{currentLevel?.name}</span>
              <span>{nextLevel?.name || "Master"}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-xl font-display font-bold mb-2">Your Stats</h3>
            
            <div className="flex items-center justify-between bg-accent/10 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <Flame className="w-6 h-6 text-accent" />
                <span className="font-bold text-foreground">Day Streak</span>
              </div>
              <span className="font-black text-xl">{progress?.streakDays || 0}</span>
            </div>

            <div className="flex items-center justify-between bg-secondary/10 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 text-secondary" />
                <span className="font-bold text-foreground">Achievements</span>
              </div>
              <span className="font-black text-xl">{achievements?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Recommended Actions */}
        <section>
          <h3 className="text-2xl font-display font-bold mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/classes">
              <div className="bg-card border-2 border-border hover:border-primary/50 hover:shadow-lg transition-all rounded-2xl p-6 cursor-pointer group">
                <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-lg">Join a Live Class</h4>
                <p className="text-muted-foreground text-sm mt-1">Practice speaking with instructors.</p>
              </div>
            </Link>
            <Link href="/ai-practice">
              <div className="bg-card border-2 border-border hover:border-secondary/50 hover:shadow-lg transition-all rounded-2xl p-6 cursor-pointer group">
                <div className="bg-secondary/10 w-12 h-12 rounded-xl flex items-center justify-center text-secondary mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-lg">AI Conversation</h4>
                <p className="text-muted-foreground text-sm mt-1">Chat dynamically with an AI tutor.</p>
              </div>
            </Link>
            <Link href="/path">
              <div className="bg-card border-2 border-border hover:border-success/50 hover:shadow-lg transition-all rounded-2xl p-6 cursor-pointer group">
                <div className="bg-success/10 w-12 h-12 rounded-xl flex items-center justify-center text-success mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-lg">Continue Path</h4>
                <p className="text-muted-foreground text-sm mt-1">Jump right back where you left off.</p>
              </div>
            </Link>
          </div>
        </section>
      </motion.div>
    </Layout>
  );
}
