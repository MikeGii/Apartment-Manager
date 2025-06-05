// src/hooks/useUserFlats.ts
"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type UserFlat = {
  id: string
  unit_number: string
  building_name: string
  address_full: string
  building_id: string
  address_id: string
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
      console.log('Fetching user flats for:', userId)

      // Get flats where the user is the tenant - simplified approach
      const { data: flats, error: flatsError } = await supabase
        .from('flats')
        .select('id, unit_number, building_id')
        .eq('tenant_id', userId)

      if (flatsError) {
        console.error('Error fetching user flats:', flatsError)
        throw flatsError
      }

      console.log('Raw flats data:', flats)

      if (!flats || flats.length === 0) {
        console.log('No flats found for user')
        setUserFlats([])
        return
      }

      // Manually fetch building and address data for each flat
      const enrichedFlats = await Promise.all(
        flats.map(async (flat) => {
          try {
            // Get building data
            const { data: building, error: buildingError } = await supabase
              .from('buildings')
              .select('id, name, address')
              .eq('id', flat.building_id)
              .single()

            if (buildingError || !building) {
              console.warn('Could not fetch building for flat:', flat.id)
              return {
                id: flat.id,
                unit_number: flat.unit_number,
                building_name: 'Unknown Building',
                building_id: flat.building_id,
                address_id: '',
                address_full: 'Unknown Address'
              }
            }

            // Get address data
            const { data: address, error: addressError } = await supabase
              .from('addresses')
              .select('id, street_and_number, settlement_id')
              .eq('id', building.address)
              .single()

            if (addressError || !address) {
              console.warn('Could not fetch address for building:', building.id)
              return {
                id: flat.id,
                unit_number: flat.unit_number,
                building_name: building.name,
                building_id: flat.building_id,
                address_id: building.address,
                address_full: 'Unknown Address'
              }
            }

            // Get settlement data
            let fullAddress = address.street_and_number
            try {
              const { data: settlement, error: settlementError } = await supabase
                .from('settlements')
                .select(`
                  name,
                  settlement_type,
                  municipality_id
                `)
                .eq('id', address.settlement_id)
                .single()

              if (!settlementError && settlement) {
                // Get municipality data
                const { data: municipality, error: municipalityError } = await supabase
                  .from('municipalities')
                  .select('name, county_id')
                  .eq('id', settlement.municipality_id)
                  .single()

                if (!municipalityError && municipality) {
                  // Get county data
                  const { data: county, error: countyError } = await supabase
                    .from('counties')
                    .select('name')
                    .eq('id', municipality.county_id)
                    .single()

                  if (!countyError && county) {
                    fullAddress = `${address.street_and_number}, ${settlement.name} ${settlement.settlement_type}, ${municipality.name}, ${county.name}`
                  }
                }
              }
            } catch (locationError) {
              console.warn('Could not fetch full location data:', locationError)
            }

            return {
              id: flat.id,
              unit_number: flat.unit_number,
              building_name: building.name,
              building_id: flat.building_id,
              address_id: building.address,
              address_full: fullAddress
            }
          } catch (flatError) {
            console.error('Error processing flat:', flat.id, flatError)
            return {
              id: flat.id,
              unit_number: flat.unit_number,
              building_name: 'Error Loading',
              building_id: flat.building_id,
              address_id: '',
              address_full: 'Error Loading'
            }
          }
        })
      )

      console.log('Enriched user flats:', enrichedFlats)
      setUserFlats(enrichedFlats)
    } catch (error) {
      console.error('Error fetching user flats:', error)
      let errorMessage = 'Failed to load your flats'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      setUserFlats([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  const registerFlat = async (data: FlatRegistrationData, userId: string) => {
    try {
      console.log('Registering flat with data:', data)

      // First, check if the address exists and is approved
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('id')
        .eq('settlement_id', data.settlement_id)
        .eq('street_and_number', data.street_and_number)
        .eq('status', 'approved')
        .single()

      if (addressError || !addressData) {
        console.error('Address not found or not approved:', addressError)
        return { 
          success: false, 
          message: 'Address not found or not approved. Please ensure the building address has been registered and approved by administration.' 
        }
      }

      // Find the building for this address
      const { data: buildingData, error: buildingError } = await supabase
        .from('buildings')
        .select('id')
        .eq('address', addressData.id)
        .single()

      if (buildingError || !buildingData) {
        console.error('Building not found:', buildingError)
        return { 
          success: false, 
          message: 'Building not found. Please contact building management to set up the building first.' 
        }
      }

      // Find the specific flat
      const { data: flatData, error: flatError } = await supabase
        .from('flats')
        .select('id, tenant_id')
        .eq('building_id', buildingData.id)
        .eq('unit_number', data.unit_number)
        .single()

      if (flatError || !flatData) {
        console.error('Flat not found:', flatError)
        return { 
          success: false, 
          message: `Flat ${data.unit_number} not found in this building. Please contact building management to add this flat first.` 
        }
      }

      if (flatData.tenant_id) {
        return { 
          success: false, 
          message: 'This flat is already occupied by another tenant.' 
        }
      }

      // Check if user already has a pending request for this flat
      const { data: existingRequest } = await supabase
        .from('flat_registration_requests')
        .select('id')
        .eq('flat_id', flatData.id)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single()

      if (existingRequest) {
        return { 
          success: false, 
          message: 'You already have a pending request for this flat.' 
        }
      }

      // Create a registration request
      const { error: requestError } = await supabase
        .from('flat_registration_requests')
        .insert({
          flat_id: flatData.id,
          user_id: userId
        })

      if (requestError) {
        console.error('Error creating registration request:', requestError)
        throw requestError
      }

      return { 
        success: true, 
        message: 'Registration request submitted! Building manager will review it and you will be notified of the decision.' 
      }
    } catch (error) {
      console.error('Error registering flat:', error)
      return { 
        success: false, 
        message: 'Error submitting registration request. Please try again.' 
      }
    }
  }

  const unregisterFlat = async (flatId: string) => {
    try {
      console.log('Unregistering from flat:', flatId)

      // Remove tenant from flat
      const { error } = await supabase
        .from('flats')
        .update({ tenant_id: null })
        .eq('id', flatId)

      if (error) {
        console.error('Error unregistering from flat:', error)
        throw error
      }

      // Refresh flats list
      await fetchUserFlats()

      return { 
        success: true, 
        message: 'Successfully unregistered from flat. The flat is now marked as vacant.' 
      }
    } catch (error) {
      console.error('Error unregistering from flat:', error)
      throw new Error('Error unregistering from flat. Please try again.')
    }
  }

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