// src/components/buildings/AddressManagement/PendingAddresses.tsx
"use client"

import { Address } from '@/hooks/useAddresses'

interface PendingAddressesProps {
  addresses: Address[]
  loading?: boolean
}

export const PendingAddresses = ({ addresses, loading = false }: PendingAddressesProps) => {
  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading pending addresses...</p>
      </div>
    )
  }

  return (
    <div>
      <h4 className="text-md font-medium text-gray-900 mb-3">
        Addresses Waiting for Approval ({addresses.length})
      </h4>
      
      {addresses.length === 0 ? (
        <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">
            No pending addresses. All your submitted addresses have been processed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div 
              key={address.id} 
              className="flex justify-between items-center p-4 border border-yellow-200 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <div className="flex-1">
                <h5 className="font-medium text-gray-900 mb-1">
                  {address.full_address}
                </h5>
                <p className="text-sm text-gray-600">
                  Street: {address.street_and_number}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>Pending Review</span>
                  </div>
                </span>
              </div>
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium">Review Process</p>
                <p className="text-blue-700">
                  Submitted addresses are reviewed by administrators. You'll be able to manage flats once an address is approved.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}