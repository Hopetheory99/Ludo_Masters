import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'

// Web3 Providers
import { WagmiConfig } from 'wagmi'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { wagmiConfig, chains } from './config/web3'

// App Components
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { GameProvider } from './contexts/GameContext'
import { Web3Provider } from './contexts/Web3Context'
import { SocketProvider } from './contexts/SocketContext'

// Styles
import './styles/index.css'
import '@rainbow-me/rainbowkit/styles.css'

// Error Boundary
import ErrorBoundary from './components/ErrorBoundary'

// Analytics
import { initAnalytics } from './utils/analytics'

// Initialize analytics
if (import.meta.env.VITE_GOOGLE_ANALYTICS_ID) {
  initAnalytics()
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Toast configuration
const toastOptions = {
  duration: 4000,
  position: 'top-right' as const,
  style: {
    background: '#1f2937',
    color: '#f9fafb',
    borderRadius: '0.75rem',
    padding: '1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  success: {
    iconTheme: {
      primary: '#22c55e',
      secondary: '#f9fafb',
    },
  },
  error: {
    iconTheme: {
      primary: '#ef4444',
      secondary: '#f9fafb',
    },
  },
}

// App Wrapper Component
const AppWrapper: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider
              chains={chains}
              theme={{
                lightMode: lightTheme({
                  accentColor: '#3b82f6',
                  accentColorForeground: 'white',
                  borderRadius: 'medium',
                  fontStack: 'system',
                }),
                darkMode: darkTheme({
                  accentColor: '#3b82f6',
                  accentColorForeground: 'white',
                  borderRadius: 'medium',
                  fontStack: 'system',
                }),
              }}
              modalSize="compact"
              initialChain={chains[0]}
            >
              <ThemeProvider>
                <AuthProvider>
                  <Web3Provider>
                    <SocketProvider>
                      <GameProvider>
                        <App />
                        <Toaster toastOptions={toastOptions} />
                      </GameProvider>
                    </SocketProvider>
                  </Web3Provider>
                </AuthProvider>
              </ThemeProvider>
            </RainbowKitProvider>
          </WagmiConfig>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
)

// Service Worker Registration
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// Hot Module Replacement
if (import.meta.hot) {
  import.meta.hot.accept()
}

// Performance monitoring
if (import.meta.env.PROD) {
  // Report web vitals
  import('./utils/reportWebVitals').then(({ reportWebVitals }) => {
    reportWebVitals()
  })
}

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  // Send to error reporting service
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  // Send to error reporting service
})

// Prevent zoom on double tap (mobile)
let lastTouchEnd = 0
document.addEventListener('touchend', (event) => {
  const now = new Date().getTime()
  if (now - lastTouchEnd <= 300) {
    event.preventDefault()
  }
  lastTouchEnd = now
}, false)

// Disable context menu on production
if (import.meta.env.PROD) {
  document.addEventListener('contextmenu', (e) => e.preventDefault())
}