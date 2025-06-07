// src/app/flat-management/page.tsx - New Flat Management Page
"use client"

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { FullScreenLoader } from '@/components/ui/LoadingSpinner'
import { useBuildingManagement } from '@/hooks/useBuildingManagement'

export default function FlatManagementPage() {
  const { profile, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllBuildings, setShowAllBuildings] = useState(false)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)

  const { 
    buildings, 
    loading: buildingsLoading, 
    error: buildingsError,
    fetchBuildings
  } = useBuildingManagement(profile?.id)

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

  // Filter buildings based on search query
  const filteredBuildings = useMemo(() => {
    if (!searchQuery.trim()) {
      return buildings
    }

    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/)
    
    return buildings.filter(building => {
      const searchableText = [
        building.address_full,
        building.street_and_number,
        building.name,
        // Extract individual address parts for better searching
        ...building.address_full.split(/[,\s]+/)
      ].join(' ').toLowerCase()

      // Check if all search terms are found in the searchable text
      return searchTerms.every(term => 
        searchableText.includes(term)
      )
    })
  }, [buildings, searchQuery])

  // Determine which buildings to display
  const displayedBuildings = showAllBuildings 
    ? filteredBuildings 
    : filteredBuildings.slice(0, 3)

  const hasMoreBuildings = filteredBuildings.length > 3

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
        title="Flat Management" 
        profile={profile} 
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Pending Registrations Section */}
          <PendingRegistrations managerId={profile.id} />

          {/* Buildings Overview Section */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    My Buildings ({buildings.length})
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage flats and tenants across your buildings
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              {buildings.length > 0 && (
                <div className="mb-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search buildings by address, street name, or location..."
                    />
                  </div>
                  {searchQuery && (
                    <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                      <span>
                        {filteredBuildings.length === 0 
                          ? 'No buildings found'
                          : `Found ${filteredBuildings.length} building${filteredBuildings.length !== 1 ? 's' : ''}`
                        }
                      </span>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {buildingsError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-800 text-sm font-medium">{buildingsError}</p>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {buildingsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading your buildings...</p>
                </div>
              ) : buildings.length === 0 ? (
                /* No Buildings State */
                <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No buildings yet</h4>
                  <p className="text-gray-500 text-sm mb-4">
                    Create buildings on your approved addresses to start managing flats.
                  </p>
                  <a
                    href="/address-management"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Manage Addresses
                  </a>
                </div>
              ) : filteredBuildings.length === 0 ? (
                /* No Search Results */
                <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">No buildings found</h4>
                  <p className="text-gray-500 text-sm">
                    Try adjusting your search terms or clear the search to see all buildings.
                  </p>
                </div>
              ) : (
                /* Buildings List */
                <div className="space-y-4">
                  {displayedBuildings.map((building) => (
                    <BuildingCard 
                      key={building.id} 
                      building={building}
                      isSelected={selectedBuildingId === building.id}
                      onClick={() => setSelectedBuildingId(building.id)}
                    />
                  ))}
                  
                  {/* Show More/Less Button */}
                  {hasMoreBuildings && (
                    <div className="flex justify-end pt-4">
                      <button
                        onClick={() => setShowAllBuildings(!showAllBuildings)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center space-x-1"
                      >
                        <span>
                          {showAllBuildings 
                            ? 'Show Less' 
                            : `Show ${filteredBuildings.length - 3} More Buildings`
                          }
                        </span>
                        <svg 
                          className={`w-4 h-4 transform transition-transform ${showAllBuildings ? 'rotate-180' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selected Building Details - Placeholder for future development */}
          {selectedBuildingId && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Building Details & Flat Management
                </h3>
                <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Detailed flat management for this building will be implemented here.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

// Building Card Component
interface BuildingCardProps {
  building: {
    id: string
    name: string
    address_full: string
    street_and_number: string
    total_flats: number
    occupied_flats: number
    vacant_flats: number
    linked_accountant?: {
      id: string
      name: string
      email: string
    }
  }
  isSelected: boolean
  onClick: () => void
}

const BuildingCard = ({ building, isSelected, onClick }: BuildingCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`border rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Address */}
          <div className="mb-3">
            <h4 className="font-semibold text-gray-900 text-lg mb-1">
              {building.street_and_number}
            </h4>
            <p className="text-sm text-gray-600 truncate">
              {building.address_full}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Flat Count */}
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Flats</p>
                <p className="text-lg font-bold text-gray-900">{building.total_flats}</p>
                <p className="text-xs text-gray-600">
                  {building.occupied_flats} occupied, {building.vacant_flats} vacant
                </p>
              </div>
            </div>

            {/* Accountant */}
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-lg p-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Accountant</p>
                {building.linked_accountant ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">{building.linked_accountant.name}</p>
                    <p className="text-xs text-gray-600">{building.linked_accountant.email}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 italic">Not linked</p>
                )}
              </div>
            </div>

            {/* Action Indicator */}
            <div className="flex items-center justify-end">
              <div className={`flex items-center space-x-2 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                {isSelected && (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Selected</span>
                  </>
                )}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}