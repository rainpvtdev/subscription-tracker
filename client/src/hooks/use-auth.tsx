import { createContext, ReactNode, useContext, useCallback, useState, useEffect } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { User as SelectUser } from "@shared/schema";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
    user: SelectUser | null;
    isLoading: boolean;
    error: Error | null;
    loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
    logoutMutation: UseMutationResult<void, Error, void>;
    registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
    forgotPasswordMutation: UseMutationResult<{ message: string }, Error, { email: string }>;
    fetchUser: () => Promise<SelectUser | null>;
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
    const [user, setUser] = useState<SelectUser | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchUser = useCallback(async (): Promise<SelectUser | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/user', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    return null;
                }
                throw new Error('Failed to fetch user');
            }

            const data = await response.json();
            setUser(data);
            return data;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to fetch user');
            setError(error);
            console.error('Failed to fetch user:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Update the user in the state when it changes
    const updateUser = useCallback((newUser: SelectUser | null) => {
        setUser(newUser);
    }, []);

    const loginMutation = useMutation({
        mutationFn: async (credentials: LoginData) => {
            const res = await apiRequest("POST", "/api/login", credentials);
            return await res.json();
        },
        onSuccess: (user: SelectUser) => {
            setUser(user);
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
            setUser(user);
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
            setUser(null);
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
                user,
                isLoading,
                error,
                loginMutation,
                logoutMutation,
                registerMutation,
                forgotPasswordMutation,
                fetchUser,
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
