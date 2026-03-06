import { Layout } from "@/components/layout";
import { useLevels, useLevelLessons, useProgress } from "@/hooks/use-learning";
import { motion } from "framer-motion";
import { Lock, Star, CheckCircle, Play } from "lucide-react";
import { Link } from "wouter";

// Component to fetch and display lessons for a level
function LevelSection({ level, isLocked, isCurrent }: { level: any, isLocked: boolean, isCurrent: boolean }) {
  const { data: lessons, isLoading } = useLevelLessons(level.id);

  if (isLoading) return <div className="h-40 bg-muted/50 rounded-3xl animate-pulse my-8" />;

  return (
    <div className={`relative py-12 ${isLocked ? "opacity-60 grayscale" : ""}`}>
      {/* Level Header */}
      <div className="flex flex-col items-center mb-8 relative z-10">
        <div className={`
          px-6 py-2 rounded-full font-bold text-sm mb-4 border-2
          ${isCurrent ? "bg-primary text-primary-foreground border-primary" : 
            isLocked ? "bg-muted text-muted-foreground border-border" : 
            "bg-success text-success-foreground border-success"}
        `}>
          {level.name}
        </div>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-center">
          {level.description}
        </h2>
      </div>

      {/* The Path connecting lessons */}
      <div className="relative max-w-md mx-auto">
        {/* SVG Path line */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 bg-muted rounded-full -z-10" />

        <div className="space-y-12">
          {lessons?.map((lesson, idx) => {
            // Create a zigzag effect
            const isLeft = idx % 2 === 0;
            return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                key={lesson.id} 
                className={`flex items-center justify-center relative ${isLeft ? "pr-24" : "pl-24"}`}
              >
                {isLocked ? (
                  <div className="w-20 h-20 rounded-full bg-muted border-4 border-border flex items-center justify-center shadow-sm">
                    <Lock className="w-8 h-8 text-muted-foreground" />
                  </div>
                ) : (
                  <Link href={`/lesson/${lesson.id}`}>
                    <button className={`
                      w-20 h-20 rounded-full border-b-[6px] border-x-[2px] border-t-[2px] transition-transform active:translate-y-2 active:border-b-[2px]
                      flex items-center justify-center shadow-lg relative
                      ${isCurrent && idx === 0 
                        ? "bg-primary border-primary-foreground/20 text-white" 
                        : "bg-success border-success-foreground/20 text-white"}
                    `}>
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
                      <Star className="w-8 h-8 fill-current" />
                      
                      {/* Floating tooltip */}
                      <div className="absolute -top-12 whitespace-nowrap bg-card border-2 border-border text-foreground px-4 py-2 rounded-xl font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                        {lesson.title}
                      </div>
                    </button>
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function LearningPath() {
  const { data: levels, isLoading: levelsLoading } = useLevels();
  const { data: progress } = useProgress();

  if (levelsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const xp = progress?.xp || 0;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-black text-foreground mb-4">Your Path</h1>
          <p className="text-muted-foreground text-lg">Follow the path to master the language!</p>
        </header>

        <div className="space-y-4">
          {levels?.map((level) => {
            const isLocked = xp < level.requiredXp;
            // Hacky way to find "current" level. Real app would check exact lesson progress.
            const isCurrent = xp >= level.requiredXp && xp < (levels.find(l => l.order === level.order + 1)?.requiredXp || Infinity);
            
            return (
              <LevelSection 
                key={level.id} 
                level={level} 
                isLocked={isLocked}
                isCurrent={isCurrent}
              />
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
