// src/hooks/useUserFlats.ts - Cleaned version with proper error handling
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { createLogger } from '@/utils/logger'

const log = createLogger('useUserFlats')

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

type FlatsCache = {
  userId: string
  data: UserFlat[]
  timestamp: number
}

export const useUserFlats = (userId?: string) => {
  const [userFlats, setUserFlats] = useState<UserFlat[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Prevent multiple simultaneous fetches and cache results
  const fetchingRef = useRef(false)
  const cacheRef = useRef<FlatsCache | null>(null)
  const CACHE_DURATION = 30000 // 30 seconds

  const fetchUserFlats = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      log.debug('No userId provided, skipping fetch')
      return
    }

    // Check cache first
    const now = Date.now()
    if (!forceRefresh && cacheRef.current && 
        cacheRef.current.userId === userId &&
        (now - cacheRef.current.timestamp) < CACHE_DURATION) {
      log.debug('Using cached user flats data')
      setUserFlats(cacheRef.current.data)
      return
    }

    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      log.debug('Fetch already in progress, skipping')
      return
    }

    fetchingRef.current = true
    setLoading(true)
    setError(null)
    
    try {
      log.debug('Fetching user flats for:', userId)

      // Use a simpler approach - get flats first, then build the data manually
      const { data: flats, error: flatsError } = await supabase
        .from('flats')
        .select('id, unit_number, building_id')
        .eq('tenant_id', userId)

      if (flatsError) {
        log.error('Error fetching user flats:', flatsError)
        throw new Error(`Failed to fetch your flats: ${flatsError.message}`)
      }

      if (!flats || flats.length === 0) {
        log.debug('No flats found for user')
        const emptyResult: UserFlat[] = []
        setUserFlats(emptyResult)
        cacheRef.current = { userId, data: emptyResult, timestamp: now }
        return
      }

      log.debug(`Processing ${flats.length} user flats`)

      // Manually fetch building and address data for each flat
      const enrichedFlats: UserFlat[] = await Promise.all(
        flats.map(async (flat): Promise<UserFlat> => {
          try {
            // Get building data
            const { data: building, error: buildingError } = await supabase
              .from('buildings')
              .select('id, name, address')
              .eq('id', flat.building_id)
              .single()

            if (buildingError || !building) {
              log.warn('Could not fetch building for flat:', flat.id)
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
              log.warn('Could not fetch address for building:', building.id)
              return {
                id: flat.id,
                unit_number: flat.unit_number,
                building_name: building.name,
                building_id: flat.building_id,
                address_id: building.address,
                address_full: 'Unknown Address'
              }
            }

            // Build full address
            let fullAddress = address.street_and_number
            
            try {
              // Get settlement data
              const { data: settlement, error: settlementError } = await supabase
                .from('settlements')
                .select('name, settlement_type, municipality_id')
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
              log.warn('Could not fetch full location data:', locationError)
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
            log.error('Error processing flat:', flat.id, flatError)
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

      log.debug(`Successfully processed ${enrichedFlats.length} user flats`)
      setUserFlats(enrichedFlats)
      
      // Cache the results
      cacheRef.current = { userId, data: enrichedFlats, timestamp: now }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load your flats'
      log.error('Error fetching user flats:', error)
      setError(errorMessage)
      setUserFlats([])
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [userId])

  const registerFlat = async (data: FlatRegistrationData, userId: string) => {
    try {
      log.debug('Registering flat:', data.unit_number)

      // Validate input
      if (!data.settlement_id || !data.street_and_number || !data.unit_number) {
        throw new Error('Missing required registration data')
      }

      // Check if the address exists and is approved
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('id')
        .eq('settlement_id', data.settlement_id)
        .eq('street_and_number', data.street_and_number.trim())
        .eq('status', 'approved')
        .single()

      if (addressError || !addressData) {
        log.warn('Address not found or not approved:', addressError)
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
        log.warn('Building not found:', buildingError)
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
        .eq('unit_number', data.unit_number.trim())
        .single()

      if (flatError || !flatData) {
        log.warn('Flat not found:', flatError)
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
        log.error('Error creating registration request:', requestError)
        throw requestError
      }

      log.info('Registration request created successfully')

      return { 
        success: true, 
        message: 'Registration request submitted! Building manager will review it and you will be notified of the decision.' 
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error submitting registration request. Please try again.'
      log.error('Register flat failed:', errorMessage)
      return { 
        success: false, 
        message: errorMessage 
      }
    }
  }

  const unregisterFlat = async (flatId: string) => {
    try {
      log.debug('Unregistering from flat:', flatId)

      // Remove tenant from flat
      const { error } = await supabase
        .from('flats')
        .update({ tenant_id: null })
        .eq('id', flatId)

      if (error) {
        log.error('Error unregistering from flat:', error)
        throw new Error(`Failed to unregister: ${error.message}`)
      }

      log.info('Successfully unregistered from flat')
      
      // Clear cache and refresh flats list
      cacheRef.current = null
      await fetchUserFlats(true)

      return { 
        success: true, 
        message: 'Successfully unregistered from flat. The flat is now marked as vacant.' 
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error unregistering from flat. Please try again.'
      log.error('Unregister flat failed:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Fetch when userId changes
  useEffect(() => {
    if (userId) {
      fetchUserFlats()
    }
  }, [userId, fetchUserFlats])

  return {
    userFlats,
    loading,
    error,
    fetchUserFlats: () => fetchUserFlats(true),
    registerFlat,
    unregisterFlat
  }
}