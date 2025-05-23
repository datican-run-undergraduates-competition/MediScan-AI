import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import * as Sentry from '@sentry/react'
import { registerSW } from 'virtual:pwa-register'
import './index.css'

// Lazy-loaded App for better performance
const App = React.lazy(() => import('./App'))

// Error Boundary component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-2xl font-bold text-red-600">Something went wrong</h2>
      <p className="mb-4 text-gray-700">{error.message || 'An unexpected error occurred'}</p>
      <pre className="p-3 mb-4 overflow-auto text-sm bg-gray-100 rounded-md">
        {error.stack?.slice(0, 200) + '...'}
      </pre>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  </div>
)

// Setup React Query for efficient data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 300000, // 5 minutes
      cacheTime: 900000, // 15 minutes
      suspense: false,
    },
  },
})

// Initialize Sentry for production error tracking
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [new Sentry.BrowserTracing()],
    tracesSampleRate: 0.1,
    environment: import.meta.env.MODE,
  })
}

// Register service worker for PWA functionality
const updateSW = registerSW({
  onNeedRefresh() {
    const updateApp = confirm('New version available. Update now?')
    if (updateApp) updateSW(true)
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

// Render app with all providers
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
            </div>
          }>
            <App />
          </Suspense>
        </BrowserRouter>
        {import.meta.env.DEV && <ReactQueryDevtools />}
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
) 
