// src/components/buildings/index.tsx
"use client"

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { FullScreenLoader } from '@/components/ui/LoadingSpinner'
import { AddressManagement } from './AddressManagement'
import { ApprovedAddresses } from './ApprovedAddresses'

export const BuildingsManagement = () => {
  const { profile, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  // Access control - redirect if not authorized
  useEffect(() => {
    if (!loading) {
      console.log('Buildings - Auth complete, checking access...')
      
      if (!isAuthenticated) {
        console.log('Buildings - Not authenticated, redirecting to login')
        router.replace('/login')
        return
      }

      if (!profile) {
        console.log('Buildings - No profile found')
        return
      }

      if (profile.role !== 'building_manager' && profile.role !== 'admin') {
        console.log('Buildings - Access denied for role:', profile.role)
        router.replace('/dashboard')
        return
      }

      console.log('Buildings - Access granted for role:', profile.role)
    }
  }, [loading, isAuthenticated, profile, router])

  // Show loading while checking auth
  if (loading) {
    return <FullScreenLoader message="Loading authentication..." />
  }

  // Show loading if not authenticated or no profile
  if (!isAuthenticated || !profile) {
    return <FullScreenLoader message="Checking access..." />
  }

  // Check access
  if (profile.role !== 'building_manager' && profile.role !== 'admin') {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <PageHeader 
        title="Building Management" 
        profile={profile} 
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Address Management Section - Pending Addresses & Add New */}
          <AddressManagement userId={profile.id} />

          {/* Approved Addresses & Flat Management */}
          <ApprovedAddresses userId={profile.id} />

        </div>
      </main>
    </div>
  )
}