import React, { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "./components/theme-provider";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import SubscriptionsPage from "@/pages/subscriptions";
import { ResetPassword } from "@/components/reset-password";
import AccountSettings from "@/pages/account-settings";
import { CurrencyProvider } from "@/context/currency-context";

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

import Landing from "@/pages/landing";

function Router() {
  return (
    <Switch>
    <Route path="/" component={Landing} />
    <ProtectedRoute path="/dashboard" component={Dashboard} />
    <ProtectedRoute path="/subscriptions" component={SubscriptionsPage} />
    <ProtectedRoute path="/reports" component={Reports} />
    <ProtectedRoute path="/settings" component={Settings} />
    <ProtectedRoute path="/account-settings" component={AccountSettings} /> {/* <-- Add this line */}
    <Route path="/auth" component={AuthPage} />
    <Route path="/auth/reset-password/:token" component={ResetPassword} />
    <Route component={NotFound} />
  </Switch>
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
        <AuthProvider>
          <CurrencyProvider>
            <div className="min-h-screen flex flex-col bg-background text-foreground">
              <Router />
              <Toaster />
            </div>
          </CurrencyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;