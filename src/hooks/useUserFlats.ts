// src/hooks/useUserFlats.ts
"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type UserFlat = {
  id: string
  building_id: string
  unit_number: string
  tenant_id: string | null
  building_name: string
  address_full: string
  is_owner: boolean
}

export type FlatRegistrationData = {
  county_id: string
  municipality_id: string
  settlement_id: string
  street_and_number: string
  unit_number: string
}

export const useUserFlats = (userId?: string) => {
  const [userFlats, setUserFlats] = useState<UserFlat[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserFlats = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)
    
    try {
      console.log('Fetching flats for user:', userId)
      
      const { data, error } = await supabase
        .from('flats')
        .select(`
          id,
          building_id,
          unit_number,
          tenant_id,
          buildings!inner (
            name,
            addresses!inner (
              id,
              street_and_number,
              settlements (
                name,
                settlement_type,
                municipalities (
                  name,
                  counties (
                    name
                  )
                )
              )
            )
          )
        `)
        .eq('tenant_id', userId)
        .order('unit_number')

      if (error) throw error

      // Transform the data
      const transformedFlats = (data || []).map((flat: any) => {
        const building = flat.buildings
        const address = building?.addresses
        const settlement = address?.settlements
        const municipality = settlement?.municipalities
        const county = municipality?.counties
        
        return {
          id: flat.id,
          building_id: flat.building_id,
          unit_number: flat.unit_number,
          tenant_id: flat.tenant_id,
          building_name: building?.name || 'Unknown Building',
          address_full: settlement 
            ? `${address.street_and_number}, ${settlement.name} ${settlement.settlement_type}, ${municipality.name}, ${county.name}`
            : address?.street_and_number || 'Unknown Address',
          is_owner: flat.tenant_id === userId
        }
      })

      console.log('User flats fetched:', transformedFlats)
      setUserFlats(transformedFlats)
    } catch (error) {
      console.error('Error fetching user flats:', error)
      setError('Failed to load your flats')
      setUserFlats([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  const registerFlat = async (data: FlatRegistrationData, userId: string) => {
    setError(null)
    
    try {
      console.log('Registering flat for user:', { data, userId })

      // First, find the address
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('id')
        .eq('settlement_id', data.settlement_id)
        .eq('street_and_number', data.street_and_number)
        .eq('status', 'approved')
        .single()

      console.log('Address lookup result:', { addressData, addressError })

      if (addressError || !addressData) {
        throw new Error('Address not found or not approved. Please contact building management.')
      }

      // Find the building for this address
      let { data: buildingData, error: buildingError } = await supabase
        .from('buildings')
        .select('*')  // Select all columns to see what's actually there
        .eq('address', addressData.id)
        .single()

      console.log('Building lookup result:', { buildingData, buildingError })

      // If that fails, try with different column names that might exist
      if (buildingError || !buildingData) {
        console.log('Trying alternative column names...')
        
        // Try address_id instead of address
        const { data: buildingDataAlt, error: buildingErrorAlt } = await supabase
          .from('buildings')
          .select('*')
          .eq('address_id', addressData.id)
          .single()

        console.log('Alternative building lookup (address_id):', { buildingDataAlt, buildingErrorAlt })

        if (buildingDataAlt) {
          // Use the alternative result
          buildingData = buildingDataAlt
          buildingError = buildingErrorAlt
        } else {
          // Check if any buildings exist at all
          const { data: allBuildings } = await supabase
            .from('buildings')
            .select('*')
            .limit(5)
          
          console.log('All buildings in database:', allBuildings)
          
          if (allBuildings && allBuildings.length > 0) {
            console.log('Building table columns:', Object.keys(allBuildings[0]))
            console.log('Sample building:', allBuildings[0])
          }
          
          if (!allBuildings || allBuildings.length === 0) {
            throw new Error('No buildings have been created yet. Please contact building management to set up buildings and flats first.')
          } else {
            throw new Error(`Building not found for this address (${data.street_and_number}). Available buildings are at different addresses. Please contact building management.`)
          }
        }
      }

      // Find the specific flat
      const { data: flatData, error: flatError } = await supabase
        .from('flats')
        .select('id, unit_number, tenant_id')
        .eq('building_id', buildingData.id)
        .eq('unit_number', data.unit_number)
        .single()

      console.log('Flat lookup result:', { flatData, flatError })

      if (flatError || !flatData) {
        // Check what flats exist in this building
        const { data: buildingFlats } = await supabase
          .from('flats')
          .select('unit_number, tenant_id')
          .eq('building_id', buildingData.id)
          .order('unit_number')
        
        console.log('Flats in building:', buildingFlats)
        
        if (!buildingFlats || buildingFlats.length === 0) {
          throw new Error(`No flats have been created in building "${buildingData.name}" yet. Please contact building management to create flat ${data.unit_number} first.`)
        } else {
          const availableUnits = buildingFlats.map(f => f.unit_number).join(', ')
          throw new Error(`Flat ${data.unit_number} not found in building "${buildingData.name}". Available units: ${availableUnits}. Please contact building management.`)
        }
      }

      if (flatData.tenant_id) {
        throw new Error(`Flat ${data.unit_number} is already occupied by another tenant.`)
      }

      // Register the user as tenant of this flat
      const { error: updateError } = await supabase
        .from('flats')
        .update({ tenant_id: userId })
        .eq('id', flatData.id)

      if (updateError) {
        console.error('Update error:', updateError)
        throw updateError
      }

      console.log('Flat registered successfully')
      
      // Refresh user flats
      await fetchUserFlats()
      
      return { success: true, message: 'Flat registered successfully!' }
    } catch (error) {
      console.error('Error registering flat:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error registering flat'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  const unregisterFlat = async (flatId: string) => {
    try {
      console.log('Unregistering flat:', flatId)
      
      const { error } = await supabase
        .from('flats')
        .update({ tenant_id: null })
        .eq('id', flatId)

      if (error) throw error

      console.log('Flat unregistered successfully')
      
      // Refresh user flats
      await fetchUserFlats()
      
      return { success: true, message: 'Flat unregistered successfully!' }
    } catch (error) {
      console.error('Error unregistering flat:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error unregistering flat'
      throw new Error(errorMessage)
    }
  }

  // Auto-fetch when userId changes
  useEffect(() => {
    if (userId) {
      fetchUserFlats()
    }
  }, [userId, fetchUserFlats])

  return {
    userFlats,
    loading,
    error,
    fetchUserFlats,
    registerFlat,
    unregisterFlat
  }
}