import { Layout } from "@/components/layout";
import { useLiveClasses, useRegisterClass } from "@/hooks/use-classes";
import { format } from "date-fns";
import { Calendar, Video, Clock, Users } from "lucide-react";
import { GamifiedButton } from "@/components/gamified-button";
import { useToast } from "@/hooks/use-toast";

export default function LiveClasses() {
  const { data: classes, isLoading } = useLiveClasses();
  const { mutate: register, isPending } = useRegisterClass();
  const { toast } = useToast();

  const handleRegister = (id: number) => {
    register(id, {
      onSuccess: () => {
        toast({
          title: "Registered successfully!",
          description: "You'll receive an email reminder before the class starts.",
        });
      },
      onError: (err) => {
        toast({
          title: "Registration failed",
          description: err.message,
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Layout>
      <header className="mb-10">
        <h1 className="text-4xl font-display font-black text-foreground mb-3">Live Classes</h1>
        <p className="text-muted-foreground text-lg">Practice speaking with expert instructors in real-time.</p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes?.map((cls) => (
            <div key={cls.id} className="bg-card border-2 border-border rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all group flex flex-col">
              {/* Image mockup */}
              <div className="h-32 bg-muted relative overflow-hidden">
                {/* live class people meeting */}
                <img 
                  src="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&h=400&fit=crop" 
                  alt="Class cover" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse"></span>
                  Live
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-display font-bold mb-2">{cls.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">{cls.description}</p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{format(new Date(cls.scheduledAt), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="w-4 h-4 text-secondary" />
                    <span>{format(new Date(cls.scheduledAt), "h:mm a")} (45 mins)</span>
                  </div>
                </div>

                <GamifiedButton 
                  fullWidth 
                  onClick={() => handleRegister(cls.id)}
                  disabled={isPending}
                >
                  {isPending ? "Registering..." : "Book Spot"}
                </GamifiedButton>
              </div>
            </div>
          ))}
          {(!classes || classes.length === 0) && (
            <div className="col-span-full text-center py-20 bg-card border-2 border-dashed border-border rounded-3xl">
              <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-muted-foreground">No upcoming classes</h3>
              <p className="text-muted-foreground mt-2">Check back later for new schedules!</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
