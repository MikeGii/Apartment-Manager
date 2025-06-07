// src/app/flat-management/page.tsx - Updated with Pending Registrations block
"use client"

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { FullScreenLoader } from '@/components/ui/LoadingSpinner'
import { useBuildingManagement } from '@/hooks/useBuildingManagement'
import { useFlatRequests } from '@/hooks/useFlatRequests'

export default function FlatManagementPage() {
  const { profile, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllBuildings, setShowAllBuildings] = useState(false)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [showPendingDetails, setShowPendingDetails] = useState(false)

  const { 
    buildings, 
    loading: buildingsLoading, 
    error: buildingsError,
    fetchBuildings
  } = useBuildingManagement(profile?.id)

  // Get pending registrations for this manager
  const { 
    requests: allRequests, 
    loading: requestsLoading, 
    approveRequest, 
    rejectRequest 
  } = useFlatRequests(profile?.id, profile?.role)

  // Filter for pending requests only
  const pendingRequests = useMemo(() => 
    allRequests.filter(req => req.status === 'pending'), 
    [allRequests]
  )

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

  // Handle request approval/rejection
  const handleApproveRequest = async (requestId: string, notes?: string) => {
    try {
      const result = await approveRequest(requestId, notes)
      if (result.success) {
        alert(result.message)
      } else {
        alert(`Error: ${result.message}`)
      }
    } catch (error) {
      alert('Failed to approve request. Please try again.')
    }
  }

  const handleRejectRequest = async (requestId: string, notes: string) => {
    if (!notes.trim()) {
      alert('Please provide a reason for rejection.')
      return
    }
    
    try {
      const result = await rejectRequest(requestId, notes)
      if (result.success) {
        alert(result.message)
      } else {
        alert(`Error: ${result.message}`)
      }
    } catch (error) {
      alert('Failed to reject request. Please try again.')
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
        title="Flat Management" 
        profile={profile} 
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Pending Registrations Section */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Pending Registration Requests ({pendingRequests.length})
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                    Review and manage flat registration requests from tenants
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    {pendingRequests.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Action Required
                    </span>
                    )}
                    {pendingRequests.length > 0 && (
                    <button
                        onClick={() => setShowPendingDetails(!showPendingDetails)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                        <span>{showPendingDetails ? 'Hide Requests' : 'Show Requests'}</span>
                        <svg 
                        className={`w-4 h-4 transform transition-transform ${showPendingDetails ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    )}
                </div>
                </div>

                {requestsLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading pending requests...</p>
                </div>
                ) : pendingRequests.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h4>
                    <p className="text-gray-500 text-sm">
                    All registration requests have been processed.
                    </p>
                </div>
                ) : !showPendingDetails ? (
                /* COMPACT SUMMARY VIEW */
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-orange-100 rounded-lg p-2">
                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <div>
                        <h4 className="font-semibold text-gray-900">
                            {pendingRequests.length} registration request{pendingRequests.length > 1 ? 's' : ''} awaiting your review
                        </h4>
                        <p className="text-sm text-gray-600">
                            {pendingRequests.slice(0, 3).map(req => `Flat ${req.unit_number}`).join(', ')}
                            {pendingRequests.length > 3 && ` and ${pendingRequests.length - 3} more`}
                        </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                    </div>
                    </div>
                </div>
                ) : (
                /* DETAILED VIEW */
                <div className="space-y-4">
                    {pendingRequests.map((request) => (
                    <PendingRequestCard
                        key={request.id}
                        request={request}
                        onApprove={handleApproveRequest}
                        onReject={handleRejectRequest}
                    />
                    ))}
                </div>
                )}
            </div>
          </div>

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

// Pending Request Card Component  
interface PendingRequestCardProps {
  request: {
    id: string
    unit_number: string
    building_name: string
    address_full: string
    user_name?: string
    user_email: string
    user_phone?: string
    requested_at: string
  }
  onApprove: (requestId: string, notes?: string) => void
  onReject: (requestId: string, notes: string) => void
}

const PendingRequestCard = ({ request, onApprove, onReject }: PendingRequestCardProps) => {
  const [showActions, setShowActions] = useState(false)
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      await onApprove(request.id, notes.trim() || undefined)
      setShowActions(false)
      setNotes('')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!notes.trim()) {
      alert('Please provide a reason for rejection.')
      return
    }
    
    setIsProcessing(true)
    try {
      await onReject(request.id, notes.trim())
      setShowActions(false)
      setNotes('')
    } finally {
      setIsProcessing(false)
    }
  }

  // Debug log to see what data we're getting
  console.log('Request data:', request)

  return (
    <div className="border border-orange-200 bg-orange-50 rounded-lg p-6 hover:bg-orange-100 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Request Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 rounded-lg p-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-lg">
                  Flat {request.unit_number || 'Unknown'} - {request.address_full || 'Address loading...'}
                </h4>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Registration Request
                </span>
              </div>
            </div>
            
            {/* Request Date - Top Right */}
            <div className="text-right">
              <p className="text-xs text-gray-500">Requested</p>
              <p className="text-sm font-medium text-gray-700">
                {new Date(request.requested_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Applicant Info - Single Column */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Applicant</p>
            <div className="bg-white p-3 rounded-md border border-orange-200">
              <p className="text-sm font-medium text-gray-900 mb-1">
                {request.user_name || 'Name not provided'}
              </p>
              {showActions && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Email:</span> {request.user_email}</p>
                  {request.user_phone && (
                    <p><span className="font-medium">Phone:</span> {request.user_phone}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Panel */}
          {showActions && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-orange-200">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional for approval, required for rejection)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add notes about this request..."
                  disabled={isProcessing}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Approve</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span>Reject</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowActions(false)
                    setNotes('')
                  }}
                  disabled={isProcessing}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Action Button */}
        <div className="ml-4">
          {!showActions && (
            <button
              onClick={() => setShowActions(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Review
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Building Card Component (same as before)
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