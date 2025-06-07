// src/hooks/useManagerStats.ts - Real-time statistics for building managers
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { createLogger } from '@/utils/logger'
import { CACHE_DURATION } from '@/utils/constants'

const log = createLogger('useManagerStats')

export interface ManagerStats {
  totalBuildings: number
  totalFlats: number
  occupiedFlats: number
  vacantFlats: number
  pendingRequests: number
}

type StatsCache = {
  managerId: string
  stats: ManagerStats
  timestamp: number
}

export const useManagerStats = (managerId?: string) => {
  const [stats, setStats] = useState<ManagerStats>({
    totalBuildings: 0,
    totalFlats: 0,
    occupiedFlats: 0,
    vacantFlats: 0,
    pendingRequests: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Cache and prevent multiple fetches
  const cacheRef = useRef<StatsCache | null>(null)
  const fetchingRef = useRef(false)

  const fetchStats = useCallback(async (forceRefresh = false) => {
    if (!managerId) {
      log.debug('No managerId provided, skipping fetch')
      return
    }

    // Check cache first
    const now = Date.now()
    if (!forceRefresh && cacheRef.current && 
        cacheRef.current.managerId === managerId &&
        (now - cacheRef.current.timestamp) < CACHE_DURATION.MEDIUM) {
      log.debug('Using cached stats data')
      setStats(cacheRef.current.stats)
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
      log.debug('Fetching stats for manager:', managerId)
      
      // Initialize stats
      const newStats: ManagerStats = {
        totalBuildings: 0,
        totalFlats: 0,
        occupiedFlats: 0,
        vacantFlats: 0,
        pendingRequests: 0
      }

      // 1. Get total buildings managed by this manager
      const { data: buildings, error: buildingsError } = await supabase
        .from('buildings')
        .select('id')
        .eq('manager_id', managerId)

      if (buildingsError) {
        throw new Error(`Failed to fetch buildings: ${buildingsError.message}`)
      }

      newStats.totalBuildings = buildings?.length || 0
      log.debug(`Found ${newStats.totalBuildings} buildings`)

      if (newStats.totalBuildings === 0) {
        // No buildings = no flats or requests
        setStats(newStats)
        cacheRef.current = { managerId, stats: newStats, timestamp: now }
        return
      }

      const buildingIds = buildings!.map(b => b.id)

      // 2. Get flat statistics for all buildings
      const { data: flats, error: flatsError } = await supabase
        .from('flats')
        .select('id, tenant_id')
        .in('building_id', buildingIds)

      if (flatsError) {
        log.warn('Error fetching flats:', flatsError)
        // Continue with building count only
      } else {
        newStats.totalFlats = flats?.length || 0
        newStats.occupiedFlats = flats?.filter(flat => flat.tenant_id).length || 0
        newStats.vacantFlats = newStats.totalFlats - newStats.occupiedFlats
        
        log.debug(`Flats: ${newStats.totalFlats} total, ${newStats.occupiedFlats} occupied, ${newStats.vacantFlats} vacant`)
      }

      // 3. Get pending registration requests for buildings managed by this manager
      if (flats && flats.length > 0) {
        const flatIds = flats.map(f => f.id)
        
        const { data: requests, error: requestsError } = await supabase
          .from('flat_registration_requests')
          .select('id')
          .in('flat_id', flatIds)
          .eq('status', 'pending')

        if (requestsError) {
          log.warn('Error fetching pending requests:', requestsError)
          // Continue without request count
        } else {
          newStats.pendingRequests = requests?.length || 0
          log.debug(`Found ${newStats.pendingRequests} pending requests`)
        }
      }

      log.debug('Final stats:', newStats)
      setStats(newStats)
      
      // Cache the results
      cacheRef.current = { managerId, stats: newStats, timestamp: now }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load statistics'
      log.error('Error fetching stats:', error)
      setError(errorMessage)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [managerId])

  // Auto-refresh stats periodically
  useEffect(() => {
    if (!managerId) return

    // Initial fetch
    fetchStats()

    // Set up periodic refresh every 2 minutes
    const interval = setInterval(() => {
      log.debug('Auto-refreshing stats')
      fetchStats(true)
    }, 2 * 60 * 1000) // 2 minutes

    return () => clearInterval(interval)
  }, [managerId, fetchStats])

  // Manual refresh function
  const refreshStats = useCallback(() => {
    fetchStats(true)
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refreshStats
  }
}