import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

// Layout Components
import Layout from './components/Layout/Layout'
import LoadingSpinner from './components/UI/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'

// Page Components (Lazy loaded for better performance)
const HomePage = React.lazy(() => import('./pages/HomePage'))
const GamePage = React.lazy(() => import('./pages/GamePage'))
const LobbyPage = React.lazy(() => import('./pages/LobbyPage'))
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'))
const LeaderboardPage = React.lazy(() => import('./pages/LeaderboardPage'))
const TournamentsPage = React.lazy(() => import('./pages/TournamentsPage'))
const ShopPage = React.lazy(() => import('./pages/ShopPage'))
const InventoryPage = React.lazy(() => import('./pages/InventoryPage'))
const StakingPage = React.lazy(() => import('./pages/StakingPage'))
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'))
const AuthPage = React.lazy(() => import('./pages/AuthPage'))
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'))

// Hooks
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import { useSocket } from './hooks/useSocket'

// Types
import type { User } from './types'

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireWeb3?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = false,
  requireWeb3 = false 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  if (requireWeb3 && (!user?.walletAddress)) {
    return <Navigate to="/profile?tab=wallet" replace />
  }

  return <>{children}</>
}

// Loading Fallback Component
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-primary-900">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-secondary-600 dark:text-secondary-400">
        Loading page...
      </p>
    </div>
  </div>
)

// Main App Component
const App: React.FC = () => {
  const { theme } = useTheme()
  const { isConnected } = useSocket()

  // Apply theme class to document
  React.useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  // Handle online/offline status
  React.useEffect(() => {
    const handleOnline = () => {
      console.log('App is online')
    }

    const handleOffline = () => {
      console.log('App is offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ErrorBoundary>
        <Layout>
          <AnimatePresence mode="wait">
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                
                {/* Game Routes */}
                <Route 
                  path="/lobby" 
                  element={
                    <ProtectedRoute requireAuth>
                      <LobbyPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/game/:gameId" 
                  element={
                    <ProtectedRoute requireAuth>
                      <GamePage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Profile & Social Routes */}
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute requireAuth>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile/:userId" 
                  element={<ProfilePage />} 
                />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                
                {/* Tournament Routes */}
                <Route path="/tournaments" element={<TournamentsPage />} />
                
                {/* Web3 & Economy Routes */}
                <Route 
                  path="/shop" 
                  element={<ShopPage />} 
                />
                <Route 
                  path="/inventory" 
                  element={
                    <ProtectedRoute requireAuth>
                      <InventoryPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/staking" 
                  element={
                    <ProtectedRoute requireAuth requireWeb3>
                      <StakingPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Settings Route */}
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute requireAuth>
                      <SettingsPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Catch-all Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </AnimatePresence>
        </Layout>
      </ErrorBoundary>
      
      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-warning-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Reconnecting...</span>
          </div>
        </div>
      )}
      
      {/* Offline Indicator */}
      {!navigator.onLine && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="bg-error-500 text-white px-4 py-2 text-center">
            <span className="text-sm font-medium">
              You are offline. Some features may not be available.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default App