import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Lock, Trash2 } from "lucide-react";
import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import { FloatingThemeToggle } from "@/components/floating-theme-toggle";


export default function AccountSettings() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      newPassword: "",
      confirmNewPassword: ""
    }
  });

  // Update profile info
  const onProfileSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed to update profile");
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated."
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const onPasswordSubmit = async (data: any) => {
    if (data.newPassword !== data.confirmNewPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: data.password, newPassword: data.newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed to change password");
      toast({
        title: "Password changed",
        description: "Your password has been updated. You will be logged out for security reasons."
      });
      reset({ password: "", newPassword: "", confirmNewPassword: "" });
      
      // Log the user out after password change
      setTimeout(() => {
        logoutMutation.mutate();
      }, 1500); // Short delay to allow the user to see the success message
      
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const onDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user/deactivate", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).message || "Failed to delete account");
      toast({
        title: "Account deleted",
        description: "Your account has been deleted."
      });
      // Optionally redirect to homepage or logout
      window.location.href = "/";
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-slate-900 transition-colors duration-300">
        <Sidebar user={user} />
        <FloatingThemeToggle />
      
        <main className="flex-1 flex justify-center items-start py-12 px-4 md:pl-72">
      <div className="w-full max-w-2xl space-y-8">
        <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-6 flex items-center gap-2">
          <User className="w-8 h-8" /> Account Settings
        </h1>

        {/* Profile Info Card */}
        <Card className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-8 space-y-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <Mail className="w-5 h-5" /> Profile Information
            </h2>
            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <Input
                  {...register("name")}
                  defaultValue={user?.name}
                  placeholder="Your Name"
                  disabled={loading}
                  className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <Input
                  {...register("email")}
                  defaultValue={user?.email}
                  placeholder="you@example.com"
                  type="email"
                  disabled={loading}
                  className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full mt-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white transition-colors" 
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-8 space-y-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <Lock className="w-5 h-5" /> Change Password
            </h2>
            <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="Current password"
                  disabled={loading}
                  className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                <Input
                  {...register("newPassword")}
                  type="password"
                  placeholder="New password"
                  disabled={loading}
                  className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                <Input
                  {...register("confirmNewPassword")}
                  type="password"
                  placeholder="Confirm new password"
                  disabled={loading}
                  className="bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full mt-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white transition-colors" 
                disabled={loading}
              >
                {loading ? "Saving..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        {/* <Card className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-red-600 dark:text-red-400">
              <Trash2 className="w-5 h-5" /> Danger Zone
            </h2>
            <Button
              variant="destructive"
              className="w-full"
              onClick={onDeleteAccount}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Account"}
            </Button>
          </CardContent>
        </Card> */}
      </div>
    </main>
    </div>

  );
}