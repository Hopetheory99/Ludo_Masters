import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import toast from 'react-hot-toast'

// Types
import type { User, ApiResponse } from '../types'

// API utilities
import { authAPI } from '../utils/api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  loginWithWallet: (address: string, signature: string) => Promise<boolean>
  register: (userData: RegisterData) => Promise<boolean>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<boolean>
  refreshUser: () => Promise<void>
  deleteAccount: () => Promise<boolean>
}

interface RegisterData {
  username: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider props
interface AuthProviderProps {
  children: React.ReactNode
}

// Get stored auth token
const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null
  
  try {
    return localStorage.getItem('ludo-auth-token')
  } catch (error) {
    console.warn('Failed to read auth token from localStorage:', error)
    return null
  }
}

// Store auth token
const storeToken = (token: string): void => {
  try {
    localStorage.setItem('ludo-auth-token', token)
  } catch (error) {
    console.warn('Failed to save auth token to localStorage:', error)
  }
}

// Remove auth token
const removeToken = (): void => {
  try {
    localStorage.removeItem('ludo-auth-token')
  } catch (error) {
    console.warn('Failed to remove auth token from localStorage:', error)
  }
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const isAuthenticated = !!user

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken()
      
      if (token) {
        try {
          const response = await authAPI.getProfile()
          if (response.success && response.data) {
            setUser(response.data)
          } else {
            removeToken()
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error)
          removeToken()
        }
      }
      
      setIsLoading(false)
    }

    initAuth()
  }, [])

  // Handle wallet connection changes
  useEffect(() => {
    if (isConnected && address && user && !user.walletAddress) {
      // Auto-link wallet if user is logged in but doesn't have wallet linked
      linkWallet(address)
    }
  }, [isConnected, address, user])

  // Login with email/password
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const response = await authAPI.login({ email, password })
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data
        setUser(userData)
        storeToken(token)
        toast.success('Welcome back!')
        return true
      } else {
        toast.error(response.message || 'Login failed')
        return false
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Login failed')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Login with wallet signature
  const loginWithWallet = useCallback(async (address: string, signature: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const response = await authAPI.loginWithWallet({ address, signature })
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data
        setUser(userData)
        storeToken(token)
        toast.success('Connected with wallet!')
        return true
      } else {
        toast.error(response.message || 'Wallet login failed')
        return false
      }
    } catch (error: any) {
      console.error('Wallet login error:', error)
      toast.error(error.message || 'Wallet login failed')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Register new account
  const register = useCallback(async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      // Validate passwords match
      if (userData.password !== userData.confirmPassword) {
        toast.error('Passwords do not match')
        return false
      }

      // Validate terms acceptance
      if (!userData.acceptTerms) {
        toast.error('Please accept the terms and conditions')
        return false
      }

      const response = await authAPI.register({
        username: userData.username,
        email: userData.email,
        password: userData.password,
      })
      
      if (response.success && response.data) {
        const { user: newUser, token } = response.data
        setUser(newUser)
        storeToken(token)
        toast.success('Account created successfully!')
        return true
      } else {
        toast.error(response.message || 'Registration failed')
        return false
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Registration failed')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      removeToken()
      
      // Disconnect wallet if connected
      if (isConnected) {
        disconnect()
      }
      
      toast.success('Logged out successfully')
    }
  }, [isConnected, disconnect])

  // Update user profile
  const updateProfile = useCallback(async (data: Partial<User>): Promise<boolean> => {
    try {
      const response = await authAPI.updateProfile(data)
      
      if (response.success && response.data) {
        setUser(response.data)
        toast.success('Profile updated successfully')
        return true
      } else {
        toast.error(response.message || 'Failed to update profile')
        return false
      }
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.message || 'Failed to update profile')
      return false
    }
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const response = await authAPI.getProfile()
      if (response.success && response.data) {
        setUser(response.data)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }, [])

  // Delete account
  const deleteAccount = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authAPI.deleteAccount()
      
      if (response.success) {
        setUser(null)
        removeToken()
        
        if (isConnected) {
          disconnect()
        }
        
        toast.success('Account deleted successfully')
        return true
      } else {
        toast.error(response.message || 'Failed to delete account')
        return false
      }
    } catch (error: any) {
      console.error('Account deletion error:', error)
      toast.error(error.message || 'Failed to delete account')
      return false
    }
  }, [isConnected, disconnect])

  // Link wallet to existing account
  const linkWallet = useCallback(async (walletAddress: string): Promise<boolean> => {
    try {
      const response = await authAPI.linkWallet({ address: walletAddress })
      
      if (response.success && response.data) {
        setUser(response.data)
        toast.success('Wallet linked successfully')
        return true
      } else {
        toast.error(response.message || 'Failed to link wallet')
        return false
      }
    } catch (error: any) {
      console.error('Wallet linking error:', error)
      toast.error(error.message || 'Failed to link wallet')
      return false
    }
  }, [])

  // Provide context value
  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    loginWithWallet,
    register,
    logout,
    updateProfile,
    refreshUser,
    deleteAccount,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Auth utilities
export const authUtils = {
  // Check if user has specific permission
  hasPermission: (user: User | null, permission: string): boolean => {
    if (!user) return false
    // Implement permission checking logic based on user role/subscription
    return true
  },

  // Check if user has subscription tier
  hasSubscription: (user: User | null, tier: string): boolean => {
    if (!user) return false
    const tierLevels = { free: 0, silver: 1, gold: 2, platinum: 3 }
    const userLevel = tierLevels[user.subscription as keyof typeof tierLevels] || 0
    const requiredLevel = tierLevels[tier as keyof typeof tierLevels] || 0
    return userLevel >= requiredLevel
  },

  // Get user display name
  getDisplayName: (user: User | null): string => {
    if (!user) return 'Guest'
    return user.profile?.displayName || user.username || 'User'
  },

  // Get user avatar URL
  getAvatarUrl: (user: User | null): string => {
    if (!user?.avatar) return '/images/default-avatar.png'
    return user.avatar.startsWith('http') ? user.avatar : `/images/avatars/${user.avatar}`
  },

  // Format user level
  formatLevel: (experience: number): number => {
    return Math.floor(experience / 1000) + 1
  },

  // Calculate experience for next level
  getNextLevelExp: (experience: number): number => {
    const currentLevel = Math.floor(experience / 1000)
    return (currentLevel + 1) * 1000
  },
}

export default AuthProvider