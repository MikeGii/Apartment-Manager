"use client"

import React from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/ui/Toast'

interface ClientProvidersProps {
  children: React.ReactNode
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ErrorBoundary>
  )
}