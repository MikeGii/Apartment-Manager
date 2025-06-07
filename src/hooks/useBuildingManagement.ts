// src/hooks/useBuildingManagement.ts - Fixed version with numerical sorting
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { createLogger } from '@/utils/logger'
import { sortUnitNumbers } from '@/utils/sorting'
import { CACHE_DURATION, DATABASE_COLUMNS } from '@/utils/constants'

const log = createLogger('useBuildingManagement')

export type BuildingOverview = {
  id: string
  name: string
  address_id: string
  address_full: string
  street_and_number: string
  total_flats: number
  occupied_flats: number
  vacant_flats: number
  linked_accountant?: {
    id: string
    name: string
    email: string
  }
}

export type FlatDetail = {
  id: string
  unit_number: string
  tenant_id: string | null
  tenant_name?: string
  tenant_email?: string
  tenant_phone?: string
}

type BuildingCache = {
  managerId: string
  buildings: BuildingOverview[]
  timestamp: number
}

type FlatsCache = {
  buildingId: string
  flats: FlatDetail[]
  timestamp: number
}

export const useBuildingManagement = (managerId?: string) => {
  const [buildings, setBuildings] = useState<BuildingOverview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Cache for buildings and flats
  const buildingCacheRef = useRef<BuildingCache | null>(null)
  const flatsCacheRef = useRef<Map<string, FlatsCache>>(new Map())
  const fetchingRef = useRef(false)

  const sortUnitNumbers = <T extends { unit_number: string }>(items: T[]): T[] => {
  return items.sort((a, b) => {
    const aNum = a.unit_number
    const bNum = b.unit_number
    
    const aNumeric = parseInt(aNum.match(/^\d+/)?.[0] || '0')
    const bNumeric = parseInt(bNum.match(/^\d+/)?.[0] || '0')
    
    if (aNumeric !== bNumeric) {
      return aNumeric - bNumeric
    }
    
    return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' })
  })
  }

  const fetchBuildings = useCallback(async (forceRefresh = false) => {
    if (!managerId) {
      log.debug('No managerId provided, skipping fetch')
      return
    }

    // Check cache first (unless force refresh)
    const now = Date.now()
    if (!forceRefresh && buildingCacheRef.current && 
        buildingCacheRef.current.managerId === managerId &&
        (now - buildingCacheRef.current.timestamp) < CACHE_DURATION.MEDIUM) {
      log.debug('Using cached buildings data')
      setBuildings(buildingCacheRef.current.buildings)
      return
    }

    if (fetchingRef.current) {
      log.debug('Fetch already in progress, skipping')
      return
    }

    fetchingRef.current = true
    setLoading(true)
    setError(null)
    
    try {
      log.debug('Fetching buildings for manager:', managerId)
      
      // Get buildings managed by this manager
      const { data: buildingsData, error: buildingsError } = await supabase
        .from(DATABASE_COLUMNS.BUILDINGS_TABLE)
        .select('id, name, address, manager_id')
        .eq('manager_id', managerId)

      if (buildingsError) {
        throw new Error(`Failed to fetch buildings: ${buildingsError.message}`)
      }

      if (!buildingsData || buildingsData.length === 0) {
        log.debug('No buildings found for manager')
        const emptyResult: BuildingOverview[] = []
        setBuildings(emptyResult)
        buildingCacheRef.current = { managerId, buildings: emptyResult, timestamp: now }
        return
      }

      log.debug(`Processing ${buildingsData.length} buildings`)

      // Process each building to get flat statistics and address details
      const enrichedBuildings = await Promise.all(
        buildingsData.map(async (building): Promise<BuildingOverview> => {
          try {
            // Get flat statistics for this building
            const { data: flats, error: flatsError } = await supabase
              .from(DATABASE_COLUMNS.FLATS_TABLE)
              .select('id, tenant_id')
              .eq('building_id', building.id)

            let totalFlats = 0
            let occupiedFlats = 0
            let vacantFlats = 0

            if (!flatsError && flats) {
              totalFlats = flats.length
              occupiedFlats = flats.filter(flat => flat.tenant_id).length
              vacantFlats = totalFlats - occupiedFlats
            }

            // Get address details
            let fullAddress = 'Unknown Address'
            let streetAndNumber = 'Unknown'

            try {
              const { data: addressData, error: addressError } = await supabase
                .from(DATABASE_COLUMNS.ADDRESSES_TABLE)
                .select('id, street_and_number, settlement_id')
                .eq('id', building.address)
                .single()

              if (!addressError && addressData) {
                streetAndNumber = addressData.street_and_number
                fullAddress = addressData.street_and_number

                // Get full location details
                const { data: locationData, error: locationError } = await supabase
                  .from('settlements')
                  .select(`
                    name,
                    settlement_type,
                    municipalities (
                      name,
                      counties (
                        name
                      )
                    )
                  `)
                  .eq('id', addressData.settlement_id)
                  .single()

                if (!locationError && locationData) {
                  const municipality = locationData.municipalities?.[0]
                  const county = municipality?.counties?.[0]
                  
                  if (municipality && county) {
                    fullAddress = `${addressData.street_and_number}, ${locationData.name} ${locationData.settlement_type}, ${municipality.name}, ${county.name}`
                  }
                }
              }
            } catch (addressError) {
              log.warn('Could not fetch address for building:', building.id)
            }

            return {
              id: building.id,
              name: building.name,
              address_id: building.address,
              address_full: fullAddress,
              street_and_number: streetAndNumber,
              total_flats: totalFlats,
              occupied_flats: occupiedFlats,
              vacant_flats: vacantFlats,
              // linked_accountant: undefined // TODO: Implement accountant linking
            }
          } catch (processingError) {
            log.error('Error processing building:', building.id, processingError)
            return {
              id: building.id,
              name: building.name || 'Unknown Building',
              address_id: building.address || '',
              address_full: 'Error loading address',
              street_and_number: 'Error',
              total_flats: 0,
              occupied_flats: 0,
              vacant_flats: 0,
            }
          }
        })
      )

      log.debug(`Successfully processed ${enrichedBuildings.length} buildings`)
      setBuildings(enrichedBuildings)
      
      // Cache the results
      buildingCacheRef.current = { managerId, buildings: enrichedBuildings, timestamp: now }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load buildings'
      log.error('Error fetching buildings:', error)
      setError(errorMessage)
      setBuildings([])
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [managerId])

  const fetchBuildingFlats = useCallback(async (buildingId: string, forceRefresh = false): Promise<FlatDetail[]> => {
    if (!buildingId) {
      log.debug('No buildingId provided')
      return []
    }

    // Check cache first (unless force refresh)
    const now = Date.now()
    const cachedFlats = flatsCacheRef.current.get(buildingId)
    if (!forceRefresh && cachedFlats && (now - cachedFlats.timestamp) < CACHE_DURATION.MEDIUM) {
      log.debug('Using cached flats data for building:', buildingId)
      return cachedFlats.flats
    }

    try {
      log.debug('Fetching flats for building:', buildingId)
      
      const { data: flats, error: flatsError } = await supabase
        .from(DATABASE_COLUMNS.FLATS_TABLE)
        .select(`
          id,
          unit_number,
          tenant_id,
          profiles (
            full_name,
            email,
            phone
          )
        `)
        .eq('building_id', buildingId)

      if (flatsError) {
        throw new Error(`Failed to fetch flats: ${flatsError.message}`)
      }

      // Transform the data
      const flatsWithTenants: FlatDetail[] = (flats || []).map((flat: any) => ({
        id: flat.id,
        unit_number: flat.unit_number,
        tenant_id: flat.tenant_id,
        tenant_name: flat.profiles?.full_name || undefined,
        tenant_email: flat.profiles?.email || undefined,
        tenant_phone: flat.profiles?.phone || undefined,
      }))

      // FIXED: Apply numerical sorting instead of SQL ordering
      const sortedFlats = sortUnitNumbers(flatsWithTenants)

      log.debug(`Fetched ${sortedFlats.length} flats for building ${buildingId}`)
      
      // Cache the results
      flatsCacheRef.current.set(buildingId, {
        buildingId,
        flats: sortedFlats,
        timestamp: now
      })
      
      return sortedFlats
    } catch (error) {
      log.error('Error fetching building flats:', error)
      return []
    }
  }, [])

  const clearCache = useCallback(() => {
    log.debug('Clearing all cache data')
    buildingCacheRef.current = null
    flatsCacheRef.current.clear()
  }, [])

  const clearBuildingFlatsCache = useCallback((buildingId: string) => {
    log.debug('Clearing flats cache for building:', buildingId)
    flatsCacheRef.current.delete(buildingId)
  }, [])

  // Fetch buildings when managerId changes
  useEffect(() => {
    if (managerId) {
      fetchBuildings()
    }
  }, [managerId, fetchBuildings])

  return {
    buildings,
    loading,
    error,
    fetchBuildings: () => fetchBuildings(true),
    fetchBuildingFlats,
    clearCache,
    clearBuildingFlatsCache
  }
}