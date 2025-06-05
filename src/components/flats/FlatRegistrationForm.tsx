// src/components/flats/FlatRegistrationForm.tsx
"use client"

import { useForm } from 'react-hook-form'
import { FlatRegistrationData } from '@/hooks/useUserFlats'
import { AddressHierarchy } from '@/components/buildings/AddressManagement/AddressHierarchy'
import { BuildingSelector } from './BuildingSelector'

interface FlatRegistrationFormProps {
  onSubmit: (data: FlatRegistrationData) => Promise<{ success: boolean; message: string }>
  onCancel: () => void
  isSubmitting?: boolean
}

export const FlatRegistrationForm = ({ onSubmit, onCancel, isSubmitting = false }: FlatRegistrationFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm<FlatRegistrationData>()

  const watchedCounty = watch('county_id')
  const watchedMunicipality = watch('municipality_id')
  const watchedSettlement = watch('settlement_id')

  const handleFormSubmit = async (data: FlatRegistrationData) => {
    const result = await onSubmit(data)
    
    if (result.success) {
      reset()
      onCancel() // Close the form
    }
    
    // Show message regardless of success/failure
    alert(result.message)
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Register Your Flat
        </h3>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Address Selection */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Building Location</h4>
            <AddressHierarchy
              register={register}
              errors={errors}
              watchedCounty={watchedCounty}
              watchedMunicipality={watchedMunicipality}
            />
          </div>

          {/* Smart Building Selector */}
          <BuildingSelector
            register={register}
            errors={errors}
            setValue={setValue}
            watchedSettlement={watchedSettlement}
            disabled={isSubmitting}
          />

          {/* Unit Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Your Flat/Unit Number <span className="text-red-500">*</span>
            </label>
            <input
              {...register('unit_number', { 
                required: 'Unit number is required',
                minLength: {
                  value: 1,
                  message: 'Unit number must be at least 1 character'
                },
                pattern: {
                  value: /^[A-Za-z0-9]+$/,
                  message: 'Unit number can only contain letters and numbers'
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
          
          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Registration Requirements</p>
                <ul className="text-blue-700 space-y-1 text-xs">
                  <li>• Select your building from the dropdown list when available</li>
                  <li>• The building must be approved by administration</li>
                  <li>• The flat must be created by building management first</li>
                  <li>• The flat must be currently vacant (not occupied)</li>
                  <li>• You can only register flats you actually live in</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registering...
                </div>
              ) : (
                'Register Flat'
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}