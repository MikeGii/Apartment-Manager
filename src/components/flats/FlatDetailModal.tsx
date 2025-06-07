// src/components/flats/FlatDetailModal.tsx - Fixed and clean version
"use client"

import { useState, useEffect } from 'react'
import { UserFlat } from '@/hooks/useUserFlats'
import { supabase } from '@/lib/supabase'

interface FlatDetailModalProps {
  flat: UserFlat
  isOpen: boolean
  onClose: () => void
  onUnregister: (flatId: string) => void
}

interface BuildingManager {
  id: string
  full_name: string
  email: string
  phone?: string
}

export const FlatDetailModal = ({ flat, isOpen, onClose, onUnregister }: FlatDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'details' | 'actions' | 'water' | 'history'>('details')
  const [waterReading, setWaterReading] = useState('')
  const [isSubmittingReading, setIsSubmittingReading] = useState(false)
  const [buildingManager, setBuildingManager] = useState<BuildingManager | null>(null)
  const [loadingManager, setLoadingManager] = useState(false)

  if (!isOpen) return null

  // Fetch building manager data
  const fetchBuildingManager = async () => {
    if (!flat.building_id) return

    setLoadingManager(true)
    try {
      // Get building data first to find the manager_id
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .select('manager_id')
        .eq('id', flat.building_id)
        .single()

      if (buildingError) {
        console.error('Error fetching building:', buildingError)
        return
      }

      if (!building?.manager_id) {
        console.warn('No manager assigned to this building')
        return
      }

      // Get manager profile data
      const { data: manager, error: managerError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .eq('id', building.manager_id)
        .eq('role', 'building_manager')
        .single()

      if (managerError) {
        console.error('Error fetching manager:', managerError)
        return
      }

      setBuildingManager(manager)
    } catch (error) {
      console.error('Error fetching building manager:', error)
    } finally {
      setLoadingManager(false)
    }
  }

  // Fetch manager data when modal opens
  useEffect(() => {
    if (isOpen && flat.building_id) {
      fetchBuildingManager()
    }
  }, [isOpen, flat.building_id])

  // Mock data for water readings (last 12 months)
  const waterReadings = [
    { month: 'Jan 2024', reading: 1245.5, usage: 15.3 },
    { month: 'Feb 2024', reading: 1260.8, usage: 18.7 },
    { month: 'Mar 2024', reading: 1279.5, usage: 21.2 },
    { month: 'Apr 2024', reading: 1300.7, usage: 19.8 },
    { month: 'May 2024', reading: 1320.5, usage: 17.4 },
    { month: 'Jun 2024', reading: 1337.9, usage: 22.1 },
    { month: 'Jul 2024', reading: 1360.0, usage: 25.6 },
    { month: 'Aug 2024', reading: 1385.6, usage: 23.9 },
    { month: 'Sep 2024', reading: 1409.5, usage: 20.3 },
    { month: 'Oct 2024', reading: 1429.8, usage: 18.7 },
    { month: 'Nov 2024', reading: 1448.5, usage: 16.9 },
    { month: 'Dec 2024', reading: 1465.4, usage: 19.2 }
  ]

  const currentReading = waterReadings[waterReadings.length - 1]?.reading || 0

  const handleSubmitReading = async () => {
    if (!waterReading.trim()) {
      alert('Please enter a water meter reading')
      return
    }

    const readingValue = parseFloat(waterReading)
    if (isNaN(readingValue) || readingValue < 0) {
      alert('Please enter a valid number for the water reading')
      return
    }

    if (readingValue <= currentReading) {
      alert(`Reading must be higher than the last reading (${currentReading})`)
      return
    }

    setIsSubmittingReading(true)
    
    try {
      // TODO: Implement API call to save water reading
      // await submitWaterReading(flat.id, readingValue)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('Water reading submitted successfully!')
      setWaterReading('')
    } catch (error) {
      alert('Failed to submit water reading. Please try again.')
    } finally {
      setIsSubmittingReading(false)
    }
  }

  const handleUnregister = () => {
    if (confirm('Are you sure you want to unregister from this flat? This will mark the flat as vacant.')) {
      onUnregister(flat.id)
      onClose()
    }
  }

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only close if clicking the background, not the modal content
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-2xl font-bold">Flat {flat.unit_number}</h2>
              <p className="text-blue-100 text-sm">{flat.building_name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('water')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'water'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Water Readings
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              History
            </button>
          </nav>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Building Manager Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Building Manager</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  {loadingManager ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                      <p className="text-blue-700">Loading manager information...</p>
                    </div>
                  ) : buildingManager ? (
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 rounded-lg p-3">
                        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-blue-900 mb-1">
                              Manager Name
                            </label>
                            <p className="text-gray-900 font-semibold">
                              {buildingManager.full_name || 'Name not available'}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-blue-900 mb-1">
                              Email Address
                            </label>
                            <p className="text-gray-900">{buildingManager.email}</p>
                            {buildingManager.email && (
                              <a
                                href={`mailto:${buildingManager.email}`}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1 inline-block"
                              >
                                Send Email →
                              </a>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-blue-900 mb-1">
                              Phone Number
                            </label>
                            <p className="text-gray-900">
                              {buildingManager.phone || 'Phone not available'}
                            </p>
                            {buildingManager.phone && (
                              <a
                                href={`tel:${buildingManager.phone}`}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1 inline-block"
                              >
                                Call Now →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="bg-yellow-100 rounded-lg p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-medium">No building manager assigned</p>
                      <p className="text-gray-500 text-sm mt-1">
                        Contact building administration for manager information
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Water Readings Tab */}
          {activeTab === 'water' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Water Meter Readings</h3>
              
              {/* Submit New Reading */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Submit New Reading
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Water Meter Reading
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={currentReading + 0.1}
                      value={waterReading}
                      onChange={(e) => setWaterReading(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`e.g., ${(currentReading + 15.5).toFixed(1)}`}
                      disabled={isSubmittingReading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Last reading: {currentReading} cubic meters
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reading Date
                    </label>
                    <input
                      type="date"
                      value={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmittingReading}
                    />
                  </div>
                  
                  <button
                    onClick={handleSubmitReading}
                    disabled={isSubmittingReading || !waterReading.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center justify-center"
                  >
                    {isSubmittingReading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Reading'
                    )}
                  </button>
                </div>
                
                <div className="mt-4 p-3 bg-blue-100 rounded-md">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">💡 Tip:</span> Submit your water meter reading monthly for accurate billing. 
                    Make sure to read the numbers from your water meter carefully.
                  </p>
                </div>
              </div>

              {/* Usage Chart */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Water Usage - Last 12 Months</h4>
                
                {/* Chart Container */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  {/* Chart Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-gray-600">Monthly Water Consumption</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {waterReadings[waterReadings.length - 1]?.usage || 0} m³
                      </p>
                      <p className="text-xs text-gray-500">Last month usage</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Average Monthly Usage</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {(waterReadings.reduce((sum, r) => sum + r.usage, 0) / waterReadings.length).toFixed(1)} m³
                      </p>
                    </div>
                  </div>

                  {/* Simple Bar Chart */}
                  <div className="space-y-3">
                    {waterReadings.map((reading, index) => {
                      const maxUsage = Math.max(...waterReadings.map(r => r.usage))
                      const percentage = (reading.usage / maxUsage) * 100
                      
                      return (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-16 text-xs text-gray-600 text-right">
                            {reading.month.split(' ')[0]}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                            <div
                              className="bg-gradient-to-r from-blue-400 to-blue-600 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="text-white text-xs font-medium">
                                {reading.usage} m³
                              </span>
                            </div>
                          </div>
                          <div className="w-20 text-xs text-gray-600">
                            {reading.reading} m³
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Chart Legend */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-center space-x-6 text-xs text-gray-600">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded"></div>
                        <span>Monthly Usage (m³)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-300 rounded"></div>
                        <span>Total Reading (m³)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-green-900">Lowest Usage</p>
                        <p className="text-lg font-bold text-green-600">
                          {Math.min(...waterReadings.map(r => r.usage)).toFixed(1)} m³
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-red-900">Highest Usage</p>
                        <p className="text-lg font-bold text-red-600">
                          {Math.max(...waterReadings.map(r => r.usage)).toFixed(1)} m³
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-900">Total Usage</p>
                        <p className="text-lg font-bold text-blue-600">
                          {waterReadings.reduce((sum, r) => sum + r.usage, 0).toFixed(1)} m³
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Registration History</h3>
              
              <div className="flow-root">
                <ul className="-mb-8">
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="bg-green-500 h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white">
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">Registration <span className="font-medium text-gray-900">approved</span></p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time>Recently</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="bg-yellow-500 h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white">
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">Registration <span className="font-medium text-gray-900">under review</span></p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time>Previously</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  
                  <li>
                    <div className="relative">
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="bg-blue-500 h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">Registration <span className="font-medium text-gray-900">submitted</span></p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time>Initial submission</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Close
          </button>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  )
}