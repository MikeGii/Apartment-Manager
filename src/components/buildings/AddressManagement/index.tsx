// src/components/buildings/AddressManagement/index.tsx
"use client"

import { useState } from 'react'
import { useAddresses, AddressFormData } from '@/hooks/useAddresses'
import { AddressForm } from './AddressForm'
import { PendingAddresses } from './PendingAddresses'

interface AddressManagementProps {
  userId: string
}

export const AddressManagement = ({ userId }: AddressManagementProps) => {
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { 
    pendingAddresses, 
    loading, 
    createAddress,
    fetchAddresses
  } = useAddresses(userId)

  const handleCreateAddress = async (data: AddressFormData) => {
    setIsSubmitting(true)
    try {
      const result = await createAddress(data, userId)
      if (result.success) {
        setShowAddressForm(false)
      }
      return result
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelForm = () => {
    setShowAddressForm(false)
  }

  return (
    <div className="bg-white shadow rounded-lg mb-8">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Address Management
          </h3>
          <button
            onClick={() => setShowAddressForm(!showAddressForm)}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {showAddressForm ? 'Cancel' : 'Add New Address'}
          </button>
        </div>

        {/* Add Address Form */}
        {showAddressForm && (
          <AddressForm
            onSubmit={handleCreateAddress}
            onCancel={handleCancelForm}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Pending Addresses */}
        <PendingAddresses 
          addresses={pendingAddresses}
          loading={loading}
        />
      </div>
    </div>
  )
}