// src/components/flats/UserFlatCard.tsx
"use client"

import { useState } from 'react'
import { UserFlat } from '@/hooks/useUserFlats'

interface UserFlatCardProps {
  flat: UserFlat
  onUnregister: (flatId: string) => void
}

export const UserFlatCard = ({ flat, onUnregister }: UserFlatCardProps) => {
  const [showMenu, setShowMenu] = useState(false)

  const handleUnregister = () => {
    if (confirm('Are you sure you want to unregister from this flat? This will mark the flat as vacant.')) {
      onUnregister(flat.id)
      setShowMenu(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Flat Info */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Flat {flat.unit_number}
                </h3>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Your Flat
                </span>
              </div>
            </div>

            {/* Address Info - Simplified */}
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Address</p>
                <p className="text-sm text-gray-600">{flat.address_full}</p>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4 flex items-center space-x-2">
              <div className="flex items-center text-green-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Registered</span>
              </div>
            </div>
          </div>
          
          {/* Actions Menu */}
          <div className="ml-4 relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={handleUnregister}
                    className="block px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                  >
                    Unregister from flat
                  </button>
                </div>
              </div>
            )}
          </div>
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