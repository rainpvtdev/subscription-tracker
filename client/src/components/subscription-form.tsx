import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Subscription, categoryOptions, billing_cycleOptions, reminderOptions } from "@shared/schema";
import { useCurrency } from "@/context/currency-context";
import { useState } from "react";

interface SubscriptionFormProps {
    subscription: Subscription | null;
    onClose: () => void;
}

const subscriptionFormSchema = z.object({
    name: z.string().min(1, "Service name is required"),
    category: z.string().min(1, "Category is required"),
    plan: z.string().min(1, "Plan is required"),
    amount: z.coerce.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be positive").min(0.01, "Amount must be at least 0.01"),
    billing_cycle: z.string().min(1, "Billing cycle is required"),
    next_payment_date: z
        .string()
        .min(1, "Next payment date is required")
        .refine(
            (date) => {
                try {
                    const parsedDate = new Date(date);
                    return !isNaN(parsedDate.getTime());
                } catch (e) {
                    return false;
                }
            },
            { message: "Invalid date format" }
        ),
    reminder: z.string().default("None"),
    notes: z.string().optional().nullable(),
    status: z.string().optional().default("active"),
});

type FormValues = z.infer<typeof subscriptionFormSchema>;

export default function SubscriptionForm({ subscription, onClose }: SubscriptionFormProps) {
    const { toast } = useToast();
    const { currency: userCurrency } = useCurrency();

    // Format the date for the form
    const formatDateForInput = (date: Date | string | null | undefined): string => {
        if (!date) return "";
        const d = new Date(date);
        return d.toISOString().split("T")[0];
    };

    // Function to get currency symbol based on currency code
    const getCurrencySymbol = (currencyCode: string): string => {
        const currencySymbols: Record<string, string> = {
            "USD": "$",
            "EUR": "€",
            "GBP": "£",
            "JPY": "¥",
            "CAD": "CAD $",
            "AUD": "AUD $",
            "INR": "₹",
            "CNY": "¥"
        };
        return currencySymbols[currencyCode] || currencyCode;
    };

    // Initialize form with default values or existing subscription data
    const form = useForm<FormValues>({
        resolver: zodResolver(subscriptionFormSchema),
        defaultValues: {
            name: subscription?.name || "",
            category: subscription?.category || "",
            plan: subscription?.plan || "",
            amount: subscription ? Number(subscription.amount) : undefined,
            billing_cycle: subscription?.billing_cycle || "",
            next_payment_date: formatDateForInput(subscription?.next_payment_date) || "",
            reminder: subscription?.reminder || "None",
            notes: subscription?.notes || "",
            status: subscription?.status || "active",
        },
    });

    // Create subscription mutation
    const createMutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const subscriptionData = {
                ...data,
                amount: Number(data.amount),
                next_payment_date: new Date(data.next_payment_date).toISOString(),
                status: "active",
                reminder: data.reminder === "None" ? undefined : data.reminder,
                notes: data.notes || undefined,
            };
            const res = await apiRequest("POST", "/api/subscriptions", subscriptionData);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            queryClient.invalidateQueries({ queryKey: ["stats"] });
            toast({
                title: "Success",
                description: "Subscription added successfully",
                variant: "default",
            });
            onClose();
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Update subscription mutation
    const updateMutation = useMutation({
        mutationFn: async (data: FormValues) => {
            if (!subscription) throw new Error("No subscription to update");
            
            const subscriptionData = {
                ...data,
                amount: Number(data.amount),
                next_payment_date: new Date(data.next_payment_date).toISOString(),
                status: subscription.status || "active",
                reminder: data.reminder === "None" ? undefined : data.reminder,
                notes: data.notes || undefined,
            };
            
            const res = await apiRequest("PUT", `/api/subscriptions/${subscription.id}`, subscriptionData);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            queryClient.invalidateQueries({ queryKey: ["stats"] });
            toast({
                title: "Success",
                description: "Subscription updated successfully",
                variant: "default",
            });
            onClose();
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Handle form submission
    const onSubmit = async (formData: FormValues) => {
        if (subscription) {
            // Update existing subscription
            await updateMutation.mutateAsync(formData);
        } else {
            // Create new subscription
            await createMutation.mutateAsync(formData);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 mb-8 transition-all">
            {/* <h2 className="text-xl font-bold text-purple-700 dark:text-purple-400 mb-6">{subscription ? "Edit Subscription" : "Add New Subscription"}</h2> */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Service Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Netflix, Spotify" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categoryOptions.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="plan"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Plan</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Basic, Premium, Pro" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">{getCurrencySymbol(userCurrency)}</span>
                                        </div>
                                        <Input type="number" step="0.01" {...field} className="pl-7" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="billing_cycle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Billing Cycle</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select billing cycle" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {billing_cycleOptions.map((cycle) => (
                                            <SelectItem key={cycle} value={cycle}>
                                                {cycle}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="next_payment_date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Next Payment Date</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="reminder"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reminder</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select reminder" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {reminderOptions.map((reminder) => (
                                        <SelectItem key={reminder} value={reminder}>
                                            {reminder}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Additional notes" {...field} value={field.value || ""} rows={3} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                </div>
            </form>
            </Form>
        </div>
    );
}
