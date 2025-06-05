// src/hooks/useFlats.ts
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

export const useFlats = () => {
  const [flats, setFlats] = useState<Flat[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFlatsForAddress = useCallback(async (addressId: string) => {
    if (!addressId) return

    setLoading(true)
    setError(null)
    
    try {
      console.log('Fetching flats for address:', addressId)
      
      // Find the building for this address
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .select('id')
        .eq('address', addressId)
        .single()

      if (buildingError) {
        if (buildingError.code === 'PGRST116') {
          // No building exists yet, that's fine
          console.log('No building found for address, returning empty flats array')
          setFlats([])
          return
        }
        throw buildingError
      }

      console.log('Building found:', building.id)

      // Fetch flats for this building
      const { data, error } = await supabase
        .from('flats')
        .select(`
          *,
          tenant:profiles(email, full_name)
        `)
        .eq('building_id', building.id)
        .order('unit_number', { ascending: true })

      if (error) throw error
      
      // Transform the data to include tenant info
      const flatsWithTenants = data?.map(flat => ({
        ...flat,
        tenant_email: flat.tenant?.email || null,
        tenant_name: flat.tenant?.full_name || null
      })) || []

      console.log('Flats fetched successfully:', flatsWithTenants.length)
      setFlats(flatsWithTenants)
    } catch (error) {
      console.error('Error fetching flats:', error)
      setError('Failed to load flats')
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
      console.log('Creating flat:', { addressId, flatData, managerId })

      // Check for duplicate unit numbers in the same building first
      const { data: existingBuilding } = await supabase
        .from('buildings')
        .select('id')
        .eq('address', addressId)
        .single()

      if (existingBuilding) {
        // Check if unit number already exists in this building
        const { data: existingFlat } = await supabase
          .from('flats')
          .select('id')
          .eq('building_id', existingBuilding.id)
          .eq('unit_number', flatData.unit_number)
          .single()

        if (existingFlat) {
          throw new Error(`Unit number "${flatData.unit_number}" already exists in this building`)
        }
      }

      // Find or create building
      let buildingId = null

      // Check if a building exists for this address
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .select('id')
        .eq('address', addressId)
        .single()

      if (buildingError && buildingError.code !== 'PGRST116') {
        console.error('Building lookup error:', buildingError)
        throw new Error(`Failed to find building: ${buildingError.message}`)
      }

      if (building) {
        buildingId = building.id
        console.log('Using existing building:', buildingId)
      } else {
        // Create a building for this address
        console.log('Creating new building for address')
        const buildingData = {
          name: `${addressFullName} Building`,
          address: addressId,
          manager_id: managerId
        }
        console.log('Building data to insert:', buildingData)
        
        const { data: newBuilding, error: createBuildingError } = await supabase
          .from('buildings')
          .insert(buildingData)
          .select('id')
          .single()

        if (createBuildingError) {
          console.error('Detailed building creation error:', {
            error: createBuildingError,
            code: createBuildingError.code,
            message: createBuildingError.message,
            details: createBuildingError.details,
            hint: createBuildingError.hint
          })
          throw new Error(`Failed to create building: ${createBuildingError.message || 'Unknown error'}`)
        }
        buildingId = newBuilding.id
        console.log('Created new building:', buildingId)
      }

      // Now create the flat
      console.log('Creating flat in building:', buildingId)
      const { data: newFlat, error: flatError } = await supabase
        .from('flats')
        .insert({
          building_id: buildingId,
          unit_number: flatData.unit_number.trim()
        })
        .select()
        .single()

      if (flatError) {
        console.error('Flat creation error:', flatError)
        throw new Error(`Failed to create flat: ${flatError.message}`)
      }

      console.log('Flat created successfully:', newFlat)

      // Refresh flats list
      await fetchFlatsForAddress(addressId)
      
      return { success: true, message: 'Flat created successfully!' }
    } catch (error) {
      console.error('Error creating flat:', error)
      let errorMessage = 'Error creating flat'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error)
      }
      
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteFlat = async (flatId: string, addressId: string) => {
    try {
      console.log('Deleting flat:', flatId)
      
      const { error } = await supabase
        .from('flats')
        .delete()
        .eq('id', flatId)

      if (error) throw error

      console.log('Flat deleted successfully')
      
      // Refresh flats list
      await fetchFlatsForAddress(addressId)
      
      return { success: true, message: 'Flat deleted successfully!' }
    } catch (error) {
      console.error('Error deleting flat:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error deleting flat'
      throw new Error(errorMessage)
    }
  }

  const clearFlats = () => {
    setFlats([])
    setError(null)
  }

  return {
    flats,
    loading,
    error,
    fetchFlatsForAddress,
    createFlat,
    deleteFlat,
    clearFlats
  }
}