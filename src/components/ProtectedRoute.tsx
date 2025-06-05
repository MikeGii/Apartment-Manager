// Simplified ProtectedRoute.tsx - Cleaner logic
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
  const { user, profile, loading, profileError, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only process after loading is complete
    if (loading) return

    console.log('ProtectedRoute: Auth check -', { 
      isAuthenticated, 
      hasProfile: !!profile, 
      profileError,
      userRole: profile?.role 
    })

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      console.log('ProtectedRoute: Not authenticated, redirecting to login')
      router.replace('/login')
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
      router.replace('/dashboard')
      return
    }

    console.log('ProtectedRoute: Access granted for role:', profile.role)
  }, [loading, isAuthenticated, profile, profileError, requiredRole, router])

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
  if (isAuthenticated && !profile) {
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
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // If role check fails, don't render children (will redirect)
  if (requiredRole && profile?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  // All checks passed, render children
  return <>{children}</>
}