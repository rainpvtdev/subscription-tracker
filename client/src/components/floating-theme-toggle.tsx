'use client'

import React, { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function FloatingThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Only show the toggle after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return (
      <div className="fixed bottom-6 right-6 z-50 w-14 h-7 rounded-full bg-transparent"></div>
    )
  }

  const currentTheme = theme === 'system' ? resolvedTheme : theme
  const isDark = currentTheme === 'dark'
  
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }
  
  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "fixed bottom-6 right-6 z-50 flex h-7 w-14 items-center rounded-full p-1 shadow-lg transition-all duration-300",
        isDark 
          ? "bg-slate-700 justify-end border-slate-600" 
          : "bg-amber-100 justify-start border-amber-200"
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full transition-all duration-300",
          isDark 
            ? "bg-slate-900 text-blue-300" 
            : "bg-amber-400 text-amber-700"
        )}
      >
        {isDark ? (
          <Moon className="h-3 w-3" />
        ) : (
          <Sun className="h-3 w-3" />
        )}
      </span>
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
