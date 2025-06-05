// src/components/buildings/ApprovedAddresses/AddressList.tsx
"use client"

import { Address } from '@/hooks/useAddresses'

interface AddressListProps {
  addresses: Address[]
  selectedAddressId: string | null
  onAddressSelect: (addressId: string) => void
  loading?: boolean
}

export const AddressList = ({ 
  addresses, 
  selectedAddressId, 
  onAddressSelect, 
  loading = false 
}: AddressListProps) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading approved addresses...</p>
      </div>
    )
  }

  if (addresses.length === 0) {
    return (
      <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm mb-2">No approved addresses yet</p>
        <p className="text-gray-400 text-xs">
          Submit new addresses and wait for admin approval to start managing buildings
        </p>
      </div>
    )
  }

  return (
    <div>
      <h4 className="text-md font-medium text-gray-900 mb-3">
        My Approved Addresses ({addresses.length})
      </h4>
      
      <div className="space-y-3">
        {addresses.map((address) => (
          <div
            key={address.id}
            onClick={() => onAddressSelect(address.id)}
            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedAddressId === address.id
                ? 'border-green-500 bg-green-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h5 className="font-medium text-gray-900 mb-1">
                  {address.full_address}
                </h5>
                <p className="text-sm text-gray-600 mb-2">
                  {address.street_and_number}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    <div className="flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Approved</span>
                    </div>
                  </span>
                  {selectedAddressId === address.id && (
                    <span className="text-xs text-green-600 font-medium">
                      Currently Selected
                    </span>
                  )}
                </div>
              </div>
              
              <div className="ml-4">
                <svg 
                  className={`w-5 h-5 transition-colors ${
                    selectedAddressId === address.id ? 'text-green-600' : 'text-gray-400'
                  }`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {addresses.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-green-800">
              <p className="font-medium">Ready for Management</p>
              <p className="text-green-700">
                Click on any address to start managing its flats and tenants.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}