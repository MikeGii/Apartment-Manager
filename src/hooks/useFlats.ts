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
      console.log('🏗️ Creating flat - step by step debugging:')
      console.log('1. Input parameters:', { addressId, flatData, managerId, addressFullName })

      // First, let's check what buildings exist in the database
      const { data: allBuildings, error: allBuildingsError } = await supabase
        .from('buildings')
        .select('*')
        .limit(5)

      console.log('2. All buildings in database:', { allBuildings, allBuildingsError })
      
      if (allBuildings && allBuildings.length > 0) {
        console.log('3. Buildings table columns:', Object.keys(allBuildings[0]))
        console.log('4. Sample building record:', allBuildings[0])
      }

      // Check for duplicate unit numbers in the same building first
      const { data: existingBuilding, error: existingBuildingError } = await supabase
        .from('buildings')
        .select('id')
        .eq('address', addressId)
        .single()

      console.log('5. Existing building lookup result:', { existingBuilding, existingBuildingError })

      if (existingBuilding) {
        // Check if unit number already exists in this building
        const { data: existingFlat } = await supabase
          .from('flats')
          .select('id')
          .eq('building_id', existingBuilding.id)
          .eq('unit_number', flatData.unit_number)
          .single()

        console.log('6. Existing flat check:', { existingFlat })

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

      console.log('7. Building lookup result:', { building, buildingError })

      if (buildingError && buildingError.code !== 'PGRST116') {
        console.error('8. Building lookup failed with unexpected error:', {
          error: buildingError,
          code: buildingError.code,
          message: buildingError.message,
          details: buildingError.details,
          hint: buildingError.hint
        })
        throw new Error(`Failed to find building: ${buildingError.message}`)
      }

      if (building) {
        buildingId = building.id
        console.log('9. Using existing building:', buildingId)
      } else {
        // Create a building for this address
        console.log('10. No building found, creating new building...')
        
        const buildingData = {
          name: `${addressFullName} Building`,
          address: addressId,
          manager_id: managerId
        }
        console.log('11. Building data to insert:', buildingData)
        
        const { data: newBuilding, error: createBuildingError } = await supabase
          .from('buildings')
          .insert(buildingData)
          .select('id')
          .single()

        console.log('12. Building creation result:', { newBuilding, createBuildingError })

        if (createBuildingError) {
          console.error('13. Building creation failed:', {
            error: createBuildingError,
            code: createBuildingError.code,
            message: createBuildingError.message,
            details: createBuildingError.details,
            hint: createBuildingError.hint,
            fullError: JSON.stringify(createBuildingError)
          })
          
          // Try alternative column name
          console.log('14. Trying alternative column name address_id...')
          const buildingDataAlt = {
            name: `${addressFullName} Building`,
            address_id: addressId,
            manager_id: managerId
          }
          console.log('15. Alternative building data:', buildingDataAlt)
          
          const { data: newBuildingAlt, error: createBuildingErrorAlt } = await supabase
            .from('buildings')
            .insert(buildingDataAlt)
            .select('id')
            .single()

          console.log('16. Alternative building creation result:', { newBuildingAlt, createBuildingErrorAlt })

          if (createBuildingErrorAlt) {
            console.error('17. Alternative building creation also failed:', {
              error: createBuildingErrorAlt,
              code: createBuildingErrorAlt.code,
              message: createBuildingErrorAlt.message,
              details: createBuildingErrorAlt.details,
              hint: createBuildingErrorAlt.hint
            })
            throw new Error(`Failed to create building: ${createBuildingError.message || 'Unknown error'}`)
          }
          
          buildingId = newBuildingAlt.id
          console.log('18. Created new building with alternative method:', buildingId)
        } else {
          buildingId = newBuilding.id
          console.log('19. Created new building successfully:', buildingId)
        }
      }

      // Now create the flat
      console.log('20. Creating flat in building:', buildingId)
      const flatInsertData = {
        building_id: buildingId,
        unit_number: flatData.unit_number.trim()
      }
      console.log('21. Flat data to insert:', flatInsertData)
      
      const { data: newFlat, error: flatError } = await supabase
        .from('flats')
        .insert(flatInsertData)
        .select()
        .single()

      console.log('22. Flat creation result:', { newFlat, flatError })

      if (flatError) {
        console.error('23. Flat creation error:', {
          error: flatError,
          code: flatError.code,
          message: flatError.message,
          details: flatError.details,
          hint: flatError.hint
        })
        throw new Error(`Failed to create flat: ${flatError.message}`)
      }

      console.log('24. ✅ Flat created successfully:', newFlat)

      // Refresh flats list
      console.log('25. Refreshing flats list...')
      await fetchFlatsForAddress(addressId)
      
      console.log('26. ✅ Process completed successfully!')
      return { success: true, message: 'Flat created successfully!' }
    } catch (error) {
      console.error('❌ Error creating flat:', error)
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