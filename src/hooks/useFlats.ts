// src/hooks/useFlats.ts
"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export type Flat = {
  id: string
  building_id: string
  unit_number: string
  floor: number
  tenant_id: string | null
  tenant_email?: string
  tenant_name?: string
}

export const useFlats = () => {
  const [flats, setFlats] = useState<Flat[]>([])
  const [loading, setLoading] = useState(false)

  const fetchFlatsForAddress = async (addressId: string) => {
    setLoading(true)
    try {
      // Find the building for this address
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .select('id')
        .eq('address_id', addressId)
        .single()

      if (buildingError) {
        if (buildingError.code === 'PGRST116') {
          // No building exists yet, that's fine
          setFlats([])
          return
        }
        throw buildingError
      }

      // Fetch flats for this building
      const { data, error } = await supabase
        .from('flats')
        .select(`
          *,
          tenant:profiles(email, full_name)
        `)
        .eq('building_id', building.id)
        .order('floor', { ascending: true })
        .order('unit_number', { ascending: true })

      if (error) throw error
      
      // Transform the data to include tenant info
      const flatsWithTenants = data?.map(flat => ({
        ...flat,
        tenant_email: flat.tenant?.email || null,
        tenant_name: flat.tenant?.full_name || null
      })) || []

      setFlats(flatsWithTenants)
    } catch (error) {
      console.error('Error fetching flats:', error)
    } finally {
      setLoading(false)
    }
  }

  const createFlat = async (addressId: string, flatData: {
    unit_number: string
    floor: number
  }, managerId: string, addressFullName: string) => {
    try {
      // First, we need to find or create a building for this address
      let buildingId = null

      // Check if a building exists for this address
      const { data: existingBuilding, error: buildingError } = await supabase
        .from('buildings')
        .select('id')
        .eq('address_id', addressId)
        .single()

      if (buildingError && buildingError.code !== 'PGRST116') {
        throw buildingError
      }

      if (existingBuilding) {
        buildingId = existingBuilding.id
      } else {
        // Create a building for this address
        const { data: newBuilding, error: createBuildingError } = await supabase
          .from('buildings')
          .insert({
            name: addressFullName + ' Building',
            address_id: addressId,
            manager_id: managerId
          })
          .select('id')
          .single()

        if (createBuildingError) throw createBuildingError
        buildingId = newBuilding.id
      }

      // Now create the flat
      const { error } = await supabase
        .from('flats')
        .insert({
          building_id: buildingId,
          unit_number: flatData.unit_number,
          floor: flatData.floor
        })

      if (error) throw error

      // Refresh flats
      await fetchFlatsForAddress(addressId)
    } catch (error) {
      console.error('Error creating flat:', error)
      throw error
    }
  }

  return {
    flats,
    loading,
    fetchFlatsForAddress,
    createFlat
  }
}