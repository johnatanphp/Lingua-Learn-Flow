import { Layout } from "@/components/layout";
import { useLevels, useLevelLessons, useProgress } from "@/hooks/use-learning";
import { motion } from "framer-motion";
import { Lock, Star, CheckCircle, BookOpen } from "lucide-react";
import { Link } from "wouter";
import type { Level } from "@shared/schema";

function LevelSection({
  level,
  isLocked,
  isCurrent,
}: {
  level: Level;
  isLocked: boolean;
  isCurrent: boolean;
}) {
  const { data: lessons, isLoading } = useLevelLessons(level.id);

  if (isLoading) return <div className="h-44 bg-muted/50 rounded-3xl animate-pulse my-8" />;

  return (
    <div className={`relative py-10 ${isLocked ? "opacity-50" : ""}`}>
      {/* Level badge */}
      <div className="flex flex-col items-center mb-8">
        <span
          className={`px-5 py-1.5 rounded-full font-bold text-sm border-2 mb-3 ${
            isCurrent
              ? "bg-primary text-primary-foreground border-primary"
              : isLocked
              ? "bg-muted text-muted-foreground border-border"
              : "bg-success text-success-foreground border-success"
          }`}
        >
          {level.name}
        </span>
        <h2 className="text-xl md:text-2xl font-display font-bold text-center max-w-xs text-muted-foreground">
          {level.description}
        </h2>
      </div>

      {/* Lesson bubbles */}
      <div className="relative max-w-xs mx-auto">
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-3 bg-border rounded-full -z-10" />

        <div className="space-y-10">
          {lessons?.map((lesson, idx) => {
            const zigzag = idx % 2 === 0;
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, scale: 0.75 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center ${zigzag ? "justify-start pl-4" : "justify-end pr-4"} relative`}
              >
                {/* Lesson card tooltip */}
                <div
                  className={`absolute ${zigzag ? "left-28" : "right-28"} bg-card border-2 border-border px-3 py-2 rounded-xl shadow-md text-xs font-bold max-w-[120px] text-center hidden sm:block`}
                >
                  {lesson.title}
                </div>

                {isLocked ? (
                  <div className="w-20 h-20 rounded-full bg-muted border-4 border-border flex items-center justify-center shadow-sm">
                    <Lock className="w-8 h-8 text-muted-foreground" />
                  </div>
                ) : (
                  <Link href={`/lesson/${lesson.id}`}>
                    <button
                      data-testid={`btn-lesson-${lesson.id}`}
                      className={`
                        w-20 h-20 rounded-full border-b-[6px] border-x-2 border-t-2 
                        flex items-center justify-center shadow-lg relative overflow-hidden
                        transition-transform active:translate-y-1.5 active:border-b-[2px]
                        ${
                          isCurrent && idx === 0
                            ? "bg-primary border-white/20 text-white"
                            : "bg-success border-white/20 text-white"
                        }
                      `}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                      <Star className="w-9 h-9 fill-current relative z-10" />
                    </button>
                  </Link>
                )}
              </motion.div>
            );
          })}

          {(!lessons || lessons.length === 0) && !isLocked && (
            <div className="flex justify-center">
              <div className="text-center bg-card border-2 border-dashed border-border rounded-2xl p-6 text-muted-foreground text-sm max-w-xs">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Próximamente más lecciones</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LearningPath() {
  const { data: levels, isLoading } = useLevels();
  const { data: progress } = useProgress();

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-8 animate-pulse">
          <div className="h-20 bg-muted rounded-3xl mx-auto max-w-xs" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted rounded-3xl" />
          ))}
        </div>
      </Layout>
    );
  }

  const xp = progress?.xp || 0;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-4 pb-24 md:pb-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-black mb-2">
            Tu Camino 🗺️
          </h1>
          <p className="text-muted-foreground text-base">
            Completa lecciones para desbloquear el siguiente nivel
          </p>
        </header>

        {/* XP Overview strip */}
        <div className="bg-card border-2 border-border rounded-2xl px-5 py-4 mb-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-accent fill-accent" />
            <span className="font-bold text-sm">Tu progreso</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-black text-lg text-primary">{xp} XP</p>
            </div>
            <div className="flex items-center gap-1 text-success text-sm font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>Activo</span>
            </div>
          </div>
        </div>

        {levels?.map((level) => {
          const isLocked = xp < level.requiredXp;
          const nextLevelXp = levels.find((l) => l.order === level.order + 1)?.requiredXp ?? Infinity;
          const isCurrent = xp >= level.requiredXp && xp < nextLevelXp;
          return (
            <LevelSection
              key={level.id}
              level={level}
              isLocked={isLocked}
              isCurrent={isCurrent}
            />
          );
        })}

        {(!levels || levels.length === 0) && (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold">No hay niveles configurados aún</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
