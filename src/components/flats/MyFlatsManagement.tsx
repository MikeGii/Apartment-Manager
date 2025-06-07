// src/components/flats/MyFlatsManagement.tsx - Updated with modal integration
"use client"

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { FullScreenLoader } from '@/components/ui/LoadingSpinner'
import { useUserFlats, FlatRegistrationData, UserFlat } from '@/hooks/useUserFlats'
import { FlatRegistrationForm } from './FlatRegistrationForm'
import { UserFlatCard } from './UserFlatCard'
import { UserRequestStatus } from './UserRequestStatus'
import { FlatDetailModal } from './FlatDetailModal'

export const MyFlatsManagement = () => {
  const { profile, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [selectedFlat, setSelectedFlat] = useState<UserFlat | null>(null)
  const [showFlatModal, setShowFlatModal] = useState(false)

  const { 
    userFlats, 
    loading: flatsLoading, 
    error, 
    registerFlat, 
    unregisterFlat 
  } = useUserFlats(profile?.id)

  // Access control - redirect if not authorized
  useEffect(() => {
    if (!loading) {
      console.log('MyFlats - Auth complete, checking access...')
      
      if (!isAuthenticated) {
        console.log('MyFlats - Not authenticated, redirecting to login')
        router.replace('/login')
        return
      }

      if (!profile) {
        console.log('MyFlats - No profile found')
        return
      }

      if (profile.role !== 'user') {
        console.log('MyFlats - Access denied for role:', profile.role)
        router.replace('/dashboard')
        return
      }

      console.log('MyFlats - Access granted for role:', profile.role)
    }
  }, [loading, isAuthenticated, profile, router])

  const handleRegisterFlat = async (data: FlatRegistrationData) => {
    if (!profile?.id) return { success: false, message: 'User not found' }

    const result = await registerFlat(data, profile.id)
    
    if (result.success) {
      setShowRegistrationForm(false)
    }
    
    return result
  }

  const handleUnregisterFlat = async (flatId: string) => {
    await unregisterFlat(flatId)
  }

  const handleCancelRegistration = () => {
    setShowRegistrationForm(false)
  }

  const handleFlatClick = (flat: UserFlat) => {
    setSelectedFlat(flat)
    setShowFlatModal(true)
  }

  const handleCloseFlatModal = () => {
    setShowFlatModal(false)
    setSelectedFlat(null)
  }

  // Show loading while checking auth
  if (loading) {
    return <FullScreenLoader message="Loading authentication..." />
  }

  // Show loading if not authenticated or no profile
  if (!isAuthenticated || !profile) {
    return <FullScreenLoader message="Checking access..." />
  }

  // Check access
  if (profile.role !== 'user') {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with Burger Menu */}
      <PageHeader 
        title="My Flats" 
        profile={profile} 
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* User Request Status */}
          <UserRequestStatus userId={profile.id} />

          {/* Registration Form */}
          {showRegistrationForm && (
            <div className="mb-8">
              <FlatRegistrationForm
                onSubmit={handleRegisterFlat}
                onCancel={handleCancelRegistration}
                isSubmitting={flatsLoading}
              />
            </div>
          )}

          {/* Flat Management Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Flat Management
                </h3>
                {!showRegistrationForm && (
                  <button
                    onClick={() => setShowRegistrationForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Add New Flat
                  </button>
                )}
              </div>

              {flatsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading your flats...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </div>
              ) : userFlats.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No flats registered yet</h3>
                  <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                    Register your flat to start managing your tenancy information and connect with building management.
                  </p>
                  {!showRegistrationForm && (
                    <button
                      onClick={() => setShowRegistrationForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm font-medium transition-colors"
                    >
                      Add New Flat
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      You have {userFlats.length} registered flat{userFlats.length > 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      Click on any flat to view details
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userFlats.map((flat) => (
                      <UserFlatCard 
                        key={flat.id} 
                        flat={flat} 
                        onUnregister={handleUnregisterFlat}
                        onClick={handleFlatClick}
                      />
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Tenant Management</p>
                        <p className="text-blue-700">
                          Manage your registered flats and stay connected with building management. Click on any flat card to view detailed information and available actions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Flat Detail Modal */}
      {selectedFlat && (
        <FlatDetailModal
          flat={selectedFlat}
          isOpen={showFlatModal}
          onClose={handleCloseFlatModal}
          onUnregister={handleUnregisterFlat}
        />
      )}
    </div>
  )
}