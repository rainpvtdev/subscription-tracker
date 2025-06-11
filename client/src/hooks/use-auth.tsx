import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
    user: SelectUser | null;
    isLoading: boolean;
    error: Error | null;
    loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
    logoutMutation: UseMutationResult<void, Error, void>;
    registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
    forgotPasswordMutation: UseMutationResult<{ message: string }, Error, { email: string }>;
};

type LoginData = {
    username: string;
    password: string;
};

type RegisterData = {
    username: string;
    password: string;
    email: string;
    name?: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const {
        data: user,
        error,
        isLoading,
    } = useQuery<SelectUser | null, Error>({
        queryKey: ["/api/user"],
        queryFn: getQueryFn({ on401: "returnNull" }),
    });

    const loginMutation = useMutation({
        mutationFn: async (credentials: LoginData) => {
            const res = await apiRequest("POST", "/api/login", credentials);
            return await res.json();
        },
        onSuccess: (user: SelectUser) => {
            queryClient.setQueryData(["/api/user"], user);
            toast({
                title: "Login successful",
                description: `Welcome back, ${user.name || user.username}!`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Login failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (userData: RegisterData) => {
            const res = await apiRequest("POST", "/api/register", userData);
            return await res.json();
        },
        onSuccess: (user: SelectUser) => {
            queryClient.setQueryData(["/api/user"], user);
            toast({
                title: "Registration successful",
                description: `Welcome to SubTrack, ${user.name || user.username}!`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Registration failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/logout");
        },
        onSuccess: () => {
            queryClient.setQueryData(["/api/user"], null);
            toast({
                title: "Logged out",
                description: "You have been successfully logged out.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Logout failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const forgotPasswordMutation = useMutation({
        mutationFn: async (data: { email: string }) => {
            const res = await apiRequest("POST", "/api/forgot-password", data);
            //console.log("res.....", res);
            return await res.json();
        },
        onSuccess: (data) => {
            console.log("data.....", data);
            toast({
                title: "Password reset email sent",
                description: data.message,
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to send reset email",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return (
        <AuthContext.Provider
            value={{
                user: user ?? null,
                isLoading,
                error,
                loginMutation,
                logoutMutation,
                registerMutation,
                forgotPasswordMutation,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
