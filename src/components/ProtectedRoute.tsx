"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

type ProtectedRouteProps = {
  children: React.ReactNode
  requireApproval?: boolean
}

export default function ProtectedRoute({ children, requireApproval = false }: ProtectedRouteProps) {
  const { user, profile, loading, isAuthenticated, isApproved } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      if (requireApproval && !isApproved) {
        router.push('/pending-approval')
        return
      }
    }
  }, [loading, isAuthenticated, isApproved, requireApproval, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  if (requireApproval && !isApproved) {
    return null // Will redirect to pending approval page
  }

  return <>{children}</>
}