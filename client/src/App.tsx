import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Page Imports
import Dashboard from "./pages/dashboard";
import LearningPath from "./pages/learning-path";
import Lesson from "./pages/lesson";
import LiveClasses from "./pages/live-classes";
import AiPractice from "./pages/ai-practice";
import Achievements from "./pages/achievements";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard}/>
      <Route path="/path" component={LearningPath}/>
      <Route path="/lesson/:id" component={Lesson}/>
      <Route path="/classes" component={LiveClasses}/>
      <Route path="/ai-practice" component={AiPractice}/>
      <Route path="/achievements" component={Achievements}/>
      
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
