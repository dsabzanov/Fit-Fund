import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Redirect, Route } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (!user.isAdmin) {
    return (
      <Route path={path}>
        <div className="container max-w-2xl mx-auto py-16 px-4">
          <Alert variant="destructive" className="mb-6">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to access this page. This area is restricted to administrators only.
            </AlertDescription>
          </Alert>
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Unauthorized Access</h1>
            <p className="text-muted-foreground">
              Sorry, but you need administrator privileges to view this page. If you believe this is an error, please contact support or the site administrator.
            </p>
            <a
              href="/"
              className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Return to Home
            </a>
          </div>
        </div>
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}