// src/app/address-management/page.tsx - Address Management for Building Managers
"use client"

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { FullScreenLoader } from '@/components/ui/LoadingSpinner'
import { useAddresses, AddressFormData } from '@/hooks/useAddresses'
import { AddressForm } from '@/components/buildings/AddressManagement/AddressForm'

export default function AddressManagementPage() {
  const { profile, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  
  const { 
    pendingAddresses, 
    approvedAddresses,
    loading: addressesLoading, 
    createAddress,
    fetchAddresses
  } = useAddresses(profile?.id)

  // Access control - redirect if not authorized
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace('/login')
        return
      }

      if (!profile) {
        return
      }

      if (profile.role !== 'building_manager' && profile.role !== 'admin') {
        router.replace('/dashboard')
        return
      }
    }
  }, [loading, isAuthenticated, profile, router])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => setSubmitSuccess(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [submitSuccess])

  useEffect(() => {
    if (submitError) {
      const timer = setTimeout(() => setSubmitError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [submitError])

  const handleCreateAddress = async (data: AddressFormData) => {
    if (!profile?.id) return { success: false, message: 'User not found' }

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)
    
    try {
      const result = await createAddress(data, profile.id)
      if (result.success) {
        setSubmitSuccess(result.message)
        setShowAddressForm(false)
      } else {
        setSubmitError(result.message)
      }
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creating address'
      setSubmitError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelForm = () => {
    setShowAddressForm(false)
    setSubmitError(null)
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
  if (profile.role !== 'building_manager' && profile.role !== 'admin') {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <PageHeader 
        title="Address Management" 
        profile={profile} 
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Success Message */}
          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-green-800 text-sm font-medium">{submitSuccess}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 text-sm font-medium">{submitError}</p>
              </div>
            </div>
          )}

          {/* Address Management Header with Add Button */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Property Address Management
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Create and manage property addresses for new apartment buildings
                  </p>
                </div>
                {!showAddressForm && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {/* Add Address Form */}
              {showAddressForm && (
                <div className="border-t border-gray-200 pt-6">
                  <AddressForm
                    onSubmit={handleCreateAddress}
                    onCancel={handleCancelForm}
                    isSubmitting={isSubmitting}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Pending Addresses Section */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Pending Address Approvals ({pendingAddresses.length})
                </h3>
                {pendingAddresses.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Awaiting Admin Review
                  </span>
                )}
              </div>

              {addressesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading pending addresses...</p>
                </div>
              ) : pendingAddresses.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No pending addresses</h4>
                  <p className="text-gray-500 text-sm">
                    All your submitted addresses have been processed by the administrator.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingAddresses.map((address) => (
                    <div key={address.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 hover:bg-yellow-100 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {address.full_address}
                            </h4>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                              <div className="flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <span>Pending Review</span>
                              </div>
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Street:</span> {address.street_and_number}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Review Process</p>
                        <p className="text-blue-700">
                          Submitted addresses are reviewed by administrators. Once approved, you can create buildings and start managing properties at these locations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Approved Addresses Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  My Approved Addresses ({approvedAddresses.length})
                </h3>
                {approvedAddresses.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Ready for Buildings
                  </span>
                )}
              </div>

              {addressesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading approved addresses...</p>
                </div>
              ) : approvedAddresses.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No approved addresses yet</h4>
                  <p className="text-gray-500 text-sm mb-4">
                    Submit address requests above. Once approved by administrators, they will appear here.
                  </p>
                  {!showAddressForm && (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Add Your First Address
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedAddresses.map((address) => (
                    <div key={address.id} className="border border-green-200 bg-green-50 rounded-lg p-4 hover:bg-green-100 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {address.full_address}
                            </h4>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                              <div className="flex items-center space-x-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>Approved</span>
                              </div>
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Street:</span> {address.street_and_number}
                            </p>
                            <a
                              href="/building-management"
                              className="text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
                            >
                              Manage Buildings →
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-green-800">
                        <p className="font-medium">Ready for Development</p>
                        <p className="text-green-700">
                          These approved addresses are ready for building creation and management. You can now create buildings and add flats at these locations.
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
    </div>
  )
}