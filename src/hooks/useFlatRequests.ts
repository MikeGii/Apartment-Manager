// src/hooks/useFlatRequests.ts - Enhanced with Error Handling System
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { createLogger } from '@/utils/logger'
import { 
  errorHandler, 
  withRetry, 
  throwValidationError,
  throwNotFoundError,
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError
} from '@/utils/errors'
import { useToast } from '@/components/ui/Toast'

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
  user_phone?: string
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
  
  // Prevent multiple simultaneous fetches and cache results
  const fetchingRef = useRef(false)
  const cacheRef = useRef<RequestsCache | null>(null)
  const CACHE_DURATION = 30000 // 30 seconds

  // Toast notifications
  const { success, error: showError, info } = useToast()

  // Enhanced error handling wrapper
  const handleOperation = async <T>(
    operation: () => Promise<T>,
    operationName: string,
    showToast: boolean = true
  ): Promise<{ data?: T; error?: AppError }> => {
    try {
      const data = await operation()
      return { data }
    } catch (error) {
      const appError = errorHandler.handleError(error, operationName)
      errorHandler.reportError(appError)
      
      // Show toast notification
      if (showToast) {
        if (appError instanceof ValidationError) {
          showError('Invalid Input', appError.message)
        } else if (appError instanceof NotFoundError) {
          showError('Not Found', appError.message)
        } else if (appError instanceof ConflictError) {
          showError('Conflict', appError.message)
        } else if (appError.statusCode >= 500) {
          showError(
            'System Error',
            'Something went wrong on our end. Please try again.',
            {
              action: {
                label: 'Retry',
                onClick: () => window.location.reload()
              }
            }
          )
        } else {
          showError('Error', appError.message)
        }
      }
      
      return { error: appError }
    }
  }

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
    
    const { data, error } = await handleOperation(async () => {
      return await withRetry(async () => {
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
          throw errorHandler.parseSupabaseError(requestsError)
        }

        if (!rawRequests || rawRequests.length === 0) {
          log.debug('No requests found')
          return []
        }

        log.debug(`Processing ${rawRequests.length} requests`)

        // Process each request and enrich with data using manual joins
        const enrichedRequests = await Promise.all(
          rawRequests.map(async (request): Promise<FlatRequest | null> => {
            const result: FlatRequest = {
              id: request.id,
              flat_id: request.flat_id,
              user_id: request.user_id,
              status: request.status,
              requested_at: request.requested_at,
              reviewed_at: request.reviewed_at,
              reviewed_by: request.reviewed_by,
              notes: request.notes,
              unit_number: 'Unknown',
              building_name: 'Unknown',
              address_full: 'Unknown',
              user_name: undefined,
              user_email: 'Unknown',
              user_phone: undefined
            }

            try {
              // Step 1: Get flat data
              const { data: flatData, error: flatError } = await supabase
                .from('flats')
                .select('unit_number, building_id')
                .eq('id', request.flat_id)
                .single()

              if (flatError || !flatData) {
                log.warn(`Could not fetch flat data for request: ${request.id}`, flatError)
                return result // Return with "Unknown" values
              }

              result.unit_number = flatData.unit_number

              // Step 2: Get building data
              const { data: buildingData, error: buildingError } = await supabase
                .from('buildings')
                .select('name, address, manager_id')
                .eq('id', flatData.building_id)
                .single()

              if (buildingError || !buildingData) {
                log.warn(`Could not fetch building data for flat: ${flatData.building_id}`, buildingError)
                return result // Return with partial data
              }

              result.building_name = buildingData.name

              // For building managers, filter out requests for buildings they don't manage
              if (userRole === 'building_manager' && buildingData.manager_id !== userId) {
                return null // Filter out this request
              }

              // Step 3: Get address data and build full address
              const { data: addressData, error: addressError } = await supabase
                .from('addresses')
                .select('street_and_number, settlement_id')
                .eq('id', buildingData.address)
                .single()

              if (addressError || !addressData) {
                log.warn(`Could not fetch address data for building: ${buildingData.address}`, addressError)
                result.address_full = 'Address not found'
              } else {
                // Build full address with location hierarchy
                try {
                  const { data: settlement, error: settlementError } = await supabase
                    .from('settlements')
                    .select('name, settlement_type, municipality_id')
                    .eq('id', addressData.settlement_id)
                    .single()

                  if (!settlementError && settlement) {
                    const { data: municipality, error: municipalityError } = await supabase
                      .from('municipalities')
                      .select('name, county_id')
                      .eq('id', settlement.municipality_id)
                      .single()

                    if (!municipalityError && municipality) {
                      const { data: county, error: countyError } = await supabase
                        .from('counties')
                        .select('name')
                        .eq('id', municipality.county_id)
                        .single()

                      if (!countyError && county) {
                        result.address_full = `${addressData.street_and_number}, ${settlement.name} ${settlement.settlement_type}, ${municipality.name}, ${county.name}`
                      } else {
                        result.address_full = `${addressData.street_and_number}, ${settlement.name} ${settlement.settlement_type}, ${municipality.name}`
                      }
                    } else {
                      result.address_full = `${addressData.street_and_number}, ${settlement.name} ${settlement.settlement_type}`
                    }
                  } else {
                    result.address_full = addressData.street_and_number
                  }
                } catch (locationError) {
                  log.warn('Error building full address:', locationError)
                  result.address_full = addressData.street_and_number
                }
              }

              // Step 4: Get user data
              const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('full_name, email, phone')
                .eq('id', request.user_id)
                .single()

              if (!userError && userData) {
                result.user_name = userData.full_name
                result.user_email = userData.email
                result.user_phone = userData.phone
              } else {
                log.warn(`Could not fetch user data for request: ${request.id}`, userError)
                result.user_email = 'Unknown'
              }

              return result

            } catch (processingError) {
              log.error('Error processing request:', request.id, processingError)
              return result // Return with default "Unknown" values
            }
          })
        )

        // Filter out null results (building manager requests for other buildings)
        const validRequests = enrichedRequests.filter((req): req is FlatRequest => req !== null)

        log.debug(`Successfully processed ${validRequests.length} requests`)
        return validRequests
      })
    }, 'fetchRequests', false) // Don't show toast for fetch operations

    if (data) {
      setRequests(data)
      
      // Cache the results
      cacheRef.current = { userId, userRole, data, timestamp: now }
    }

    setLoading(false)
    fetchingRef.current = false
  }, [userId, userRole, handleOperation])

  const createRequest = async (flatId: string, userId: string) => {
    // Input validation
    if (!flatId?.trim()) {
      throwValidationError('Flat ID')
    }
    if (!userId?.trim()) {
      throwValidationError('User ID')
    }

    const { data, error } = await handleOperation(async () => {
      return await withRetry(async () => {
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
          throw new ConflictError('You already have a pending request for this flat.')
        }

        const { error } = await supabase
          .from('flat_registration_requests')
          .insert({
            flat_id: flatId,
            user_id: userId
          })

        if (error) {
          throw errorHandler.parseSupabaseError(error)
        }

        log.info('Request created successfully')
        
        // Clear cache and refresh
        cacheRef.current = null
        await fetchRequests(true)
        
        return { 
          success: true, 
          message: 'Registration request submitted! Building manager will review it.' 
        }
      })
    }, 'createRequest')

    if (data) {
      success('Request Submitted', 'Building manager will review your request')
      return data
    } else {
      return { 
        success: false, 
        message: error?.message || 'Failed to submit request' 
      }
    }
  }

  const approveRequest = async (requestId: string, notes?: string) => {
    // Input validation
    if (!requestId?.trim()) {
      throwValidationError('Request ID')
    }

    const { data, error } = await handleOperation(async () => {
      return await withRetry(async () => {
        log.debug('Approving request:', requestId)
        
        // Get the request details
        const { data: request, error: requestFetchError } = await supabase
          .from('flat_registration_requests')
          .select('flat_id, user_id')
          .eq('id', requestId)
          .single()

        if (requestFetchError) {
          if (requestFetchError.code === 'PGRST116') {
            throwNotFoundError('Request')
          }
          throw errorHandler.parseSupabaseError(requestFetchError)
        }

        // Update the flat to assign the tenant
        const { error: flatError } = await supabase
          .from('flats')
          .update({ tenant_id: request.user_id })
          .eq('id', request.flat_id)

        if (flatError) {
          throw errorHandler.parseSupabaseError(flatError)
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
          throw errorHandler.parseSupabaseError(requestError)
        }

        log.info('Request approved successfully')
        
        // Clear cache and refresh
        cacheRef.current = null
        await fetchRequests(true)
        
        return { 
          success: true, 
          message: 'Request approved successfully!' 
        }
      })
    }, 'approveRequest')

    if (data) {
      success('Request Approved', 'Tenant has been assigned to the flat')
      return data
    } else {
      return { 
        success: false, 
        message: error?.message || 'Failed to approve request' 
      }
    }
  }

  const rejectRequest = async (requestId: string, notes?: string) => {
    // Input validation
    if (!requestId?.trim()) {
      throwValidationError('Request ID')
    }
    if (!notes?.trim()) {
      throwValidationError('Rejection reason')
    }

    const { data, error } = await handleOperation(async () => {
      return await withRetry(async () => {
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
          throw errorHandler.parseSupabaseError(error)
        }

        log.info('Request rejected successfully')
        
        // Clear cache and refresh
        cacheRef.current = null
        await fetchRequests(true)
        
        return { 
          success: true, 
          message: 'Request rejected.' 
        }
      })
    }, 'rejectRequest')

    if (data) {
      info('Request Rejected', 'The applicant has been notified')
      return data
    } else {
      return { 
        success: false, 
        message: error?.message || 'Failed to reject request' 
      }
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
    fetchRequests: () => fetchRequests(true),
    createRequest,
    approveRequest,
    rejectRequest,
    // Helper to clear cache
    clearCache: () => {
      cacheRef.current = null
    }
  }
}