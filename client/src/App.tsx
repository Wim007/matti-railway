import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Onboarding screens
import Welcome from "./pages/onboarding/Welcome";
import Account from "./pages/onboarding/Account";

// Main app screens
import Chat from "./pages/Chat";
import History from "./pages/History";

import Profile from "./pages/Profile";
import ParentInfo from "./pages/ParentInfo";
import Actions from "./pages/Actions";
import Themes from "./pages/Themes";
import FeedbackDashboard from "./pages/FeedbackDashboard";

function Router() {
  return (
    <Switch>
      {/* Onboarding flow */}
      <Route path="/onboarding/welcome" component={Welcome} />
      <Route path="/onboarding/account" component={Account} />
      
      {/* Main app tabs - protected */}
      <Route path="/chat">
        <ProtectedRoute><Chat /></ProtectedRoute>
      </Route>
      <Route path="/chat/:conversationId">
        <ProtectedRoute><Chat /></ProtectedRoute>
      </Route>
      <Route path="/history">
        <ProtectedRoute><History /></ProtectedRoute>
      </Route>
      <Route path="/actions">
        <ProtectedRoute><Actions /></ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute><Profile /></ProtectedRoute>
      </Route>
      <Route path="/themes">
        <ProtectedRoute><Themes /></ProtectedRoute>
      </Route>
      <Route path="/parent-info">
        <ProtectedRoute><ParentInfo /></ProtectedRoute>
      </Route>
      <Route path="/feedback-dashboard">
        <ProtectedRoute><FeedbackDashboard /></ProtectedRoute>
      </Route>

      {/* Root welcome route intentionally after specific routes to avoid catch-all behavior */}
      <Route path="/" component={Welcome} />
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
