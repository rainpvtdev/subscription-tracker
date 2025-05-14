import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle";
import {
  HomeIcon,
  CreditCardIcon,
  BarChartIcon,
  SettingsIcon,
  LogOutIcon,
  XIcon,
  MenuIcon,
  ChevronRightIcon,
} from "lucide-react";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  user: User | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation items with improved icons
  const navItems = [
    {
      name: "Dashboard",
      icon: <HomeIcon className="mr-3 h-5 w-5" />,
      href: "/dashboard",
    },
    {
      name: "Subscriptions",
      icon: <CreditCardIcon className="mr-3 h-5 w-5" />,
      href: "/subscriptions",
    },
    {
      name: "Reports",
      icon: <BarChartIcon className="mr-3 h-5 w-5" />,
      href: "/reports",
    },
    {
      name: "Settings",
      icon: <SettingsIcon className="mr-3 h-5 w-5" />,
      href: "/settings",
    },
  ];

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || "U";
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar for mobile */}
      <div className={cn(
        "fixed inset-0 z-30 flex h-full w-full max-w-[280px] flex-col bg-card dark:bg-card shadow-xl transition-transform duration-300 ease-in-out md:hidden",
        isMobileMenuOpen ? "transform-none" : "-translate-x-full"
      )}>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-16 flex-shrink-0 items-center justify-between px-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              SubTrack
            </h1>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <XIcon className="h-5 w-5" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>

          <Separator />

          <div className="flex flex-1 flex-col overflow-y-auto py-2 px-4">
            <nav className="space-y-1 py-2">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <a
                      className={cn(
                        "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-purple-600 text-white"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span className={cn(
                        "flex-shrink-0 transition-colors",
                        isActive
                          ? "text-white"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {item.icon}
                      </span>
                      {item.name}

                      {isActive && (
                        <ChevronRightIcon className="ml-auto h-4 w-4 text-white" />
                      )}
                    </a>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-4">
              <div className="flex items-center justify-between px-3 pb-2">
                <span className="text-xs font-medium text-muted-foreground">THEME</span>
                <ThemeToggle />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-shrink-0 p-4">
            <div className="w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-9 w-9 bg-purple-600  text-white">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
                      {user?.name || user?.username || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email ? user.email.split('@')[0] + '@...' : 'No email'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="ml-1 px-2 h-8 text-xs font-medium text-destructive border-destructive/20 hover:bg-destructive/10"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOutIcon className="mr-1 h-3.5 w-3.5" />
                  {logoutMutation.isPending ? "..." : "Logout"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-72 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-card dark:bg-card border-r border-border">
          <div className="flex h-16 flex-shrink-0 items-center px-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              SubTrack
            </h1>
          </div>

          <Separator />

          <div className="flex flex-1 flex-col overflow-y-auto pt-3 pb-4">
            <nav className="flex-1 space-y-1 px-4 py-3">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <a
                      className={cn(
                        "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-purple-600  text-white"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span className={cn(
                        "flex-shrink-0 transition-colors",
                        isActive
                          ? "text-white"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {item.icon}
                      </span>
                      {item.name}

                      {isActive && (
                        <ChevronRightIcon className="ml-auto h-4 w-4 text-white" />
                      )}
                    </a>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto px-4">
              <div className="flex items-center justify-between px-3 pb-2">
                <span className="text-xs font-medium text-muted-foreground">THEME</span>
                <ThemeToggle />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-shrink-0 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start p-2 h-auto hover:bg-muted rounded-lg"
                >
                  <div className="flex items-center w-full">
                    <Avatar className="h-9 w-9 bg-purple-600 text-white">
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="ml-3 text-left">
                      <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
                        {user?.name || user?.username || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {user?.email || 'No email'}
                      </p>
                    </div>
                    <ChevronRightIcon className="ml-auto h-4 w-4 text-muted-foreground" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">

                <DropdownMenuItem asChild>
                  <Link href="/account-settings">
                    <span className="font-medium">Account settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  {logoutMutation.isPending ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile header with menu button */}
      <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center bg-card border-b border-border shadow-sm md:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="mx-2"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Open sidebar</span>
        </Button>

        <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent px-2">
          SubTrack
        </h1>
      </div>
    </>
  );
}