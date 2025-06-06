// src/hooks/useFlats.ts - Improved with proper error handling and schema consistency
"use client"

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type Flat = {
  id: string
  building_id: string
  unit_number: string
  tenant_id: string | null
  tenant_email?: string
  tenant_name?: string
}

export type FlatFormData = {
  unit_number: string
}

// Define the correct column name for building-address relationship
const BUILDING_ADDRESS_COLUMN = 'address' // Change this to 'address_id' if that's your actual column name

const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[useFlats] ${message}`, data || '')
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[useFlats] ${message}`, error || '')
  }
}

export const useFlats = () => {
  const [flats, setFlats] = useState<Flat[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFlatsForAddress = useCallback(async (addressId: string) => {
    if (!addressId) return

    setLoading(true)
    setError(null)
    
    try {
      logger.debug('Fetching flats for address:', addressId)
      
      // Find the building for this address
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .select('id')
        .eq(BUILDING_ADDRESS_COLUMN, addressId)
        .single()

      if (buildingError) {
        if (buildingError.code === 'PGRST116') {
          logger.debug('No building found for address, returning empty flats array')
          setFlats([])
          return
        }
        throw new Error(`Failed to find building: ${buildingError.message}`)
      }

      // Fetch flats for this building with tenant information
      const { data, error } = await supabase
        .from('flats')
        .select(`
          *,
          tenant:profiles(email, full_name)
        `)
        .eq('building_id', building.id)
        .order('unit_number', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch flats: ${error.message}`)
      }
      
      // Transform the data to include tenant info
      const flatsWithTenants = data?.map(flat => ({
        ...flat,
        tenant_email: flat.tenant?.email || null,
        tenant_name: flat.tenant?.full_name || null
      })) || []

      logger.debug('Flats fetched successfully:', flatsWithTenants.length)
      setFlats(flatsWithTenants)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load flats'
      logger.error('Error fetching flats:', error)
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
  ) => {
    if (!addressId || !flatData.unit_number) {
      throw new Error('Missing required flat data')
    }

    setError(null)
    
    try {
      logger.debug('Creating flat:', { addressId, unitNumber: flatData.unit_number })

      // Check for existing building
      const { data: existingBuilding, error: buildingLookupError } = await supabase
        .from('buildings')
        .select('id')
        .eq(BUILDING_ADDRESS_COLUMN, addressId)
        .single()

      let buildingId = null

      if (buildingLookupError?.code === 'PGRST116') {
        // No building exists, create one
        logger.debug('Creating new building for address')
        const { data: newBuilding, error: createBuildingError } = await supabase
          .from('buildings')
          .insert({
            name: `${addressFullName} Building`,
            [BUILDING_ADDRESS_COLUMN]: addressId,
            manager_id: managerId
          })
          .select('id')
          .single()

        if (createBuildingError) {
          throw new Error(`Failed to create building: ${createBuildingError.message}`)
        }
        
        buildingId = newBuilding.id
      } else if (buildingLookupError) {
        throw new Error(`Error checking for existing building: ${buildingLookupError.message}`)
      } else {
        buildingId = existingBuilding.id
      }

      // Check for duplicate flat number in the same building
      const { data: existingFlat } = await supabase
        .from('flats')
        .select('id')
        .eq('building_id', buildingId)
        .eq('unit_number', flatData.unit_number.trim())
        .single()

      if (existingFlat) {
        throw new Error(`Flat number "${flatData.unit_number}" already exists in this building`)
      }

      // Create the flat
      const { data: newFlat, error: flatError } = await supabase
        .from('flats')
        .insert({
          building_id: buildingId,
          unit_number: flatData.unit_number.trim()
        })
        .select()
        .single()

      if (flatError) {
        throw new Error(`Failed to create flat: ${flatError.message}`)
      }

      logger.debug('Flat created successfully:', newFlat.id)

      // Refresh flats list
      await fetchFlatsForAddress(addressId)
      
      return { success: true, message: 'Flat created successfully!' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creating flat'
      logger.error('Error creating flat:', error)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteFlat = async (flatId: string, addressId: string) => {
    try {
      logger.debug('Deleting flat:', flatId)
      
      const { error } = await supabase
        .from('flats')
        .delete()
        .eq('id', flatId)

      if (error) {
        throw new Error(`Failed to delete flat: ${error.message}`)
      }

      logger.debug('Flat deleted successfully')
      await fetchFlatsForAddress(addressId)
      
      return { success: true, message: 'Flat deleted successfully!' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error deleting flat'
      logger.error('Error deleting flat:', error)
      throw new Error(errorMessage)
    }
  }

  const removeTenant = async (flatId: string, addressId: string) => {
    try {
      logger.debug('Removing tenant from flat:', flatId)
      
      const { error } = await supabase
        .from('flats')
        .update({ tenant_id: null })
        .eq('id', flatId)

      if (error) {
        throw new Error(`Failed to remove tenant: ${error.message}`)
      }

      logger.debug('Tenant removed successfully')
      await fetchFlatsForAddress(addressId)
      
      return { success: true, message: 'Tenant removed successfully! Flat is now vacant.' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error removing tenant'
      logger.error('Error removing tenant:', error)
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