import React, { createContext, useContext, useEffect, useState } from 'react'

// Types
type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
  toggleTheme: () => void
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Theme provider props
interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
}

// Get system theme preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Get stored theme or default
const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system'
  
  try {
    const stored = localStorage.getItem('ludo-theme')
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as Theme
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error)
  }
  
  return 'system'
}

// Theme Provider Component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'system' 
}) => {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() || defaultTheme)
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => getSystemTheme())

  // Calculate if dark mode is active
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark')

  // Set theme and persist to localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    
    try {
      localStorage.setItem('ludo-theme', newTheme)
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
    }
  }

  // Toggle between light and dark (ignores system)
  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(systemTheme === 'dark' ? 'light' : 'dark')
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }
  }

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    // Set initial system theme
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    // Add appropriate theme class
    if (theme === 'system') {
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        isDark ? '#1f2937' : '#ffffff'
      )
    }

    // Update status bar style for iOS
    const metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (metaStatusBar) {
      metaStatusBar.setAttribute(
        'content',
        isDark ? 'black-translucent' : 'default'
      )
    }
  }, [theme, systemTheme, isDark])

  // Provide context value
  const value: ThemeContextType = {
    theme,
    setTheme,
    isDark,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
}

// Theme utilities
export const themeUtils = {
  // Get CSS custom properties for current theme
  getCSSVariables: (isDark: boolean) => ({
    '--color-primary': isDark ? '#3b82f6' : '#2563eb',
    '--color-secondary': isDark ? '#6b7280' : '#4b5563',
    '--color-background': isDark ? '#111827' : '#ffffff',
    '--color-foreground': isDark ? '#f9fafb' : '#111827',
    '--color-muted': isDark ? '#374151' : '#f3f4f6',
    '--color-border': isDark ? '#374151' : '#e5e7eb',
  }),

  // Get theme-aware color
  getColor: (isDark: boolean, lightColor: string, darkColor: string) => 
    isDark ? darkColor : lightColor,

  // Check if system prefers dark mode
  prefersDark: () => 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-color-scheme: dark)').matches,

  // Check if system prefers reduced motion
  prefersReducedMotion: () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,

  // Check if system prefers high contrast
  prefersHighContrast: () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-contrast: high)').matches,
}

export default ThemeProvider