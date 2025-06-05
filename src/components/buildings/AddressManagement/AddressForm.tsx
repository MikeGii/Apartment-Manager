// src/components/buildings/AddressManagement/AddressForm.tsx
"use client"

import { useForm } from 'react-hook-form'
import { AddressFormData } from '@/hooks/useAddresses'
import { AddressHierarchy } from './AddressHierarchy'

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => Promise<{ success: boolean; message: string }>
  onCancel: () => void
  isSubmitting?: boolean
}

export const AddressForm = ({ onSubmit, onCancel, isSubmitting = false }: AddressFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<AddressFormData>()

  const watchedCounty = watch('county_id')
  const watchedMunicipality = watch('municipality_id')

  const handleFormSubmit = async (data: AddressFormData) => {
    const result = await onSubmit(data)
    
    if (result.success) {
      alert(result.message)
      reset()
      onCancel() // Close the form
    } else {
      alert(result.message)
    }
  }

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-md">
      <h4 className="text-md font-medium text-gray-900 mb-3">Add New Address</h4>
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Address Hierarchy Component */}
        <AddressHierarchy
          register={register}
          errors={errors}
          watchedCounty={watchedCounty}
          watchedMunicipality={watchedMunicipality}
        />

        {/* Street and Building Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Street and Building Number <span className="text-red-500">*</span>
          </label>
          <input
            {...register('street_and_number', { 
              required: 'Street and number is required',
              minLength: {
                value: 2,
                message: 'Street and number must be at least 2 characters'
              }
            })}
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Sõpruse 10"
            disabled={isSubmitting}
          />
          {errors.street_and_number && (
            <p className="mt-1 text-sm text-red-600">{errors.street_and_number.message}</p>
          )}
        </div>
        
        {/* Form Actions */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}