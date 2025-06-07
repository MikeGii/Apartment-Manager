// src/hooks/useFlats.ts - Enhanced with Error Handling System
"use client"

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { createLogger } from '@/utils/logger'
import { sortUnitNumbers } from '@/utils/sorting'
import { FlatWithTenant, FlatFormData, ApiResponse } from '@/types'
import { DATABASE_COLUMNS } from '@/utils/constants'
import { 
  errorHandler, 
  withRetry, 
  throwValidationError, 
  throwNotFoundError,
  throwConflictError,
  ValidationError,
  NotFoundError,
  ConflictError,
  AppError
} from '@/utils/errors'
import { useToast } from '@/components/ui/Toast'

const log = createLogger('useFlats')

export const useFlats = () => {
  const [flats, setFlats] = useState<FlatWithTenant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Toast notifications
  const { success, error: showError, warning } = useToast()

  // Enhanced error handling wrapper
  const handleOperation = async <T>(
    operation: () => Promise<T>,
    operationName: string,
    showToast: boolean = true
  ): Promise<{ data?: T; error?: AppError }> => {
    try {
      setError(null)
      const data = await operation()
      return { data }
    } catch (error) {
      const appError = errorHandler.handleError(error, operationName)
      errorHandler.reportError(appError)
      
      // Set local error state
      setError(appError.message)
      
      // Show toast notification
      if (showToast) {
        if (appError.statusCode >= 500) {
          showError(
            'System Error',
            'Something went wrong on our end. Please try again.',
            {
              action: {
                label: 'Report Issue',
                onClick: () => window.open('mailto:support@yourapp.com', '_blank')
              }
            }
          )
        } else {
          showError('Error', appError.message)
        }
      }
      
      return { error: appError }
    }
  }

  const fetchFlatsForAddress = useCallback(async (addressId: string) => {
    if (!addressId) {
      log.debug('No addressId provided, skipping fetch')
      return
    }

    setLoading(true)
    
    const { data, error } = await handleOperation(async () => {
      return await withRetry(async () => {
        log.debug('Fetching flats for address:', addressId)
        
        // Find the building for this address
        const { data: building, error: buildingError } = await supabase
          .from(DATABASE_COLUMNS.BUILDINGS_TABLE)
          .select('id')
          .eq(DATABASE_COLUMNS.BUILDING_ADDRESS, addressId)
          .single()

        if (buildingError) {
          if (buildingError.code === 'PGRST116') {
            log.debug('No building found for address, returning empty flats array')
            return []
          }
          throw errorHandler.parseSupabaseError(buildingError)
        }

        log.debug('Building found:', building.id)

        // Fetch flats for this building with tenant information
        const { data: flatsData, error: flatsError } = await supabase
          .from(DATABASE_COLUMNS.FLATS_TABLE)
          .select(`
            *,
            tenant:profiles(email, full_name, phone)
          `)
          .eq('building_id', building.id)

        if (flatsError) {
          throw errorHandler.parseSupabaseError(flatsError)
        }
        
        // Transform and sort the data
        const flatsWithTenants = flatsData?.map(flat => ({
          ...flat,
          tenant_email: flat.tenant?.email || null,
          tenant_name: flat.tenant?.full_name || null
        })) || []

        // Apply numerical sorting
        const sortedFlats = sortUnitNumbers(flatsWithTenants)
        
        log.debug(`Flats fetched successfully: ${sortedFlats.length} flats`)
        return sortedFlats
      })
    }, 'fetchFlatsForAddress', false) // Don't show toast for fetch operations

    if (data) {
      setFlats(data)
    }
    
    setLoading(false)
  }, [handleOperation])

  const createFlat = async (
    addressId: string, 
    flatData: FlatFormData, 
    managerId: string, 
    addressFullName: string
  ): Promise<ApiResponse> => {
    // Input validation
    if (!addressId?.trim()) {
      throwValidationError('Address ID')
    }
    if (!flatData.unit_number?.trim()) {
      throwValidationError('Flat number')
    }
    if (!managerId?.trim()) {
      throwValidationError('Manager ID')
    }

    const { data, error } = await handleOperation(async () => {
      return await withRetry(async () => {
        log.debug('Creating flat:', { addressId, unitNumber: flatData.unit_number.trim() })

        // Check for existing building
        const { data: existingBuilding, error: buildingLookupError } = await supabase
          .from(DATABASE_COLUMNS.BUILDINGS_TABLE)
          .select('id')
          .eq(DATABASE_COLUMNS.BUILDING_ADDRESS, addressId)
          .single()

        let buildingId = null

        if (buildingLookupError?.code === 'PGRST116') {
          // No building exists, create one
          log.debug('Creating new building for address')
          const { data: newBuilding, error: createBuildingError } = await supabase
            .from(DATABASE_COLUMNS.BUILDINGS_TABLE)
            .insert({
              name: `${addressFullName} Building`,
              [DATABASE_COLUMNS.BUILDING_ADDRESS]: addressId,
              manager_id: managerId
            })
            .select('id')
            .single()

          if (createBuildingError) {
            throw errorHandler.parseSupabaseError(createBuildingError)
          }
          
          buildingId = newBuilding.id
          log.debug('Building created successfully:', buildingId)
        } else if (buildingLookupError) {
          throw errorHandler.parseSupabaseError(buildingLookupError)
        } else {
          buildingId = existingBuilding.id
          log.debug('Using existing building:', buildingId)
        }

        // Check for duplicate flat number in the same building
        const { data: existingFlat } = await supabase
          .from(DATABASE_COLUMNS.FLATS_TABLE)
          .select('id')
          .eq('building_id', buildingId)
          .eq('unit_number', flatData.unit_number.trim())
          .single()

        if (existingFlat) {
          throwConflictError(
            `Flat number "${flatData.unit_number}" already exists in this building`,
            'unit_number'
          )
        }

        // Create the flat
        const { data: newFlat, error: flatError } = await supabase
          .from(DATABASE_COLUMNS.FLATS_TABLE)
          .insert({
            building_id: buildingId,
            unit_number: flatData.unit_number.trim()
          })
          .select()
          .single()

        if (flatError) {
          throw errorHandler.parseSupabaseError(flatError)
        }

        log.info('Flat created successfully:', newFlat.id)

        // Refresh flats list
        await fetchFlatsForAddress(addressId)
        
        return { success: true, message: 'Flat created successfully!' }
      })
    }, 'createFlat')

    if (data) {
      success('Success', 'Flat created successfully!')
      return data
    } else {
      return { 
        success: false, 
        message: error?.message || 'Failed to create flat' 
      }
    }
  }

  const deleteFlat = async (flatId: string, addressId: string): Promise<ApiResponse> => {
    if (!flatId?.trim()) {
      throwValidationError('Flat ID')
    }
    if (!addressId?.trim()) {
      throwValidationError('Address ID')
    }

    const { data, error } = await handleOperation(async () => {
      return await withRetry(async () => {
        log.debug('Deleting flat:', flatId)
        
        // Check if flat has a tenant before deletion
        const { data: flatToDelete, error: checkError } = await supabase
          .from(DATABASE_COLUMNS.FLATS_TABLE)
          .select('tenant_id, unit_number')
          .eq('id', flatId)
          .single()

        if (checkError) {
          if (checkError.code === 'PGRST116') {
            throwNotFoundError('Flat')
          }
          throw errorHandler.parseSupabaseError(checkError)
        }

        if (flatToDelete?.tenant_id) {
          throwConflictError(
            `Cannot delete flat ${flatToDelete.unit_number} - it is currently occupied`,
            'tenant_occupied'
          )
        }
        
        const { error: deleteError } = await supabase
          .from(DATABASE_COLUMNS.FLATS_TABLE)
          .delete()
          .eq('id', flatId)

        if (deleteError) {
          throw errorHandler.parseSupabaseError(deleteError)
        }

        log.info('Flat deleted successfully')
        await fetchFlatsForAddress(addressId)
        
        return { success: true, message: 'Flat deleted successfully!' }
      })
    }, 'deleteFlat')

    if (data) {
      success('Success', 'Flat deleted successfully!')
      return data
    } else {
      return { 
        success: false, 
        message: error?.message || 'Failed to delete flat' 
      }
    }
  }

  const removeTenant = async (flatId: string, addressId: string): Promise<ApiResponse> => {
    if (!flatId?.trim()) {
      throwValidationError('Flat ID')
    }
    if (!addressId?.trim()) {
      throwValidationError('Address ID')
    }

    const { data, error } = await handleOperation(async () => {
      return await withRetry(async () => {
        log.debug('Removing tenant from flat:', flatId)
        
        // Verify flat exists first
        const { data: existingFlat, error: checkError } = await supabase
          .from(DATABASE_COLUMNS.FLATS_TABLE)
          .select('id, tenant_id, unit_number')
          .eq('id', flatId)
          .single()

        if (checkError) {
          if (checkError.code === 'PGRST116') {
            throwNotFoundError('Flat')
          }
          throw errorHandler.parseSupabaseError(checkError)
        }

        if (!existingFlat.tenant_id) {
          warning('Notice', 'This flat is already vacant')
          return { success: true, message: 'Flat is already vacant' }
        }
        
        const { error: updateError } = await supabase
          .from(DATABASE_COLUMNS.FLATS_TABLE)
          .update({ tenant_id: null })
          .eq('id', flatId)

        if (updateError) {
          throw errorHandler.parseSupabaseError(updateError)
        }

        log.info('Tenant removed successfully')
        await fetchFlatsForAddress(addressId)
        
        return { success: true, message: 'Tenant removed successfully! Flat is now vacant.' }
      })
    }, 'removeTenant')

    if (data) {
      success('Success', 'Tenant removed successfully!')
      return data
    } else {
      return { 
        success: false, 
        message: error?.message || 'Failed to remove tenant' 
      }
    }
  }

  // Bulk operations with enhanced error handling
  const createBulkFlats = async (
    addressId: string,
    flatNumbers: string[],
    managerId: string,
    addressFullName: string,
    onProgress?: (current: number, total: number, created: number, errors: string[]) => void
  ): Promise<{ totalCreated: number; errors: string[]; success: boolean }> => {
    if (!flatNumbers.length) {
      throwValidationError('Flat numbers list')
    }

    const { data, error } = await handleOperation(async () => {
      const errors: string[] = []
      let totalCreated = 0

      // Process in smaller batches to avoid overwhelming the database
      const batchSize = 5
      for (let i = 0; i < flatNumbers.length; i += batchSize) {
        const batch = flatNumbers.slice(i, i + batchSize)
        
        // Process batch in parallel with individual error handling
        const batchResults = await Promise.allSettled(
          batch.map(async (unitNumber, batchIndex) => {
            const globalIndex = i + batchIndex
            
            try {
              const result = await createFlat(addressId, { unit_number: unitNumber }, managerId, addressFullName)
              
              if (result.success) {
                totalCreated++
              } else {
                errors.push(`Flat ${unitNumber}: ${result.message}`)
              }
              
              // Report progress
              onProgress?.(globalIndex + 1, flatNumbers.length, totalCreated, errors)
              
              return result
            } catch (error) {
              const appError = errorHandler.handleError(error, 'createBulkFlats')
              errors.push(`Flat ${unitNumber}: ${appError.message}`)
              onProgress?.(globalIndex + 1, flatNumbers.length, totalCreated, errors)
              throw appError
            }
          })
        )

        // Small delay between batches
        if (i + batchSize < flatNumbers.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      return {
        totalCreated,
        errors,
        success: totalCreated > 0
      }
    }, 'createBulkFlats')

    if (data) {
      if (data.totalCreated === flatNumbers.length) {
        success('Success', `All ${data.totalCreated} flats created successfully!`)
      } else if (data.totalCreated > 0) {
        warning(
          'Partial Success', 
          `${data.totalCreated} of ${flatNumbers.length} flats created. ${data.errors.length} failed.`
        )
      } else {
        showError('Failed', 'No flats were created. Please check the errors and try again.')
      }
      return data
    } else {
      return {
        totalCreated: 0,
        errors: [error?.message || 'Bulk operation failed'],
        success: false
      }
    }
  }

  return {
    flats,
    loading,
    error,
    fetchFlatsForAddress,
    createFlat,
    deleteFlat,
    removeTenant,
    createBulkFlats, // New enhanced bulk operation
    clearError: () => setError(null)
  }
}

// Export types for use in components
export type { FlatWithTenant, FlatFormData } from '@/types'