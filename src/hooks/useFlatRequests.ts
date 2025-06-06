// src/hooks/useFlatRequests.ts - Cleaned version with proper error handling
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { createLogger } from '@/utils/logger'

const log = createLogger('useFlatRequests')

export type FlatRequest = {
  id: string
  flat_id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  reviewed_at?: string
  reviewed_by?: string
  notes?: string
  // Joined data
  unit_number: string
  building_name: string
  address_full: string
  user_name?: string
  user_email: string
}

type RequestsCache = {
  userId?: string
  userRole?: string
  data: FlatRequest[]
  timestamp: number
}

export const useFlatRequests = (userId?: string, userRole?: string) => {
  const [requests, setRequests] = useState<FlatRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Prevent multiple simultaneous fetches and cache results
  const fetchingRef = useRef(false)
  const cacheRef = useRef<RequestsCache | null>(null)
  const CACHE_DURATION = 30000 // 30 seconds

  const fetchRequests = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      log.debug('No userId provided, skipping fetch')
      return
    }

    // Check cache first
    const now = Date.now()
    if (!forceRefresh && cacheRef.current && 
        cacheRef.current.userId === userId && 
        cacheRef.current.userRole === userRole &&
        (now - cacheRef.current.timestamp) < CACHE_DURATION) {
      log.debug('Using cached requests data')
      setRequests(cacheRef.current.data)
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
      log.debug('Fetching requests for user:', userId, 'with role:', userRole)

      // Build base query
      let baseQuery = supabase
        .from('flat_registration_requests')
        .select('*')
        .order('requested_at', { ascending: false })

      // Filter based on user role
      if (userRole === 'user') {
        baseQuery = baseQuery.eq('user_id', userId)
        log.debug('Filtering for user requests only')
      }

      const { data: rawRequests, error: requestsError } = await baseQuery

      if (requestsError) {
        throw new Error(`Failed to fetch requests: ${requestsError.message}`)
      }

      if (!rawRequests || rawRequests.length === 0) {
        log.debug('No requests found')
        const emptyResult: FlatRequest[] = []
        setRequests(emptyResult)
        cacheRef.current = { userId, userRole, data: emptyResult, timestamp: now }
        return
      }

      log.debug(`Processing ${rawRequests.length} requests`)

      // Enrich requests with related data
      const enrichedRequests = await Promise.all(
        rawRequests.map(async (request): Promise<FlatRequest> => {
          const result: FlatRequest = {
            id: request.id,
            flat_id: request.flat_id,
            user_id: request.user_id,
            status: request.status,
            requested_at: request.requested_at,
            reviewed_at: request.reviewed_at,
            reviewed_by: request.reviewed_by,
            notes: request.notes,
            unit_number: 'Loading...',
            building_name: 'Loading...',
            address_full: 'Loading...',
            user_name: undefined,
            user_email: 'Loading...'
          }

          try {
            // Get flat and building data in one go with proper typing
            const { data: flatData, error: flatError } = await supabase
              .from('flats')
              .select(`
                unit_number,
                buildings (
                  name,
                  addresses (
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
              .eq('id', request.flat_id)
              .single()

            if (!flatError && flatData) {
              result.unit_number = flatData.unit_number
              
              // Type the building data properly
              const building = flatData.buildings as any
              if (building) {
                result.building_name = building.name
                
                // Type the address data properly
                const address = building.addresses as any
                if (address) {
                  const settlement = address.settlements as any
                  const municipality = settlement?.municipalities as any
                  const county = municipality?.[0]?.counties as any
                  
                  if (settlement && municipality && county) {
                    result.address_full = `${address.street_and_number}, ${settlement.name} ${settlement.settlement_type}, ${municipality[0].name}, ${county[0].name}`
                  } else {
                    result.address_full = address.street_and_number
                  }
                }
              }
            } else {
              log.warn('Could not fetch flat data for request:', request.id)
              result.unit_number = 'Unknown'
              result.building_name = 'Unknown'
              result.address_full = 'Unknown'
            }

            // Get user data
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', request.user_id)
              .single()

            if (!userError && userData) {
              result.user_name = userData.full_name
              result.user_email = userData.email
            } else {
              log.warn('Could not fetch user data for request:', request.id)
              result.user_email = 'Unknown'
            }

          } catch (processingError) {
            log.error('Error processing request:', request.id, processingError)
            result.unit_number = 'Error'
            result.building_name = 'Error'
            result.address_full = 'Error'
            result.user_email = 'Error'
          }

          return result
        })
      )

      log.debug(`Successfully processed ${enrichedRequests.length} requests`)
      setRequests(enrichedRequests)
      
      // Cache the results
      cacheRef.current = { userId, userRole, data: enrichedRequests, timestamp: now }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load registration requests'
      log.error('Error in fetchRequests:', error)
      setError(errorMessage)
      setRequests([])
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [userId, userRole])

  const createRequest = async (flatId: string, userId: string) => {
    try {
      log.debug('Creating request for flat:', flatId)
      
      // Check if request already exists
      const { data: existing } = await supabase
        .from('flat_registration_requests')
        .select('id')
        .eq('flat_id', flatId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single()

      if (existing) {
        return { success: false, message: 'You already have a pending request for this flat.' }
      }

      const { error } = await supabase
        .from('flat_registration_requests')
        .insert({
          flat_id: flatId,
          user_id: userId
        })

      if (error) {
        log.error('Error creating request:', error)
        throw error
      }

      log.info('Request created successfully')
      
      // Clear cache and refresh
      cacheRef.current = null
      await fetchRequests(true)
      
      return { success: true, message: 'Registration request submitted! Building manager will review it.' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error submitting request'
      log.error('Create request failed:', errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  const approveRequest = async (requestId: string, notes?: string) => {
    try {
      log.debug('Approving request:', requestId)
      
      // Get the request details
      const { data: request } = await supabase
        .from('flat_registration_requests')
        .select('flat_id, user_id')
        .eq('id', requestId)
        .single()

      if (!request) {
        throw new Error('Request not found')
      }

      // Update the flat to assign the tenant
      const { error: flatError } = await supabase
        .from('flats')
        .update({ tenant_id: request.user_id })
        .eq('id', request.flat_id)

      if (flatError) {
        log.error('Error updating flat:', flatError)
        throw flatError
      }

      // Update the request status
      const { error: requestError } = await supabase
        .from('flat_registration_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          notes
        })
        .eq('id', requestId)

      if (requestError) {
        log.error('Error updating request:', requestError)
        throw requestError
      }

      log.info('Request approved successfully')
      
      // Clear cache and refresh
      cacheRef.current = null
      await fetchRequests(true)
      
      return { success: true, message: 'Request approved successfully!' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error approving request'
      log.error('Approve request failed:', errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  const rejectRequest = async (requestId: string, notes?: string) => {
    try {
      log.debug('Rejecting request:', requestId)
      
      const { error } = await supabase
        .from('flat_registration_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          notes
        })
        .eq('id', requestId)

      if (error) {
        log.error('Error rejecting request:', error)
        throw error
      }

      log.info('Request rejected successfully')
      
      // Clear cache and refresh
      cacheRef.current = null
      await fetchRequests(true)
      
      return { success: true, message: 'Request rejected.' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error rejecting request'
      log.error('Reject request failed:', errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  // Fetch when parameters change
  useEffect(() => {
    if (userId) {
      fetchRequests()
    }
  }, [userId, userRole, fetchRequests])

  return {
    requests,
    loading,
    error,
    fetchRequests: () => fetchRequests(true),
    createRequest,
    approveRequest,
    rejectRequest
  }
}