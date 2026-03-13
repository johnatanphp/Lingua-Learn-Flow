import { Link, useLocation } from "wouter";
import { 
  BookOpen, LayoutDashboard, CalendarDays, 
  Sparkles, Medal, LogOut, Zap, Flame,
  GraduationCap, Users, Shield, Globe
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useProgress } from "@/hooks/use-learning";

const ROLE_CONFIG: Record<string, { label: string; color: string; Icon: any }> = {
  student: { label: "Estudiante", color: "bg-green-100 text-green-700 border-green-200", Icon: GraduationCap },
  teacher: { label: "Profesor", color: "bg-blue-100 text-blue-700 border-blue-200", Icon: Users },
  admin: { label: "Admin", color: "bg-purple-100 text-purple-700 border-purple-200", Icon: Shield },
  guest: { label: "Invitado", color: "bg-orange-100 text-orange-700 border-orange-200", Icon: Globe },
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout, isLoading: authLoading } = useAuth();
  const { data: progress } = useProgress();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (!user && location !== "/login") {
    window.location.href = "/login";
    return null;
  }

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/path", label: "Learning Path", icon: BookOpen },
    { href: "/classes", label: "Live Classes", icon: CalendarDays },
    { href: "/ai-practice", label: "AI Practice", icon: Sparkles },
    { href: "/achievements", label: "Achievements", icon: Medal },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-card border-r border-border/50 hidden md:flex flex-col sticky top-0 h-screen shadow-sm z-40">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-display font-black text-foreground tracking-tight">Lingua<span className="text-primary">Flow</span></h1>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`
                flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all duration-200
                ${active 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"}
              `}>
                <item.icon className={`w-5 h-5 ${active ? "animate-pulse" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2">
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="w-9 h-9 rounded-full border-2 border-border shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                  {user.firstName?.[0] || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
                {user.role && ROLE_CONFIG[user.role] && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_CONFIG[user.role].color}`}>
                    {(() => { const RoleIcon = ROLE_CONFIG[user.role].Icon; return <RoleIcon className="w-2.5 h-2.5" />; })()}
                    {ROLE_CONFIG[user.role].label}
                  </span>
                )}
              </div>
            </div>
          )}
          <button
            data-testid="button-logout"
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Topbar for Stats */}
        <header className="h-20 bg-background/80 backdrop-blur-md sticky top-0 z-30 border-b border-border/50 flex items-center justify-between px-4 md:px-8">
          <div className="md:hidden flex items-center gap-2">
             <BookOpen className="w-6 h-6 text-primary" />
             <span className="font-display font-bold text-xl">LinguaFlow</span>
          </div>
          
          <div className="hidden md:flex"></div>

          {/* User Stats */}
          <div className="flex items-center gap-3 md:gap-4">
            {user?.role && ROLE_CONFIG[user.role] && (
              <Badge
                data-testid="badge-role"
                className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${ROLE_CONFIG[user.role].color}`}
              >
                {(() => { const RoleIcon = ROLE_CONFIG[user.role].Icon; return <RoleIcon className="w-3 h-3" />; })()}
                {ROLE_CONFIG[user.role].label}
              </Badge>
            )}
            <div className="flex items-center gap-2 bg-accent/15 text-accent-foreground px-3 py-1.5 rounded-full font-bold text-sm">
              <Flame className="w-4 h-4 text-accent" />
              <span>{progress?.streakDays || 0}</span>
            </div>
            <div className="flex items-center gap-2 bg-primary/15 text-primary px-3 py-1.5 rounded-full font-bold text-sm">
              <Zap className="w-4 h-4" />
              <span>{progress?.xp || 0} XP</span>
            </div>
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Profile" className="w-9 h-9 rounded-full border-2 border-border" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {user?.firstName?.[0] || 'U'}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`
                flex flex-col items-center justify-center p-2 rounded-xl transition-colors
                ${active ? "text-primary" : "text-muted-foreground"}
              `}>
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
