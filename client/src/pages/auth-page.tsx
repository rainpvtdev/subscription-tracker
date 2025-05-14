import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";

type AuthView = "login" | "register" | "forgot-password" | "verification-sent";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

  /**
   * Handles authentication-related pages (login, register, forgot password, verification sent)
   * 
   * @returns The JSX element for the authentication page.
   */
export default function AuthPage() {
  const [view, setView] = useState<AuthView>("login");
  const { user, loginMutation, registerMutation, forgotPasswordMutation } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({
      username: values.username,
      password: values.password,
    });
  };

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData);
  };

  // Forgot password form
  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onForgotPasswordSubmit = (values: z.infer<typeof forgotPasswordSchema>) => {
    forgotPasswordMutation.mutate({ email: values.email }, {
      onSuccess: () => setView("verification-sent")
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8  bg-background relative">
        {/* Theme Toggle positioned at top left */}
        <div className="absolute top-4 left-4">
          <ThemeToggle />
        </div>
        <Card className="max-w-md w-full border-border">
          <CardContent className="p-8 space-y-6">
            {/* Login Form */}
            {view === "login" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="mt-6 text-3xl font-extrabold text-foreground">
                    Sign in to your account
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Or
                    <Button 
                      variant="link" 
                      className="font-medium text-purple-600"
                      onClick={() => setView("register")}
                    >
                      create a new account
                    </Button>
                  </p>
                </div>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your username" 
                              {...field} 
                              autoComplete="username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              {...field} 
                              autoComplete="current-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between">
                      <FormField
                        control={loginForm.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-medium cursor-pointer">
                              Remember me
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      <Button 
                        variant="link" 
                        className="font-medium p-0 h-auto text-purple-600 dark:text-purple-400"
                        onClick={() => setView("forgot-password")}
                        type="button"
                      >
                        Forgot your password?
                      </Button>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {/* Register Form */}
            {view === "register" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="mt-6 text-3xl font-extrabold text-foreground">
                    Create your account
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Or
                    <Button 
                      variant="link" 
                      className="font-medium text-purple-600"
                      onClick={() => setView("login")}
                    >
                      sign in to existing account
                    </Button>
                  </p>
                </div>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="John Doe" 
                              {...field} 
                              autoComplete="name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="your@email.com" 
                              {...field} 
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="johndoe" 
                              {...field} 
                              autoComplete="username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Create a password" 
                              {...field} 
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Confirm your password" 
                              {...field} 
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Register"}
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {/* Forgot Password Form */}
            {view === "forgot-password" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="mt-6 text-3xl font-extrabold text-foreground">
                    Reset your password
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Remember your password?
                    <Button 
                      variant="link" 
                      className="font-medium text-purple-600 dark:text-purple-400"
                      onClick={() => setView("login")}
                    >
                      Sign in
                    </Button>
                  </p>
                </div>
                <Form {...forgotPasswordForm}>
                  <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={forgotPasswordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="your@email.com" 
                              {...field} 
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={forgotPasswordMutation.isPending}
                    >
                      {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {/* Verification Sent */}
            {view === "verification-sent" && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                    <svg className="h-6 w-6 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="mt-6 text-3xl font-extrabold text-foreground">
                    Check your email
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We've sent a verification link to your email address.
                    Please click the link to verify your account.
                  </p>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => setView("login")}
                >
                  Return to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Right side - Hero section */}
      <div className="hidden md:flex md:flex-1 gradient-bg   from-primary/80 to-primary/40 text-background justify-center items-center p-8">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-6">Subscription Tracker</h1>
          <p className="text-xl mb-4">
            Manage all your subscriptions in one place. Never forget a renewal again.
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Track monthly and annual costs
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Get reminders before renewal dates
            </li>
            <li className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Visualize spending with detailed reports
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}