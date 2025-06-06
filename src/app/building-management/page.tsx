// src/app/building-management/page.tsx - Fixed with ProtectedRoute wrapper
"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useForm } from 'react-hook-form'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useBuildingManagement, BuildingOverview, FlatDetail } from '@/hooks/useBuildingManagement'
import { useFlats, FlatFormData } from '@/hooks/useFlats'
import ProtectedRoute from '@/components/ProtectedRoute'

function BuildingManagementContent() {
  const { profile } = useAuth()
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [buildingFlats, setBuildingFlats] = useState<FlatDetail[]>([])
  const [loadingFlats, setLoadingFlats] = useState(false)
  const [showFlatForm, setShowFlatForm] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  
  // Use the building management hook
  const { 
    buildings, 
    loading: buildingsLoading, 
    error: buildingsError,
    fetchBuildingFlats 
  } = useBuildingManagement(profile?.id)

  // Use flats hook for flat management
  const { createFlat, deleteFlat, removeTenant } = useFlats()

  // Form for adding flats
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FlatFormData>()

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

  const handleBuildingClick = async (buildingId: string) => {
    setSelectedBuildingId(buildingId)
    setShowFlatForm(false) // Hide form when switching buildings
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

  const handleCreateFlat = async (data: FlatFormData) => {
    if (!selectedBuildingId || !profile?.id) return

    const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)
    if (!selectedBuilding) return

    setSubmitError(null)
    setSubmitSuccess(null)
    
    try {
      const result = await createFlat(
        selectedBuilding.address_id, 
        data, 
        profile.id, 
        selectedBuilding.address_full
      )
      setSubmitSuccess(result.message)
      reset()
      setShowFlatForm(false)
      
      // Refresh flats list
      await handleBuildingClick(selectedBuildingId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creating flat'
      setSubmitError(errorMessage)
    }
  }

  const handleDeleteFlat = async (flatId: string) => {
    if (!selectedBuildingId) return
    
    const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)
    if (!selectedBuilding) return

    if (!confirm('Are you sure you want to delete this flat? This action cannot be undone.')) {
      return
    }

    try {
      const result = await deleteFlat(flatId, selectedBuilding.address_id)
      setSubmitSuccess(result.message)
      
      // Refresh flats list
      await handleBuildingClick(selectedBuildingId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error deleting flat'
      setSubmitError(errorMessage)
    }
  }

  const handleRemoveTenant = async (flatId: string) => {
    if (!selectedBuildingId) return
    
    const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)
    if (!selectedBuilding) return

    if (!confirm('Are you sure you want to remove this tenant? This will mark the flat as vacant.')) {
      return
    }

    try {
      const result = await removeTenant(flatId, selectedBuilding.address_id)
      setSubmitSuccess(result.message)
      
      // Refresh flats list
      await handleBuildingClick(selectedBuildingId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error removing tenant'
      setSubmitError(errorMessage)
    }
  }

  const getSelectedBuilding = () => {
    return buildings.find(b => b.id === selectedBuildingId)
  }

  if (!profile) {
    return <LoadingSpinner message="Loading profile..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header - Clean and minimal */}
      <PageHeader 
        title="Building Management" 
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
          {(submitError || buildingsError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 text-sm font-medium">{submitError || buildingsError}</p>
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
                    Click on a building to manage its flats and tenant information
                  </p>
                </div>
              </div>

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
                          <span className="text-sm font-medium">Selected - Manage Flats Below</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detailed Building View with Flat Management */}
          {selectedBuildingId && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Flat Management: {getSelectedBuilding()?.street_and_number}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Add, remove, and manage flats and tenant information
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {!showFlatForm && (
                      <button
                        onClick={() => setShowFlatForm(true)}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Flat</span>
                      </button>
                    )}
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

                {/* Add Flat Form */}
                {showFlatForm && (
                  <div className="mb-6 p-4 bg-green-50 rounded-md border border-green-200">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Add New Flat</h4>
                    <form onSubmit={handleSubmit(handleCreateFlat)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Flat Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register('unit_number', { 
                            required: 'Flat number is required',
                            minLength: {
                              value: 1,
                              message: 'Flat number must be at least 1 character'
                            },
                            pattern: {
                              value: /^[A-Za-z0-9]+$/,
                              message: 'Flat number can only contain letters and numbers'
                            }
                          })}
                          type="text"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="e.g., 101, 2A, etc."
                          disabled={isSubmitting}
                        />
                        {errors.unit_number && (
                          <p className="mt-1 text-sm text-red-600">{errors.unit_number.message}</p>
                        )}
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Creating...
                            </div>
                          ) : (
                            'Add Flat'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowFlatForm(false)
                            reset()
                            setSubmitError(null)
                          }}
                          disabled={isSubmitting}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

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
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No flats added yet</h4>
                    <p className="text-gray-500 text-sm mb-4">
                      Add flats to this building to start managing tenants
                    </p>
                    {!showFlatForm && (
                      <button
                        onClick={() => setShowFlatForm(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Add Your First Flat
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mb-4 text-sm text-gray-600">
                      Total flats: {buildingFlats.length} | Occupied: {buildingFlats.filter(f => f.tenant_id).length} | Vacant: {buildingFlats.filter(f => !f.tenant_id).length}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {buildingFlats.map((flat) => (
                        <FlatCard 
                          key={flat.id} 
                          flat={flat} 
                          onDelete={() => handleDeleteFlat(flat.id)}
                          onRemoveTenant={() => handleRemoveTenant(flat.id)}
                        />
                      ))}
                    </div>
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
                        <p className="font-medium">Building Management Tools</p>
                        <p className="text-blue-700 mt-1">
                          Manage all aspects of this building including flats, tenants, and future features like accounting integration.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

// Enhanced flat card component with improved tenant details and management
const FlatCard = ({ flat, onDelete, onRemoveTenant }: { 
  flat: FlatDetail; 
  onDelete: () => void;
  onRemoveTenant: () => void;
}) => {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <h5 className="text-lg font-bold text-gray-900">Flat {flat.unit_number}</h5>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              flat.tenant_id 
                ? 'bg-green-100 text-green-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {flat.tenant_id ? 'Occupied' : 'Vacant'}
            </span>
          </div>
          
          {flat.tenant_id ? (
            <div className="space-y-3">
              {/* Owner Information */}
              <div className="bg-green-50 p-3 rounded-md border border-green-200">
                <p className="text-xs font-medium text-green-700 uppercase tracking-wider mb-2">
                  Current Tenant
                </p>
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{flat.tenant_name || 'Name not provided'}</p>
                  <p className="text-sm text-gray-600">{flat.tenant_email}</p>
                  {flat.tenant_phone && (
                    <p className="text-sm text-gray-600">{flat.tenant_phone}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-orange-50 rounded-md border border-orange-200">
              <div className="text-orange-400 mb-2">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">Vacant</p>
              <p className="text-xs text-gray-500 mt-1">Available for tenant registration</p>
            </div>
          )}
        </div>
        
        {/* Actions Menu */}
        <div className="ml-4 relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <div className="py-1">
                {flat.tenant_id && (
                  <button
                    onClick={() => {
                      onRemoveTenant()
                      setShowMenu(false)
                    }}
                    className="block px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 w-full text-left"
                  >
                    Remove tenant
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete()
                    setShowMenu(false)
                  }}
                  className="block px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                  disabled={!!flat.tenant_id}
                  title={flat.tenant_id ? "Cannot delete occupied flat" : "Delete this flat"}
                >
                  {flat.tenant_id ? "Cannot delete (occupied)" : "Delete flat"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}

export default function BuildingManagementPage() {
  return (
    <ProtectedRoute>
      <BuildingManagementContent />
    </ProtectedRoute>
  )
}(() => {
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

  const handleBuildingClick = async (buildingId: string) => {
    setSelectedBuildingId(buildingId)
    setShowFlatForm(false) // Hide form when switching buildings
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

  const handleCreateFlat = async (data: FlatFormData) => {
    if (!selectedBuildingId || !profile?.id) return

    const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)
    if (!selectedBuilding) return

    setSubmitError(null)
    setSubmitSuccess(null)
    
    try {
      const result = await createFlat(
        selectedBuilding.address_id, 
        data, 
        profile.id, 
        selectedBuilding.address_full
      )
      setSubmitSuccess(result.message)
      reset()
      setShowFlatForm(false)
      
      // Refresh flats list
      await handleBuildingClick(selectedBuildingId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creating flat'
      setSubmitError(errorMessage)
    }
  }

  const handleDeleteFlat = async (flatId: string) => {
    if (!selectedBuildingId) return
    
    const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)
    if (!selectedBuilding) return

    if (!confirm('Are you sure you want to delete this flat? This action cannot be undone.')) {
      return
    }

    try {
      const result = await deleteFlat(flatId, selectedBuilding.address_id)
      setSubmitSuccess(result.message)
      
      // Refresh flats list
      await handleBuildingClick(selectedBuildingId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error deleting flat'
      setSubmitError(errorMessage)
    }
  }

  const handleRemoveTenant = async (flatId: string) => {
    if (!selectedBuildingId) return
    
    const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)
    if (!selectedBuilding) return

    if (!confirm('Are you sure you want to remove this tenant? This will mark the flat as vacant.')) {
      return
    }

    try {
      const result = await removeTenant(flatId, selectedBuilding.address_id)
      setSubmitSuccess(result.message)
      
      // Refresh flats list
      await handleBuildingClick(selectedBuildingId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error removing tenant'
      setSubmitError(errorMessage)
    }
  }

  const getSelectedBuilding = () => {
    return buildings.find(b => b.id === selectedBuildingId)
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
      {/* Header - Clean and minimal */}
      <PageHeader 
        title="Building Management" 
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
          {(submitError || buildingsError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 text-sm font-medium">{submitError || buildingsError}</p>
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
                    Click on a building to manage its flats and tenant information
                  </p>
                </div>
              </div>

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
                          <span className="text-sm font-medium">Selected - Manage Flats Below</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detailed Building View with Flat Management */}
          {selectedBuildingId && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Flat Management: {getSelectedBuilding()?.street_and_number}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Add, remove, and manage flats and tenant information
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {!showFlatForm && (
                      <button
                        onClick={() => setShowFlatForm(true)}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Flat</span>
                      </button>
                    )}
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

                {/* Add Flat Form */}
                {showFlatForm && (
                  <div className="mb-6 p-4 bg-green-50 rounded-md border border-green-200">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Add New Flat</h4>
                    <form onSubmit={handleSubmit(handleCreateFlat)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Flat Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register('unit_number', { 
                            required: 'Flat number is required',
                            minLength: {
                              value: 1,
                              message: 'Flat number must be at least 1 character'
                            },
                            pattern: {
                              value: /^[A-Za-z0-9]+$/,
                              message: 'Flat number can only contain letters and numbers'
                            }
                          })}
                          type="text"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="e.g., 101, 2A, etc."
                          disabled={isSubmitting}
                        />
                        {errors.unit_number && (
                          <p className="mt-1 text-sm text-red-600">{errors.unit_number.message}</p>
                        )}
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Creating...
                            </div>
                          ) : (
                            'Add Flat'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowFlatForm(false)
                            reset()
                            setSubmitError(null)
                          }}
                          disabled={isSubmitting}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

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
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No flats added yet</h4>
                    <p className="text-gray-500 text-sm mb-4">
                      Add flats to this building to start managing tenants
                    </p>
                    {!showFlatForm && (
                      <button
                        onClick={() => setShowFlatForm(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Add Your First Flat
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mb-4 text-sm text-gray-600">
                      Total flats: {buildingFlats.length} | Occupied: {buildingFlats.filter(f => f.tenant_id).length} | Vacant: {buildingFlats.filter(f => !f.tenant_id).length}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {buildingFlats.map((flat) => (
                        <FlatCard 
                          key={flat.id} 
                          flat={flat} 
                          onDelete={() => handleDeleteFlat(flat.id)}
                          onRemoveTenant={() => handleRemoveTenant(flat.id)}
                        />
                      ))}
                    </div>
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
                        <p className="font-medium">Building Management Tools</p>
                        <p className="text-blue-700 mt-1">
                          Manage all aspects of this building including flats, tenants, and future features like accounting integration.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

// Enhanced flat card component with improved tenant details and management
const FlatCard = ({ flat, onDelete, onRemoveTenant }: { 
  flat: FlatDetail; 
  onDelete: () => void;
  onRemoveTenant: () => void;
}) => {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <h5 className="text-lg font-bold text-gray-900">Flat {flat.unit_number}</h5>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              flat.tenant_id 
                ? 'bg-green-100 text-green-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {flat.tenant_id ? 'Occupied' : 'Vacant'}
            </span>
          </div>
          
          {flat.tenant_id ? (
            <div className="space-y-3">
              {/* Owner Information */}
              <div className="bg-green-50 p-3 rounded-md border border-green-200">
                <p className="text-xs font-medium text-green-700 uppercase tracking-wider mb-2">
                  Current Tenant
                </p>
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{flat.tenant_name || 'Name not provided'}</p>
                  <p className="text-sm text-gray-600">{flat.tenant_email}</p>
                  {flat.tenant_phone && (
                    <p className="text-sm text-gray-600">{flat.tenant_phone}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-orange-50 rounded-md border border-orange-200">
              <div className="text-orange-400 mb-2">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">Vacant</p>
              <p className="text-xs text-gray-500 mt-1">Available for tenant registration</p>
            </div>
          )}
        </div>
        
        {/* Actions Menu */}
        <div className="ml-4 relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <div className="py-1">
                {flat.tenant_id && (
                  <button
                    onClick={() => {
                      onRemoveTenant()
                      setShowMenu(false)
                    }}
                    className="block px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 w-full text-left"
                  >
                    Remove tenant
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete()
                    setShowMenu(false)
                  }}
                  className="block px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                  disabled={!!flat.tenant_id}
                  title={flat.tenant_id ? "Cannot delete occupied flat" : "Delete this flat"}
                >
                  {flat.tenant_id ? "Cannot delete (occupied)" : "Delete flat"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}