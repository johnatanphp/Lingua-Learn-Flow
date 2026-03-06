import { Layout } from "@/components/layout";
import { useAchievements, useProgress } from "@/hooks/use-learning";
import { Medal, Lock } from "lucide-react";

export default function Achievements() {
  const { data: achievements, isLoading } = useAchievements();
  const { data: progress } = useProgress();

  if (isLoading) {
    return (
      <Layout>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-3xl" />)}
         </div>
      </Layout>
    );
  }

  const xp = progress?.xp || 0;

  return (
    <Layout>
      <header className="mb-10">
        <h1 className="text-4xl font-display font-black text-foreground mb-3 flex items-center gap-3">
          <Medal className="w-10 h-10 text-accent" />
          Badges & Achievements
        </h1>
        <p className="text-muted-foreground text-lg">Earn XP to unlock exclusive profile badges!</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {achievements?.map((ach) => {
          const isUnlocked = xp >= ach.requiredXp;
          return (
            <div 
              key={ach.id} 
              className={`
                bg-card border-2 rounded-3xl p-6 text-center transition-all duration-300
                ${isUnlocked ? "border-accent shadow-lg shadow-accent/10" : "border-border opacity-70 grayscale"}
              `}
            >
              <div className={`
                w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 relative
                ${isUnlocked ? "bg-accent/20" : "bg-muted"}
              `}>
                <span className="text-5xl">{ach.icon}</span>
                {!isUnlocked && (
                  <div className="absolute -bottom-2 -right-2 bg-card border-2 border-border p-1.5 rounded-full text-muted-foreground">
                    <Lock className="w-4 h-4" />
                  </div>
                )}
              </div>
              
              <h3 className="font-bold font-display text-lg mb-1">{ach.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{ach.description}</p>
              
              <div className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-bold text-foreground">
                {ach.requiredXp} XP
              </div>
            </div>
          );
        })}
        {(!achievements || achievements.length === 0) && (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            No achievements configured in database.
          </div>
        )}
      </div>
    </Layout>
  );
}
