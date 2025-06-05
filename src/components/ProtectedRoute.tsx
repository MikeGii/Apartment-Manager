// src/components/ProtectedRoute.tsx
"use client"

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ProfileErrorHandler } from './auth/ProfileErrorHandler'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading, profileError } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // If not authenticated, redirect to login
      if (!user) {
        console.log('ProtectedRoute: Not authenticated, redirecting to login')
        router.push('/login')
        return
      }

      // If user is authenticated but has profile errors, handle them
      if (profileError) {
        console.log('ProtectedRoute: Profile error detected:', profileError)
        return // ProfileErrorHandler will render
      }

      // If user is authenticated but no profile yet, wait for profile to load
      if (!profile) {
        console.log('ProtectedRoute: User authenticated but profile still loading')
        return
      }

      // Check role requirements
      if (requiredRole && profile.role !== requiredRole) {
        console.log('ProtectedRoute: Access denied for role:', profile.role, 'required:', requiredRole)
        router.push('/dashboard')
        return
      }

      console.log('ProtectedRoute: Access granted for role:', profile.role)
    }
  }, [loading, user, profile, profileError, requiredRole, router])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Handle profile errors (missing profile, etc.)
  if (profileError) {
    return <ProfileErrorHandler />
  }

  // Show loading if authenticated but no profile yet
  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, don't render children (will redirect)
  if (!user) {
    return null
  }

  // If role check fails, don't render children (will redirect)
  if (requiredRole && profile?.role !== requiredRole) {
    return null
  }

  // All checks passed, render children
  return <>{children}</>
}