// Updated BulkFlatCreation.tsx - Integrated with centralized configuration
"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFlats } from '@/hooks/useFlats'
import config, { featureFlags, validation } from '@/config'
import { ERROR_MESSAGES, configHelpers } from '@/utils/constants'

interface BulkFlatCreationProps {
  buildingId: string
  buildingName: string
  addressId: string
  managerId: string
  onClose: () => void
  onSuccess: (flatsCreated: number) => void
}

type FlatCreationMethod = 'range' | 'list' | 'pattern'

interface BulkFlatFormData {
  method: FlatCreationMethod
  // Range method
  startNumber: number
  endNumber: number
  prefix: string
  suffix: string
  // List method
  flatList: string
  // Pattern method
  floors: number
  flatsPerFloor: number
  floorPrefix: string
  unitPattern: string
}

export const BulkFlatCreation = ({ 
  buildingId, 
  buildingName, 
  addressId,
  managerId,
  onClose, 
  onSuccess 
}: BulkFlatCreationProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [preview, setPreview] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [currentFlatIndex, setCurrentFlatIndex] = useState(0)
  const [createdCount, setCreatedCount] = useState(0)
  const [errors, setErrors] = useState<string[]>([])

  const { createFlat } = useFlats()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors: formErrors }
  } = useForm<BulkFlatFormData>({
    defaultValues: {
      method: 'range',
      startNumber: 1,
      endNumber: 10,
      prefix: '',
      suffix: '',
      floors: 5,
      flatsPerFloor: 4,
      floorPrefix: '',
      unitPattern: '{floor}{unit:02d}'
    }
  })

  const method = watch('method')
  const startNumber = watch('startNumber')
  const endNumber = watch('endNumber')
  const prefix = watch('prefix')
  const suffix = watch('suffix')
  const flatList = watch('flatList')
  const floors = watch('floors')
  const flatsPerFloor = watch('flatsPerFloor')
  const floorPrefix = watch('floorPrefix')
  const unitPattern = watch('unitPattern')

  // Generate preview based on method
  const generatePreview = () => {
    let flatNumbers: string[] = []

    try {
      switch (method) {
        case 'range':
          if (startNumber && endNumber && startNumber <= endNumber && startNumber > 0) {
            const totalFlats = endNumber - startNumber + 1
            
            // Check against configuration limits
            if (totalFlats > config.business.maxBulkFlats) {
              alert(ERROR_MESSAGES.VALIDATION.TOO_MANY_FLATS)
              return
            }
            
            for (let i = startNumber; i <= endNumber; i++) {
              const flatNumber = `${prefix || ''}${i}${suffix || ''}`
              
              // Use centralized validation
              if (validation.isValidFlatNumber(flatNumber)) {
                flatNumbers.push(flatNumber)
              }
            }
          }
          break

        case 'list':
          if (flatList) {
            const potentialFlats = flatList
              .split(/[,\n\r]+/)
              .map(flat => flat.trim())
              .filter(flat => flat.length > 0)
              .filter((flat, index, arr) => arr.indexOf(flat) === index) // Remove duplicates
            
            // Check against configuration limits
            if (potentialFlats.length > config.business.maxBulkFlats) {
              alert(ERROR_MESSAGES.VALIDATION.TOO_MANY_FLATS)
              return
            }
            
            // Validate each flat number
            flatNumbers = potentialFlats.filter(flat => validation.isValidFlatNumber(flat))
          }
          break

        case 'pattern':
          if (floors && flatsPerFloor && unitPattern) {
            const totalFlats = floors * flatsPerFloor
            
            // Check against configuration limits
            if (totalFlats > config.business.maxBulkFlats) {
              alert(ERROR_MESSAGES.VALIDATION.TOO_MANY_FLATS)
              return
            }
            
            for (let floor = 1; floor <= floors; floor++) {
              for (let unit = 1; unit <= flatsPerFloor; unit++) {
                try {
                  const flatNumber = unitPattern
                    .replace(/\{floor\}/g, `${floorPrefix || ''}${floor}`)
                    .replace(/\{unit:0(\d+)d\}/g, (match, digits) => {
                      return unit.toString().padStart(parseInt(digits), '0')
                    })
                    .replace(/\{unit\}/g, unit.toString())
                  
                  // Use centralized validation
                  if (validation.isValidFlatNumber(flatNumber)) {
                    flatNumbers.push(flatNumber)
                  }
                } catch (error) {
                  // Invalid pattern, skip
                }
              }
            }
          }
          break
      }
    } catch (error) {
      console.error('Error generating preview:', error)
    }

    setPreview(flatNumbers)
    setShowPreview(true)
  }

  const createFlatsSequentially = async (flatNumbers: string[]) => {
    setIsSubmitting(true)
    setCurrentFlatIndex(0)
    setCreatedCount(0)
    setErrors([])
    
    const creationErrors: string[] = []
    let successCount = 0

    for (let i = 0; i < flatNumbers.length; i++) {
      setCurrentFlatIndex(i + 1)
      
      try {
        const result = await createFlat(
          addressId,
          { unit_number: flatNumbers[i] },
          managerId,
          buildingName
        )
        
        if (result.success) {
          successCount++
          setCreatedCount(successCount)
        } else {
          creationErrors.push(`Flat ${flatNumbers[i]}: ${result.message}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        creationErrors.push(`Flat ${flatNumbers[i]}: ${errorMessage}`)
      }
      
      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    setErrors(creationErrors)
    setIsSubmitting(false)
    
    if (successCount > 0) {
      onSuccess(successCount)
      
      // Show final result
      const finalMessage = successCount === flatNumbers.length 
        ? `Successfully created all ${successCount} flats!`
        : `Created ${successCount} out of ${flatNumbers.length} flats. ${creationErrors.length} failed.`
      
      alert(finalMessage)
      
      if (creationErrors.length === 0) {
        onClose()
      }
    } else {
      alert('Failed to create any flats. Please check the errors and try again.')
    }
  }

  const handleBulkCreate = async (data: BulkFlatFormData) => {
    if (preview.length === 0) {
      alert('No flats to create. Please generate a preview first.')
      return
    }

    // Use configuration-aware limit checking
    if (preview.length > config.business.maxBulkFlats) {
      alert(ERROR_MESSAGES.VALIDATION.TOO_MANY_FLATS)
      return
    }

    // Check if bulk operations are allowed
    if (!configHelpers.canPerformBulkOperations()) {
      alert(ERROR_MESSAGES.BUSINESS.BULK_DISABLED)
      return
    }

    if (preview.length > 50) {
      const confirmed = confirm(
        `You're about to create ${preview.length} flats. This might take a while. Continue?`
      )
      if (!confirmed) return
    }

    await createFlatsSequentially(preview)
  }

  const getMethodDescription = () => {
    switch (method) {
      case 'range':
        return 'Create flats with sequential numbers (e.g., 5, 6, 7... or 101, 102, 103...)'
      case 'list':
        return 'Enter a custom list of flat numbers, separated by commas or new lines'
      case 'pattern':
        return 'Create flats using a floor/unit pattern (e.g., 101, 102, 201, 202...)'
      default:
        return ''
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Add Multiple Flats
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Building: {buildingName}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Maximum {config.business.maxBulkFlats} flats per bulk operation
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress indicator when creating */}
        {isSubmitting && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Creating flats... ({currentFlatIndex} of {preview.length})
                </p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(currentFlatIndex / preview.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  {createdCount} flats created successfully
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Show errors if any */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-900 mb-2">
              Creation Errors ({errors.length}):
            </h4>
            <div className="max-h-32 overflow-y-auto">
              {errors.map((error, index) => (
                <p key={index} className="text-xs text-red-700">{error}</p>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(handleBulkCreate)} className="space-y-6">
          
          {/* Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Creation Method
            </label>
            <div className="space-y-3">
              {[
                { value: 'range', label: 'Number Range', desc: 'Sequential numbers starting from any number' },
                { value: 'list', label: 'Custom List', desc: 'Enter specific flat numbers' },
                { value: 'pattern', label: 'Floor Pattern', desc: 'Floor-based numbering (101, 102, 201...)' }
              ].map(option => (
                <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    {...register('method')}
                    type="radio"
                    value={option.value}
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-600">{getMethodDescription()}</p>
          </div>

          {/* Range Method Fields */}
          {method === 'range' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Number <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('startNumber', { 
                    required: 'Start number is required', 
                    min: { value: 1, message: 'Start number must be at least 1' },
                    max: { 
                      value: config.business.maxFlatsPerBuilding, 
                      message: `Cannot exceed ${config.business.maxFlatsPerBuilding} flats per building` 
                    }
                  })}
                  type="number"
                  min="1"
                  max={config.business.maxFlatsPerBuilding}
                  disabled={isSubmitting}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                {formErrors.startNumber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.startNumber.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Number <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('endNumber', { 
                    required: 'End number is required',
                    min: { value: 1, message: 'End number must be at least 1' },
                    max: { 
                      value: config.business.maxFlatsPerBuilding, 
                      message: `Cannot exceed ${config.business.maxFlatsPerBuilding} flats per building` 
                    },
                    validate: value => value >= startNumber || 'End number must be greater than or equal to start number'
                  })}
                  type="number"
                  min="1"
                  max={config.business.maxFlatsPerBuilding}
                  disabled={isSubmitting}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                {formErrors.endNumber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.endNumber.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Prefix (optional)
                </label>
                <input
                  {...register('prefix')}
                  type="text"
                  placeholder="e.g., A"
                  disabled={isSubmitting}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Suffix (optional)
                </label>
                <input
                  {...register('suffix')}
                  type="text"
                  placeholder="e.g., B"
                  disabled={isSubmitting}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          )}

          {/* List Method Fields */}
          {method === 'list' && (
            <div className="p-4 bg-green-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700">
                Flat Numbers <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('flatList', { required: 'Please enter flat numbers' })}
                rows={6}
                placeholder="Enter flat numbers separated by commas or new lines:&#10;101, 102, 103&#10;201&#10;202&#10;A1, A2, B1, B2"
                disabled={isSubmitting}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
              />
              {formErrors.flatList && (
                <p className="mt-1 text-sm text-red-600">{formErrors.flatList.message}</p>
              )}
              <p className="mt-2 text-sm text-gray-600">
                Separate flat numbers with commas or put each on a new line. Duplicates will be removed automatically.
                Max {config.business.maxFlatNumberLength} characters per flat number.
              </p>
            </div>
          )}

          {/* Pattern Method Fields */}
          {method === 'pattern' && (
            <div className="p-4 bg-purple-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Floors <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('floors', { 
                      required: 'Number of floors is required', 
                      min: 1,
                      max: 50
                    })}
                    type="number"
                    min="1"
                    max="50"
                    disabled={isSubmitting}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Flats per Floor <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('flatsPerFloor', { 
                      required: 'Flats per floor is required', 
                      min: 1,
                      max: 20
                    })}
                    type="number"
                    min="1"
                    max="20"
                    disabled={isSubmitting}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Floor Prefix (optional)
                  </label>
                  <input
                    {...register('floorPrefix')}
                    type="text"
                    placeholder="e.g., F"
                    maxLength={2}
                    disabled={isSubmitting}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Unit Pattern <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('unitPattern', { required: 'Unit pattern is required' })}
                  type="text"
                  placeholder="{floor}{unit:02d}"
                  disabled={isSubmitting}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                />
                <div className="mt-2 text-sm text-gray-600">
                  <p className="font-medium">Pattern Options:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><code>{'{floor}'}</code> - Floor number (1, 2, 3...)</li>
                    <li><code>{'{unit}'}</code> - Unit number (1, 2, 3...)</li>
                    <li><code>{'{unit:02d}'}</code> - Zero-padded unit (01, 02, 03...)</li>
                  </ul>
                  <p className="mt-1">Example: <code>{'{floor}{unit:02d}'}</code> creates 101, 102, 201, 202...</p>
                </div>
              </div>
            </div>
          )}

          {/* Preview Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={generatePreview}
              disabled={isSubmitting}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:bg-gray-400"
            >
              Generate Preview
            </button>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Preview ({preview.length} flats)
                {preview.length > config.business.maxBulkFlats && (
                  <span className="ml-2 text-sm text-red-600 font-normal">
                    - Exceeds limit of {config.business.maxBulkFlats}
                  </span>
                )}
              </h4>
              
              {preview.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {preview.slice(0, 50).map((flatNumber, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {flatNumber}
                      </span>
                    ))}
                  </div>
                  {preview.length > 50 && (
                    <p className="mt-2 text-sm text-gray-600">
                      Showing first 50 flats. Total: {preview.length}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-800 text-sm">
                    No flats generated. Please check your input parameters.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting || preview.length === 0 || preview.length > config.business.maxBulkFlats}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating {preview.length} Flats...</span>
                </>
              ) : (
                <span>Create {preview.length} Flats</span>
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
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