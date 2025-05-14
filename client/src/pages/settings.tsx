import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import Sidebar from "@/components/layout/sidebar";
import { FloatingThemeToggle } from "@/components/floating-theme-toggle";
import { Bell, Monitor, Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      emailNotifications: true,
      reminderDays: 3,
      currency: "USD"
    }
  });

  const onSubmit = async (data: any) => {
    toast({
      title: "Settings updated",
      description: "Your preferences have been saved successfully."
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 transition-colors duration-300">
      <Sidebar user={user} />
      <FloatingThemeToggle />

      <div className="md:pl-72">
        <div className="mx-auto max-w-2xl py-12 px-4">
          <h1 className="text-3xl font-bold text-purple-700 mb-8 flex items-center gap-2">
            <SettingsIcon className="w-8 h-8" /> Settings
          </h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Notifications Card */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-700">
                <Bell className="w-5 h-5" /> Notifications
              </h2>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Email notifications
                </label>
                <Switch {...register("emailNotifications")} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Reminder days before due date
                </label>
                <Input
                  type="number"
                  {...register("reminderDays")}
                  className="mt-1"
                />
              </div>
            </div>
            {/* Display Card */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-700">
                <Monitor className="w-5 h-5" /> Display
              </h2>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Currency
                </label>
                <select
                  {...register("currency")}
                  className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full mt-2">
              Save Changes
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}