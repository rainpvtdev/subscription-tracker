import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect, useState } from "react";

export function ProtectedRoute({
  path,
  component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading, fetchUser } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      if (!user) {
        try {
          await fetchUser();
        } catch (error) {
          console.error('Authentication check failed:', error);
        }
      }
      
      if (mounted) {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [user, fetchUser]);

  // Show loading state only when we're checking auth and not in a loading state from the auth provider
  if (isCheckingAuth || (isLoading && !user)) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // If there's no user after loading, redirect to auth
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If we have a user, render the protected component
  return <Route path={path} component={component} />;
}
