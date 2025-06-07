// src/components/ui/Toast.tsx - Beautiful Toast Notification System
"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import config from '@/config'

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  success: (title: string, message?: string, options?: Partial<Toast>) => string
  error: (title: string, message?: string, options?: Partial<Toast>) => string
  warning: (title: string, message?: string, options?: Partial<Toast>) => string
  info: (title: string, message?: string, options?: Partial<Toast>) => string
  clear: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Toast Provider Component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const newToast: Toast = {
      id,
      duration: config.ui.toastDurationMs,
      dismissible: true,
      ...toast
    }

    setToasts(prev => [...prev, newToast])

    // Auto-remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => removeToast(id), newToast.duration)
    }

    return id
  }, [removeToast])

  const success = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'success', title, message, ...options })
  }, [addToast])

  const error = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ 
      type: 'error', 
      title, 
      message, 
      duration: 0, // Errors don't auto-dismiss
      ...options 
    })
  }, [addToast])

  const warning = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'warning', title, message, ...options })
  }, [addToast])

  const info = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'info', title, message, ...options })
  }, [addToast])

  const clear = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      success,
      error,
      warning,
      info,
      clear
    }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Hook to use Toast context
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast Container Component
const ToastContainer: React.FC = () => {
  const { toasts } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

// Individual Toast Component
const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const { removeToast } = useToast()
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => removeToast(toast.id), 300) // Match animation duration
  }

  const handleAction = () => {
    if (toast.action?.onClick) {
      toast.action.onClick()
      handleDismiss()
    }
  }

  // Toast styling based on type
  const getToastStyles = () => {
    const baseStyles = "relative overflow-hidden rounded-lg shadow-lg border transition-all duration-300 transform"
    const visibilityStyles = isVisible && !isExiting 
      ? "translate-x-0 opacity-100" 
      : "translate-x-full opacity-0"
    
    const typeStyles = {
      success: "bg-white border-green-200 text-green-800",
      error: "bg-white border-red-200 text-red-800",
      warning: "bg-white border-yellow-200 text-yellow-800", 
      info: "bg-white border-blue-200 text-blue-800"
    }

    return `${baseStyles} ${visibilityStyles} ${typeStyles[toast.type]}`
  }

  const getIconForType = () => {
    const iconClass = "w-5 h-5 flex-shrink-0"
    
    switch (toast.type) {
      case 'success':
        return (
          <svg className={`${iconClass} text-green-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'error':
        return (
          <svg className={`${iconClass} text-red-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'warning':
        return (
          <svg className={`${iconClass} text-yellow-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'info':
        return (
          <svg className={`${iconClass} text-blue-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  return (
    <div className={getToastStyles()}>
      {/* Progress bar for timed toasts */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute top-0 left-0 h-1 bg-current opacity-20">
          <div 
            className="h-full bg-current opacity-60 transition-all ease-linear"
            style={{
              width: '100%',
              animation: `shrink ${toast.duration}ms linear`
            }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0 pt-0.5">
            {getIconForType()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">{toast.title}</div>
            {toast.message && (
              <div className="mt-1 text-sm opacity-90">{toast.message}</div>
            )}
            
            {/* Action Button */}
            {toast.action && (
              <div className="mt-3">
                <button
                  onClick={handleAction}
                  className="text-sm font-medium underline hover:no-underline focus:outline-none"
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          {toast.dismissible && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// CSS for animations (add to your global CSS)
const toastAnimations = `
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}
`

// Export animations for inclusion in global CSS
export { toastAnimations }

// Helper hook for error handling with toasts
export const useErrorToast = () => {
  const { error, warning } = useToast()

  const showError = (errorInstance: any, context?: string) => {
    // Handle different error types
    if (typeof errorInstance === 'string') {
      return error('Error', errorInstance)
    }

    if (errorInstance?.message) {
      return error(
        context ? `Error in ${context}` : 'Error',
        errorInstance.message
      )
    }

    return error('Unexpected Error', 'Something went wrong. Please try again.')
  }

  const showValidationError = (field: string, message: string) => {
    return warning('Validation Error', `${field}: ${message}`)
  }

  const showNetworkError = () => {
    return error(
      'Connection Error',
      'Please check your internet connection and try again.',
      {
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      }
    )
  }

  return {
    showError,
    showValidationError,
    showNetworkError
  }
}