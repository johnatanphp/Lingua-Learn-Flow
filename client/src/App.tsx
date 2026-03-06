import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

// Page Imports
import Dashboard from "./pages/dashboard";
import LearningPath from "./pages/learning-path";
import Lesson from "./pages/lesson";
import LiveClasses from "./pages/live-classes";
import AiPractice from "./pages/ai-practice";
import Achievements from "./pages/achievements";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    window.location.href = "/api/login";
    return null;
  }
  
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/path" component={() => <ProtectedRoute component={LearningPath} />} />
      <Route path="/lesson/:id" component={() => <ProtectedRoute component={Lesson} />} />
      <Route path="/classes" component={() => <ProtectedRoute component={LiveClasses} />} />
      <Route path="/ai-practice" component={() => <ProtectedRoute component={AiPractice} />} />
      <Route path="/achievements" component={() => <ProtectedRoute component={Achievements} />} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
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
