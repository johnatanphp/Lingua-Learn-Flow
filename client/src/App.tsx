import { lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

const Dashboard    = lazy(() => import("@/pages/dashboard"));
const LearningPath = lazy(() => import("@/pages/learning-path"));
const Lesson       = lazy(() => import("@/pages/lesson"));
const LiveClasses  = lazy(() => import("@/pages/live-classes"));
const AiPractice   = lazy(() => import("@/pages/ai-practice"));
const Achievements = lazy(() => import("@/pages/achievements"));
const Pricing      = lazy(() => import("@/pages/pricing"));
const Admin        = lazy(() => import("@/pages/admin"));
const Resources    = lazy(() => import("@/pages/resources"));
const Receipt      = lazy(() => import("@/pages/receipt"));
const Login        = lazy(() => import("@/pages/login"));
const NotFound     = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Cargando...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) return <PageLoader />;

  if (!user) {
    setTimeout(() => navigate("/login"), 0);
    return null;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={() => <Suspense fallback={<PageLoader />}><Login /></Suspense>} />
      <Route path="/"             component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/path"         component={() => <ProtectedRoute component={LearningPath} />} />
      <Route path="/lesson/:id"   component={() => <ProtectedRoute component={Lesson} />} />
      <Route path="/classes"      component={() => <ProtectedRoute component={LiveClasses} />} />
      <Route path="/ai-practice"  component={() => <ProtectedRoute component={AiPractice} />} />
      <Route path="/achievements" component={() => <ProtectedRoute component={Achievements} />} />
      <Route path="/planes"       component={() => <ProtectedRoute component={Pricing} />} />
      <Route path="/admin"        component={() => <ProtectedRoute component={Admin} />} />
      <Route path="/materiales"   component={() => <ProtectedRoute component={Resources} />} />
      <Route path="/comprobante"  component={() => <ProtectedRoute component={Receipt} />} />
      <Route component={() => <Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
