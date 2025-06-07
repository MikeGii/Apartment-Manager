// src/app/building-management/page.tsx - Enhanced Building Management with Bulk Flat Creation
"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { FullScreenLoader } from '@/components/ui/LoadingSpinner'
import { useBuildingManagement, BuildingOverview, FlatDetail } from '@/hooks/useBuildingManagement'
import { BulkFlatCreation } from '@/components/buildings/BulkFlatCreation'

export default function BuildingManagementPage() {
  const { profile, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [buildingFlats, setBuildingFlats] = useState<FlatDetail[]>([])
  const [loadingFlats, setLoadingFlats] = useState(false)
  const [showBulkCreation, setShowBulkCreation] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Use the actual building management hook
  const { 
    buildings, 
    loading: buildingsLoading, 
    error: buildingsError,
    fetchBuildingFlats,
    fetchBuildings,
    clearBuildingFlatsCache
  } = useBuildingManagement(profile?.id)

  // Access control
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

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const handleBuildingClick = async (buildingId: string) => {
    setSelectedBuildingId(buildingId)
    setLoadingFlats(true)
    
    try {
      const flats = await fetchBuildingFlats(buildingId)
      setBuildingFlats(flats)
    } catch (error) {
      console.error('Error fetching flats:', error)
      setBuildingFlats([])
    } finally {
      setLoadingFlats(false)
    }
  }

  const getSelectedBuilding = () => {
    return buildings.find(b => b.id === selectedBuildingId)
  }

  const handleBulkCreationSuccess = async (flatsCreated: number) => {
    setSuccessMessage(`Successfully created ${flatsCreated} flats!`)
    
    // Clear cache for the current building to force fresh data
    if (selectedBuildingId) {
      clearBuildingFlatsCache(selectedBuildingId)
    }
    
    // Force refresh the buildings list to update statistics (total, occupied, vacant counts)
    await fetchBuildings()
    
    // Refresh the current building's flats if one is selected
    if (selectedBuildingId) {
      try {
        setLoadingFlats(true)
        const updatedFlats = await fetchBuildingFlats(selectedBuildingId, true) // Force refresh
        setBuildingFlats(updatedFlats)
      } catch (error) {
        console.error('Error refreshing flats:', error)
      } finally {
        setLoadingFlats(false)
      }
    }
  }

  // Show loading while checking auth
  if (loading) {
    return <FullScreenLoader message="Loading authentication..." />
  }

  if (!isAuthenticated || !profile) {
    return <FullScreenLoader message="Checking access..." />
  }

  if (profile.role !== 'building_manager' && profile.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <PageHeader 
        title="Building Management" 
        profile={profile} 
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-green-800 text-sm font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Buildings Overview */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    My Buildings ({buildings.length})
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Overview of all buildings under your management
                  </p>
                </div>
              </div>

              {buildingsError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-800 text-sm font-medium">{buildingsError}</p>
                  </div>
                </div>
              )}

              {buildingsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading your buildings...</p>
                </div>
              ) : buildings.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No buildings yet</h4>
                  <p className="text-gray-500 text-sm mb-4">
                    Create buildings on your approved addresses to start managing properties.
                  </p>
                  <a
                    href="/address-management"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Manage Addresses
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {buildings.map((building) => (
                    <div
                      key={building.id}
                      onClick={() => handleBuildingClick(building.id)}
                      className={`border rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        selectedBuildingId === building.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {/* Address */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-1">Address</h4>
                        <p className="text-sm text-gray-600">{building.address_full}</p>
                      </div>

                      {/* Flats Information */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Flats</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium text-gray-900">{building.total_flats}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Occupied:</span>
                            <span className="font-medium text-green-600">{building.occupied_flats}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Vacant:</span>
                            <span className="font-medium text-orange-600">{building.vacant_flats}</span>
                          </div>
                        </div>
                      </div>

                      {/* Linked Accountant */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Linked Accountant</h4>
                        {building.linked_accountant ? (
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{building.linked_accountant.name}</p>
                            <p className="text-gray-600">{building.linked_accountant.email}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No accountant linked</p>
                        )}
                      </div>

                      {/* Selection Indicator */}
                      {selectedBuildingId === building.id && (
                        <div className="mt-4 flex items-center text-blue-600">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">Selected</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detailed Building View */}
          {selectedBuildingId && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Building Details: {getSelectedBuilding()?.street_and_number}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Detailed view of flats and tenant information
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* Add Flats Button */}
                    <button
                      onClick={() => setShowBulkCreation(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Flats</span>
                    </button>
                    
                    {/* Close Button */}
                    <button
                      onClick={() => setSelectedBuildingId(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {loadingFlats ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading flat details...</p>
                  </div>
                ) : buildingFlats.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No flats in this building</h4>
                    <p className="text-gray-500 text-sm mb-4">
                      Get started by adding flats to this building.
                    </p>
                    <button
                      onClick={() => setShowBulkCreation(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md text-sm font-medium transition-colors"
                    >
                      Add Your First Flats
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {buildingFlats.map((flat) => (
                      <div
                        key={flat.id}
                        className={`border rounded-lg p-4 ${
                          flat.tenant_id 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-orange-200 bg-orange-50'
                        }`}
                      >
                        {/* Flat Number as Title */}
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-gray-900">
                            {flat.unit_number}
                          </h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            flat.tenant_id 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {flat.tenant_id ? 'Occupied' : 'Vacant'}
                          </span>
                        </div>

                        {/* Tenant Information */}
                        {flat.tenant_id ? (
                          <div className="space-y-3">
                            {/* Owner Name */}
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                Owner Name
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                {flat.tenant_name || 'Name not provided'}
                              </p>
                            </div>

                            {/* Owner Email */}
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                Email
                              </p>
                              <p className="text-sm text-gray-700">
                                {flat.tenant_email || 'Email not provided'}
                              </p>
                            </div>

                            {/* Owner Phone */}
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                Phone
                              </p>
                              <p className="text-sm text-gray-700">
                                {flat.tenant_phone || 'Phone not provided'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-orange-400 mb-2">
                              <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-600">Vacant</p>
                            <p className="text-xs text-gray-500 mt-1">Available for registration</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Building Summary */}
                {buildingFlats.length > 0 && (
                  <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Building Summary</p>
                        <p className="text-blue-700 mt-1">
                          Total {buildingFlats.length} flats • {buildingFlats.filter(f => f.tenant_id).length} occupied • {buildingFlats.filter(f => !f.tenant_id).length} vacant
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bulk Flat Creation Modal */}
          {showBulkCreation && selectedBuildingId && (
            <BulkFlatCreation
              buildingId={selectedBuildingId}
              buildingName={getSelectedBuilding()?.address_full || 'Selected Building'}
              addressId={getSelectedBuilding()?.address_id || ''}
              managerId={profile.id}
              onClose={() => setShowBulkCreation(false)}
              onSuccess={handleBulkCreationSuccess}
            />
          )}

        </div>
      </main>
    </div>
  )
}