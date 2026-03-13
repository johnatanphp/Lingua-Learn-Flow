import { Link, useLocation } from "wouter";
import {
  BookOpen, LayoutDashboard, CalendarDays,
  Sparkles, Medal, LogOut, Zap, Flame,
  GraduationCap, Users, Shield, Globe, CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useProgress } from "@/hooks/use-learning";

const ROLE_CONFIG: Record<string, { label: string; color: string; Icon: any }> = {
  student: { label: "Estudiante", color: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: GraduationCap },
  teacher: { label: "Profesor",   color: "bg-blue-50 text-blue-700 border-blue-200",         Icon: Users },
  admin:   { label: "Admin",      color: "bg-purple-50 text-purple-700 border-purple-200",   Icon: Shield },
  guest:   { label: "Invitado",   color: "bg-orange-50 text-orange-700 border-orange-200",   Icon: Globe },
};

const NAV_ITEMS = [
  { href: "/",             label: "Inicio",        icon: LayoutDashboard },
  { href: "/path",         label: "Mi camino",     icon: BookOpen },
  { href: "/classes",      label: "Clases",        icon: CalendarDays },
  { href: "/ai-practice",  label: "IA",            icon: Sparkles },
  { href: "/achievements", label: "Logros",        icon: Medal },
  { href: "/planes",       label: "Planes",        icon: CreditCard },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout, isLoading: authLoading } = useAuth();
  const { data: progress } = useProgress();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!user && location !== "/login") {
    window.location.href = "/login";
    return null;
  }

  const roleConf = user?.role ? ROLE_CONFIG[user.role] : null;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">

      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside className="w-64 bg-card border-r border-border/50 hidden md:flex flex-col sticky top-0 h-screen shadow-sm z-40">
        {/* Logo */}
        <div className="p-5 pb-3 border-b border-border/50">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl text-white">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-xl font-display font-black text-foreground tracking-tight">
              Lingua<span className="text-primary">Learn</span>
            </span>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/"
              ? location === "/"
              : location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`nav-${item.href.replace("/", "") || "home"}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-border/50 space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="Avatar"
                  className="w-9 h-9 rounded-full border-2 border-border shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0 text-sm">
                  {user.firstName?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
                {roleConf && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleConf.color}`}>
                    <roleConf.Icon className="w-2.5 h-2.5" />
                    {roleConf.label}
                  </span>
                )}
              </div>
            </div>
          )}
          <button
            data-testid="button-logout"
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl font-semibold text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main Area ───────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-16 bg-background/80 backdrop-blur-md sticky top-0 z-30 border-b border-border/50 flex items-center justify-between px-4 md:px-6">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-2">
            <div className="bg-gradient-to-br from-primary to-secondary p-1.5 rounded-lg text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-display font-black text-lg">LinguaLearn</span>
          </div>

          <div className="hidden md:block" />

          {/* Stats */}
          <div className="flex items-center gap-2 md:gap-3">
            {roleConf && (
              <Badge
                data-testid="badge-role"
                className={`hidden md:flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${roleConf.color}`}
              >
                <roleConf.Icon className="w-3 h-3" />
                {roleConf.label}
              </Badge>
            )}
            <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-2.5 py-1.5 rounded-full font-bold text-xs">
              <Flame className="w-3.5 h-3.5" />
              <span data-testid="stat-streak">{progress?.streakDays || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1.5 rounded-full font-bold text-xs">
              <Zap className="w-3.5 h-3.5" />
              <span data-testid="stat-xp">{progress?.xp || 0} XP</span>
            </div>
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-border" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                {user?.firstName?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full pb-24 md:pb-6">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-md border-t border-border z-50" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around px-1 py-1">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/"
              ? location === "/"
              : location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`mobile-nav-${item.href.replace("/", "") || "home"}`}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all min-w-0 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`p-1.5 rounded-xl mb-0.5 ${active ? "bg-primary/10" : ""}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
