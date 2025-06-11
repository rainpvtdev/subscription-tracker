import React, { useEffect, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "./components/theme-provider";
import { CurrencyProvider } from "@/context/currency-context";

// Lazy load components for code splitting
const NotFound = lazy(() => import("@/pages/not-found"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const Reports = lazy(() => import("@/pages/reports"));
const Settings = lazy(() => import("@/pages/settings"));
const SubscriptionsPage = lazy(() => import("@/pages/subscriptions"));
const ResetPassword = lazy(() => import("@/components/reset-password"));
const AccountSettings = lazy(() => import("@/pages/account-settings"));
const Landing = lazy(() => import("@/pages/landing"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Ensure proper theme initialization with smooth transitions
const setInitialTheme = () => {
  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const savedTheme = localStorage.getItem("subscription-tracker-theme");
  const initialTheme = savedTheme || (isDarkMode ? "dark" : "light");
  
  // Apply theme classes and transitions
  if (initialTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  
  // Add transition class after a short delay to prevent initial transition flash
  setTimeout(() => {
    document.documentElement.classList.add("theme-transition");
  }, 100);
};

// Execute immediately 
setInitialTheme();

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/auth/reset-password/:token" component={ResetPassword} />
        {/* Wrap protected routes in AuthProvider and CurrencyProvider */}
        <AuthProvider>
          <CurrencyProvider>
            <ProtectedRoute path="/dashboard" component={Dashboard} />
            <ProtectedRoute path="/subscriptions" component={SubscriptionsPage} />
            <ProtectedRoute path="/reports" component={Reports} />
            <ProtectedRoute path="/settings" component={Settings} />
            <ProtectedRoute path="/account-settings" component={AccountSettings} />
          </CurrencyProvider>
        </AuthProvider>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  // Set up accessibility attributes and theme detection
  useEffect(() => {
    // Set accessibility attributes
    document.documentElement.lang = 'en';
    document.documentElement.setAttribute('data-color-scheme', 'normal');
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (!localStorage.getItem('subscription-tracker-theme')) {
        if (mediaQuery.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey="subscription-tracker-theme" attribute="class" enableSystem>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <Router />
          <Toaster />
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;