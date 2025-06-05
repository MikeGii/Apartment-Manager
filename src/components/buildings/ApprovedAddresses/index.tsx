// src/components/buildings/ApprovedAddresses/index.tsx
"use client"

import { useState } from 'react'
import { useAddresses } from '@/hooks/useAddresses'
import { AddressList } from './AddressList'
import { FlatManagement } from './FlatManagement'

interface ApprovedAddressesProps {
  userId: string
}

export const ApprovedAddresses = ({ userId }: ApprovedAddressesProps) => {
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  
  const { 
    approvedAddresses, 
    loading
  } = useAddresses(userId)

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId)
  }

  const selectedAddress = approvedAddresses.find(addr => addr.id === selectedAddressId)

  // Only show this component if there are approved addresses
  if (!loading && approvedAddresses.length === 0) {
    return null
  }

  return (
    <div className="bg-white shadow rounded-lg mb-8">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          My Buildings ({approvedAddresses.length})
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Approved Addresses List */}
          <div>
            <AddressList
              addresses={approvedAddresses}
              selectedAddressId={selectedAddressId}
              onAddressSelect={handleAddressSelect}
              loading={loading}
            />
          </div>

          {/* Flats Management for Selected Address */}
          <div>
            {selectedAddressId && selectedAddress ? (
              <FlatManagement
                addressId={selectedAddressId}
                addressFullName={selectedAddress.full_address}
                managerId={userId}
              />
            ) : (
              <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-gray-400 mb-2">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm mb-1">Select an address to manage</p>
                <p className="text-gray-400 text-xs">
                  Choose an approved address from the left to manage its flats and tenants
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}