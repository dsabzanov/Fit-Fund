import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { AccessibilityProvider } from "@/components/accessibility-provider";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import ChallengePage from "@/pages/challenge-page";
import WeeklyGamePage from "@/pages/weekly-game-page";
import KickstarterGamePage from "@/pages/kickstarter-game-page";
import CreateGamePage from "@/pages/create-game-form";
import MeetYourCoachPage from "@/pages/meet-your-coach";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminSetup from "@/pages/admin-setup";
import ProfilePage from "@/pages/profile-page";
import EditProfilePage from "@/pages/edit-profile-page";
import TermsOfServicePage from "@/pages/terms-of-service";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminRoute } from "./lib/admin-route";
import WeightTrackingPage from "@/pages/weight-tracking-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/challenge/:id" component={ChallengePage} />
      <ProtectedRoute path="/weekly-game" component={WeeklyGamePage} />
      <ProtectedRoute path="/kickstarter-game" component={KickstarterGamePage} />
      <ProtectedRoute path="/create-game" component={CreateGamePage} />
      <ProtectedRoute path="/weight-tracking" component={WeightTrackingPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/edit-profile" component={EditProfilePage} />
      <AdminRoute path="/admin" component={AdminDashboard} />
      {/* Special direct access route for admin dashboard */}
      <Route path="/user-admin" component={AdminDashboard} />
      <Route path="/admin-setup" component={AdminSetup} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/meet-your-coach" component={MeetYourCoachPage} />
      <Route path="/terms-of-service" component={TermsOfServicePage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AccessibilityProvider>
          <Router />
          <Toaster />
        </AccessibilityProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;