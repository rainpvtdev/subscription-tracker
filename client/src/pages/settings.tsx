import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import Sidebar from "@/components/layout/sidebar";
import { FloatingThemeToggle } from "@/components/floating-theme-toggle";
import { Bell, Monitor, Settings as SettingsIcon, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { useCurrency } from "@/context/currency-context";
import { currencyOptions, type Currency } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { updateUserSettings } from "@/api";
import { useUser } from "@/hooks/useUser";
import { getCurrencySymbol } from "@/lib/utils";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currency, setCurrency } = useCurrency();
  const { user: currentUser, refetch: refetchUser } = useUser(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Form with default values
  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      email_notifications: true,
      reminder_days: 3,
      currency: currency || "USD"
    }
  });
  
  // Update form when user data loads
  useEffect(() => {
    const initializeForm = async () => {
      if (currentUser) {
        reset({
          email_notifications: currentUser.email_notifications ?? true,
          reminder_days: currentUser.reminder_days ?? 3,
          currency: currentUser.currency || currency || "USD"
        });
      } else if (user?.id && !isInitialized) {
        // Only fetch user data if we have a user ID and haven't initialized yet
        try {
          await refetchUser();
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to fetch user settings:', error);
        }
      }
    };
    
    initializeForm();
  }, [currentUser, user?.id, currency, reset, isInitialized, refetchUser]);
  
  // Watch the values to provide immediate feedback
  const selectedCurrency = watch("currency") as Currency;
  const emailNotifications = watch("email_notifications");
  const reminderDays = watch("reminder_days");
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: updateUserSettings,
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved successfully."
      });
      refetchUser();
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to update settings",
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (data: any) => {
    // Update currency in context and backend
    if (data.currency !== currency) {
      try {
        await setCurrency(data.currency);
      } catch (error) {
        console.error("Failed to update currency context:", error);
      }
    }
    
    // Send all settings to the backend
    updateSettingsMutation.mutate({
      currency: data.currency,
      email_notifications: data.email_notifications,
      reminder_days: parseInt(data.reminder_days, 10)
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-slate-900 transition-colors duration-300">
      <Sidebar user={user} />
      <FloatingThemeToggle />

      <div className="md:pl-72">
        <div className="mx-auto max-w-2xl py-12 px-4">
          <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-8 flex items-center gap-2">
            <SettingsIcon className="w-8 h-8" /> Settings
          </h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Notifications Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-700/10 p-6 transition-colors">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <Bell className="w-5 h-5" /> Notifications
              </h2>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email notifications
                </label>
                <Switch 
                  checked={emailNotifications}
                  onCheckedChange={(checked) => setValue("email_notifications", checked)}
                  className="data-[state=checked]:bg-purple-600 dark:data-[state=checked]:bg-purple-500"
                />
              </div>
              <div className={emailNotifications ? "opacity-100" : "opacity-50"}>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reminder days before due date
                </label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  {...register("reminder_days")}
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  disabled={!emailNotifications}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You'll receive email reminders this many days before your subscriptions are due.
                </p>
              </div>
            </div>
            {/* Display Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-700/10 p-6 transition-colors">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <Monitor className="w-5 h-5" /> Display
              </h2>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <DollarSign className="h-4 w-4" /> Currency
                </label>
                <select
                  {...register("currency")}
                  className="mt-1 block w-full rounded-md border-input bg-background dark:bg-gray-700 dark:border-gray-600 text-foreground dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  {currencyOptions.map(curr => (
                    <option key={curr} value={curr}>
                      {curr} ({getCurrencySymbol(curr as Currency)})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This will be used for all monetary values across the application.
                </p>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full mt-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white transition-colors"
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}