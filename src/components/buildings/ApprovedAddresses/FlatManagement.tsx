// src/components/buildings/ApprovedAddresses/FlatManagement.tsx
"use client"

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useFlats, FlatFormData } from '@/hooks/useFlats'
import { FlatWithTenant } from '@/types'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'

interface FlatManagementProps {
  addressId: string
  addressFullName: string
  managerId: string
}

export const FlatManagement = ({ addressId, addressFullName, managerId }: FlatManagementProps) => {
  const [showFlatForm, setShowFlatForm] = useState(false)
  const { warning } = useToast() // Only for client-side validation
  
  const { flats, loading, error, fetchFlatsForAddress, createFlat, deleteFlat, removeTenant } = useFlats()
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FlatFormData>()

  // Fetch flats when component mounts or addressId changes
  useEffect(() => {
    if (addressId) {
      fetchFlatsForAddress(addressId)
    }
  }, [addressId, fetchFlatsForAddress])

  const handleCreateFlat = async (data: FlatFormData) => {
    // Client-side validation with toast warnings
    if (!data.unit_number?.trim()) {
      warning('Validation Error', 'Please enter a flat number')
      return
    }

    // Hook handles all success/error messaging via toasts
    const result = await createFlat(addressId, data, managerId, addressFullName)
    
    if (result.success) {
      reset()
      setShowFlatForm(false)
    }
    // No need for manual error handling - toasts are handled in the hook
  }

  const handleDeleteFlat = async (flatId: string) => {
    if (!confirm('Are you sure you want to delete this flat? This action cannot be undone.')) {
      return
    }

    // Hook handles all success/error messaging via toasts
    await deleteFlat(flatId, addressId)
  }

  const handleRemoveTenant = async (flatId: string) => {
    if (!confirm('Are you sure you want to remove this tenant? This will mark the flat as vacant.')) {
      return
    }

    // Hook handles all success/error messaging via toasts
    await removeTenant(flatId, addressId)
  }

  const handleCancelForm = () => {
    setShowFlatForm(false)
    reset()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-md font-medium text-gray-900">
          Flats in {addressFullName}
        </h4>
        <button
          onClick={() => setShowFlatForm(!showFlatForm)}
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {showFlatForm ? 'Cancel' : 'Add Flat'}
        </button>
      </div>

      {/* Add Flat Form */}
      {showFlatForm && (
        <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
          <h5 className="text-md font-medium text-gray-900 mb-3">Add New Flat</h5>
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
                onClick={handleCancelForm}
                disabled={isSubmitting}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Flats List */}
      {loading ? (
        <LoadingSpinner message="Loading flats..." />
      ) : flats.length === 0 ? (
        <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm mb-2">No flats added yet</p>
          <p className="text-gray-400 text-xs">
            Add flats to this building to start managing tenants
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="mb-3 text-sm text-gray-600">
            Total flats: {flats.length} | Occupied: {flats.filter(f => f.tenant_id).length} | Vacant: {flats.filter(f => !f.tenant_id).length}
          </div>
          
          {flats.map((flat) => (
            <FlatCard 
              key={flat.id} 
              flat={flat} 
              onDelete={() => handleDeleteFlat(flat.id)}
              onRemoveTenant={() => handleRemoveTenant(flat.id)}
            />
          ))}
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium">Flat Management</p>
                <p className="text-blue-700">
                  Manage tenant assignments and flat details for this building.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced flat card component with tenant details visible to managers
const FlatCard = ({ flat, onDelete, onRemoveTenant }: { 
  flat: FlatWithTenant; 
  onDelete: () => void;
  onRemoveTenant: () => void;
}) => {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h5 className="font-medium text-gray-900">Flat {flat.unit_number}</h5>
          </div>
          
          {flat.tenant_id ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>Occupied</span>
                  </div>
                </span>
              </div>
              {/* Tenant Details - Now Visible to Managers */}
              <div className="text-sm text-gray-600 ml-1 bg-gray-50 p-3 rounded-md">
                <p className="font-medium text-gray-700 mb-1">Current Tenant:</p>
                <p className="font-medium text-gray-900">{flat.tenant_name || 'Name not provided'}</p>
                <p className="text-gray-600">{flat.tenant_email}</p>
              </div>
            </div>
          ) : (
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
                <span>Vacant</span>
              </div>
            </span>
          )}
        </div>
        
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