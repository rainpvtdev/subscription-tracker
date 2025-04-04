import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import Sidebar from "@/components/layout/sidebar";
import { FloatingThemeToggle } from "@/components/floating-theme-toggle";

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
    // Handle settings update
    toast({
      title: "Settings updated",
      description: "Your preferences have been saved successfully."
    });
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar user={user} />
      
      {/* Floating Theme Toggle for quick access */}
      <FloatingThemeToggle />
      
      {/* Main content */}
      <div className="md:pl-72">
        <div className="mx-auto flex max-w-7xl flex-col md:px-8">
          {/* Top bar for mobile */}
          <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-border bg-background md:hidden">
            <button 
              type="button" 
              className="border-r border-border px-4 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex flex-1 items-center">
                <h1 className="text-xl font-bold text-primary">SubTrack</h1>
              </div>
            </div>
          </div>

          {/* Settings content */}
          <main className="flex-1">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <h1 className="text-2xl font-semibold text-foreground">Account Settings</h1>
              </div>
              
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <div className="mt-8 max-w-xl">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-lg font-medium text-foreground">Notifications</h2>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">
                          Email notifications
                        </label>
                        <Switch {...register("emailNotifications")} />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Reminder days before due date
                        </label>
                        <Input
                          type="number"
                          {...register("reminderDays")}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-lg font-medium text-foreground">Display</h2>
                      <div>
                        <label className="text-sm font-medium text-foreground">
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

                    <Button type="submit">Save Changes</Button>
                  </form>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
