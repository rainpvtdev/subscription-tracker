'use client'

import React, { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Only show the toggle after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return (
      <Button variant="ghost" size="icon" disabled className={cn("w-10 h-10 rounded-full", className)}>
        <div className="h-5 w-5"></div>
      </Button>
    )
  }

  const currentTheme = theme === 'system' ? resolvedTheme : theme
  const isDark = currentTheme === 'dark'
  
  // Simple toggle function for light/dark mode
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }
  
  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={toggleTheme}
      className={cn(
        "transition-all duration-300 rounded-full w-10 h-10",
        "border-2 focus-visible:ring-offset-2",
        isDark 
          ? "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600" 
          : "bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300",
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {/* Sun Icon with Animation */}
        <Sun 
          className={cn(
            "absolute h-[1.2rem] w-[1.2rem] transition-all duration-300",
            !isDark
              ? "rotate-0 scale-100 text-amber-600"
              : "rotate-90 scale-0 text-amber-600"
          )} 
        />
        
        {/* Moon Icon with Animation */}
        <Moon 
          className={cn(
            "absolute h-[1.2rem] w-[1.2rem] transition-all duration-300",
            isDark
              ? "rotate-0 scale-100 text-blue-300"
              : "-rotate-90 scale-0 text-blue-300"
          )} 
        />
      </div>
    </Button>
  )
}
