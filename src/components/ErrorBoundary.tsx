// src/components/ErrorBoundary.tsx - Global Error Boundary
"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { errorHandler, AppError } from '@/utils/errors'
import config from '@/config'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorId: null }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error, 
      errorId: Math.random().toString(36).substring(2)
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    const appError = errorHandler.handleError(error, 'ErrorBoundary')
    errorHandler.reportError(appError)

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return <ErrorFallback error={this.state.error} errorId={this.state.errorId} />
    }

    return this.props.children
  }
}

// Default Error Fallback Component
const ErrorFallback: React.FC<{ error: Error | null; errorId: string | null }> = ({ 
  error, 
  errorId 
}) => {
  const handleReload = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleReportError = () => {
    const errorDetails = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    const subject = `Error Report - ${errorId}`
    const body = `Please describe what you were doing when this error occurred:\n\n---\n\nError Details:\n${JSON.stringify(errorDetails, null, 2)}`
    
    window.open(`mailto:support@yourapp.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Oops! Something went wrong
            </h3>
            
            <p className="mt-2 text-sm text-gray-600">
              We encountered an unexpected error. Our team has been notified.
            </p>

            {/* Error ID for support */}
            {errorId && (
              <p className="mt-1 text-xs text-gray-500">
                Error ID: {errorId}
              </p>
            )}

            {/* Development error details */}
            {config.logging.enableConsole && error && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md text-left">
                <p className="text-xs font-medium text-gray-900">Error Details:</p>
                <p className="text-xs text-red-600 font-mono mt-1 break-all">
                  {error.message}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleReload}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Homepage
            </button>

            <button
              onClick={handleReportError}
              className="w-full flex justify-center py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              Report this issue
            </button>
          </div>

          {/* Help text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              If this problem persists, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// INTEGRATION GUIDE - How to use the Enhanced Error Handling System
// ============================================================================

/*
1. UPDATE YOUR APP LAYOUT (app/layout.tsx or pages/_app.tsx):

```tsx
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

2. ADD TOAST ANIMATIONS TO YOUR GLOBAL CSS:

```css
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}
```

3. UPDATE YOUR EXISTING HOOKS:

Replace your current useFlats hook with the enhanced version above.
Apply the same pattern to other hooks:

```tsx
// Example for useAddresses hook:
import { errorHandler, withRetry, ValidationError } from '@/utils/errors'
import { useToast } from '@/components/ui/Toast'

export const useAddresses = (userId?: string) => {
  const { success, error: showError } = useToast()
  
  const handleOperation = async <T>(operation: () => Promise<T>, operationName: string) => {
    try {
      return await operation()
    } catch (error) {
      const appError = errorHandler.handleError(error, operationName)
      errorHandler.reportError(appError)
      showError('Error', appError.message)
      throw appError
    }
  }

  const createAddress = async (data: AddressFormData, userId: string) => {
    return handleOperation(async () => {
      // Your existing logic here
      const result = await supabase.from('addresses').insert(...)
      success('Success', 'Address created successfully!')
      return result
    }, 'createAddress')
  }
  
  // ... rest of your hook
}
```

4. UPDATE YOUR COMPONENTS:

```tsx
// Before:
const handleSubmit = async (data) => {
  try {
    const result = await createFlat(data)
    if (result.success) {
      alert('Success!')
    } else {
      alert(result.message)
    }
  } catch (error) {
    alert('Error: ' + error.message)
  }
}

// After:
const handleSubmit = async (data) => {
  // The hook now handles all error display via toasts
  const result = await createFlat(data)
  // Success toasts are also handled in the hook
}
```

5. FOR FORM VALIDATION, USE THE VALIDATION HELPERS:

```tsx
import { throwValidationError, ValidationError } from '@/utils/errors'
import { useErrorToast } from '@/components/ui/Toast'

const MyForm = () => {
  const { showValidationError } = useErrorToast()
  
  const validateForm = (data) => {
    if (!data.email) {
      showValidationError('Email', 'Email is required')
      return false
    }
    
    if (!data.email.includes('@')) {
      showValidationError('Email', 'Please enter a valid email')
      return false
    }
    
    return true
  }
}
```

6. FOR ASYNC OPERATIONS WITH BETTER UX:

```tsx
import { useErrorHandler } from '@/utils/errors'

const MyComponent = () => {
  const { handleAsyncError } = useErrorHandler()
  
  const handleSubmit = async (data) => {
    setLoading(true)
    
    const { data: result, error } = await handleAsyncError(
      () => createSomething(data),
      'createSomething'
    )
    
    if (result) {
      // Success - toasts are handled automatically
      onSuccess(result)
    } else if (error) {
      // Error is already displayed via toast
      console.log('Operation failed:', error)
    }
    
    setLoading(false)
  }
}
```

7. ENVIRONMENT CONFIGURATION:

Add to your .env files:

```env
# Development
NEXT_PUBLIC_LOG_LEVEL=debug
NEXT_PUBLIC_ENABLE_REMOTE_LOGGING=false

# Production  
NEXT_PUBLIC_LOG_LEVEL=error
NEXT_PUBLIC_ENABLE_REMOTE_LOGGING=true
```

8. OPTIONAL: EXTERNAL ERROR MONITORING

To integrate with Sentry or other monitoring tools:

```tsx
// In your layout or error boundary
useEffect(() => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Initialize Sentry or other monitoring
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      })
    })
  }
}, [])
```

BENEFITS OF THIS SYSTEM:
✅ Consistent error handling across all hooks and components
✅ Beautiful, user-friendly error messages via toasts
✅ Automatic retry logic for transient failures
✅ Comprehensive error logging for debugging
✅ Development vs production error detail levels
✅ External monitoring integration ready
✅ Type-safe error handling with proper categorization
✅ User-friendly fallback UI for critical errors
✅ Configurable error behavior via your config system
*/