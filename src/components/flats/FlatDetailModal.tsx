// src/components/flats/FlatDetailModal.tsx - Expanded flat details modal
"use client"

import { useState } from 'react'
import { UserFlat } from '@/hooks/useUserFlats'

interface FlatDetailModalProps {
  flat: UserFlat
  isOpen: boolean
  onClose: () => void
  onUnregister: (flatId: string) => void
}

export const FlatDetailModal = ({ flat, isOpen, onClose, onUnregister }: FlatDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'details' | 'actions' | 'history'>('details')

  if (!isOpen) return null

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
              onClick={() => setActiveTab('actions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'actions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Things To Do
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
              {/* Property Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Property Information</h3>

              </div>
            </div>
          )}

          {/* Actions Tab */}
          {activeTab === 'actions' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Things You Can Do</h3>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-left transition-colors">
                  <div className="flex items-center mb-2">
                    <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h4 className="font-medium text-blue-900">Contact Building Manager</h4>
                  </div>
                  <p className="text-sm text-blue-700">Send a message to your building management</p>
                  <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
                </button>

                <button className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-left transition-colors">
                  <div className="flex items-center mb-2">
                    <svg className="w-6 h-6 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="font-medium text-green-900">View Documents</h4>
                  </div>
                  <p className="text-sm text-green-700">Access important building documents and notices</p>
                  <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
                </button>

                <button className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 text-left transition-colors">
                  <div className="flex items-center mb-2">
                    <svg className="w-6 h-6 text-purple-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <h4 className="font-medium text-purple-900">View Payments</h4>
                  </div>
                  <p className="text-sm text-purple-700">Check payment history and upcoming bills</p>
                  <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
                </button>

                <button className="bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg p-4 text-left transition-colors">
                  <div className="flex items-center mb-2">
                    <svg className="w-6 h-6 text-orange-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h4 className="font-medium text-orange-900">Request Maintenance</h4>
                  </div>
                  <p className="text-sm text-orange-700">Submit maintenance requests for your flat</p>
                  <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
                </button>
              </div>

              {/* Danger Zone */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Account Actions</h4>
                <button
                  onClick={handleUnregister}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-4 text-left transition-colors w-full"
                >
                  <div className="flex items-center mb-2">
                    <svg className="w-6 h-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h4 className="font-medium text-red-900">Unregister from Flat</h4>
                  </div>
                  <p className="text-sm text-red-700">Remove yourself as tenant of this flat. This action cannot be undone.</p>
                </button>
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