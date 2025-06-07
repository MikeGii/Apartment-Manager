// src/hooks/useFlats.ts - Simplified version with fixes
"use client"

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { createLogger } from '@/utils/logger'
import { sortUnitNumbers } from '@/utils/sorting'
import { FlatWithTenant, FlatFormData, ApiResponse } from '@/types'
import { DATABASE_COLUMNS } from '@/utils/constants'

const log = createLogger('useFlats')

export const useFlats = () => {
  const [flats, setFlats] = useState<FlatWithTenant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortUnitNumbers = <T extends { unit_number: string }>(items: T[]): T[] => {
  return items.sort((a, b) => {
    const aNum = a.unit_number
    const bNum = b.unit_number
    
    // Extract numeric part from the beginning
    const aNumeric = parseInt(aNum.match(/^\d+/)?.[0] || '0')
    const bNumeric = parseInt(bNum.match(/^\d+/)?.[0] || '0')
    
    // Sort by numeric part first
    if (aNumeric !== bNumeric) {
      return aNumeric - bNumeric
    }
    
    // If same numeric part, sort alphabetically
    return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' })
  })
  } 

  const fetchFlatsForAddress = useCallback(async (addressId: string) => {
    if (!addressId) {
      log.debug('No addressId provided, skipping fetch')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
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
          setFlats([])
          return
        }
        throw new Error(`Failed to find building: ${buildingError.message}`)
      }

      log.debug('Building found:', building.id)

      // Fetch flats for this building with tenant information
      const { data, error } = await supabase
        .from(DATABASE_COLUMNS.FLATS_TABLE)
        .select(`
          *,
          tenant:profiles(email, full_name, phone)
        `)
        .eq('building_id', building.id)

      if (error) {
        throw new Error(`Failed to fetch flats: ${error.message}`)
      }
      
      // Transform and sort the data
      const flatsWithTenants = data?.map(flat => ({
        ...flat,
        tenant_email: flat.tenant?.email || null,
        tenant_name: flat.tenant?.full_name || null
      })) || []

      // FIXED: Apply numerical sorting
      const sortedFlats = sortUnitNumbers(flatsWithTenants)
      setFlats(sortedFlats)

      log.debug(`Flats fetched successfully: ${sortedFlats.length} flats`)
      setFlats(sortedFlats)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load flats'
      log.error('Error fetching flats:', error)
      setError(errorMessage)
      setFlats([])
    } finally {
      setLoading(false)
    }
  }, [])

  const createFlat = async (
    addressId: string, 
    flatData: FlatFormData, 
    managerId: string, 
    addressFullName: string
  ): Promise<ApiResponse> => {
    if (!addressId || !flatData.unit_number?.trim()) {
      throw new Error('Missing required flat data')
    }

    setError(null)
    
    try {
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
          log.error('Error creating building:', createBuildingError)
          throw new Error(`Failed to create building: ${createBuildingError.message}`)
        }
        
        buildingId = newBuilding.id
        log.debug('Building created successfully:', buildingId)
      } else if (buildingLookupError) {
        log.error('Error checking for existing building:', buildingLookupError)
        throw new Error(`Error checking for existing building: ${buildingLookupError.message}`)
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
        throw new Error(`Flat number "${flatData.unit_number}" already exists in this building`)
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
        log.error('Error creating flat:', flatError)
        throw new Error(`Failed to create flat: ${flatError.message}`)
      }

      log.info('Flat created successfully:', newFlat.id)

      // Refresh flats list
      await fetchFlatsForAddress(addressId)
      
      return { success: true, message: 'Flat created successfully!' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creating flat'
      log.error('Create flat failed:', errorMessage)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteFlat = async (flatId: string, addressId: string): Promise<ApiResponse> => {
    try {
      log.debug('Deleting flat:', flatId)
      
      // Check if flat has a tenant before deletion
      const { data: flatToDelete, error: checkError } = await supabase
        .from(DATABASE_COLUMNS.FLATS_TABLE)
        .select('tenant_id, unit_number')
        .eq('id', flatId)
        .single()

      if (checkError) {
        throw new Error(`Failed to check flat status: ${checkError.message}`)
      }

      if (flatToDelete?.tenant_id) {
        throw new Error(`Cannot delete flat ${flatToDelete.unit_number} - it is currently occupied`)
      }
      
      const { error } = await supabase
        .from(DATABASE_COLUMNS.FLATS_TABLE)
        .delete()
        .eq('id', flatId)

      if (error) {
        throw new Error(`Failed to delete flat: ${error.message}`)
      }

      log.info('Flat deleted successfully')
      await fetchFlatsForAddress(addressId)
      
      return { success: true, message: 'Flat deleted successfully!' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error deleting flat'
      log.error('Delete flat failed:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  const removeTenant = async (flatId: string, addressId: string): Promise<ApiResponse> => {
    try {
      log.debug('Removing tenant from flat:', flatId)
      
      const { error } = await supabase
        .from(DATABASE_COLUMNS.FLATS_TABLE)
        .update({ tenant_id: null })
        .eq('id', flatId)

      if (error) {
        throw new Error(`Failed to remove tenant: ${error.message}`)
      }

      log.info('Tenant removed successfully')
      await fetchFlatsForAddress(addressId)
      
      return { success: true, message: 'Tenant removed successfully! Flat is now vacant.' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error removing tenant'
      log.error('Remove tenant failed:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    flats,
    loading,
    error,
    fetchFlatsForAddress,
    createFlat,
    deleteFlat,
    removeTenant
  }
}

// Export types for use in components
export type { FlatWithTenant, FlatFormData } from '@/types'