// Fixed useFlatRequests.ts - Prevent multiple fetches and race conditions
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

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

export const useFlatRequests = (userId?: string, userRole?: string) => {
  const [requests, setRequests] = useState<FlatRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Use refs to prevent multiple simultaneous fetches
  const fetchingRef = useRef(false)
  const lastParamsRef = useRef<{ userId?: string; userRole?: string }>({})

  const fetchRequests = useCallback(async () => {
    if (!userId) {
      console.log('useFlatRequests: No userId provided, skipping fetch')
      return
    }

    // Prevent multiple simultaneous fetches for the same parameters
    const currentParams = { userId, userRole }
    if (fetchingRef.current && 
        lastParamsRef.current.userId === userId && 
        lastParamsRef.current.userRole === userRole) {
      console.log('useFlatRequests: Fetch already in progress for these params, skipping...')
      return
    }

    fetchingRef.current = true
    lastParamsRef.current = currentParams
    setLoading(true)
    setError(null)
    
    try {
      console.log('useFlatRequests: Fetching requests for user:', userId, 'with role:', userRole)

      // Simple query first - get raw requests
      let baseQuery = supabase
        .from('flat_registration_requests')
        .select('*')
        .order('requested_at', { ascending: false })

      // Filter based on user role
      if (userRole === 'user') {
        baseQuery = baseQuery.eq('user_id', userId)
        console.log('useFlatRequests: Filtering for user requests only')
      } else {
        console.log('useFlatRequests: Getting all requests (building manager/admin view)')
      }

      const { data: rawRequests, error: requestsError } = await baseQuery

      if (requestsError) {
        console.error('Requests query error:', requestsError)
        throw new Error(`Failed to fetch requests: ${requestsError.message || 'Unknown error'}`)
      }

      console.log('useFlatRequests: Raw requests fetched:', rawRequests?.length || 0, 'requests')

      if (!rawRequests || rawRequests.length === 0) {
        console.log('useFlatRequests: No requests found')
        setRequests([])
        return
      }

      // Manually fetch related data for each request - simplified approach
      const enrichedRequests = await Promise.all(
        rawRequests.map(async (request) => {
          try {
            console.log('useFlatRequests: Processing request:', request.id)

            // Initialize with defaults
            let unitNumber = 'Unknown'
            let buildingName = 'Unknown Building'
            let addressFull = 'Unknown Address'
            let userName = undefined
            let userEmail = 'Unknown Email'

            // Get flat data
            try {
              const { data: flatData, error: flatError } = await supabase
                .from('flats')
                .select('unit_number, building_id')
                .eq('id', request.flat_id)
                .single()

              if (!flatError && flatData) {
                unitNumber = flatData.unit_number
                console.log('useFlatRequests: Got flat data:', flatData)

                // Get building data
                if (flatData.building_id) {
                  const { data: buildingData, error: buildingError } = await supabase
                    .from('buildings')
                    .select('name, address')
                    .eq('id', flatData.building_id)
                    .single()

                  if (!buildingError && buildingData) {
                    buildingName = buildingData.name
                    console.log('useFlatRequests: Got building data:', buildingData)

                    // Get address data
                    if (buildingData.address) {
                      const { data: addressData, error: addressError } = await supabase
                        .from('addresses')
                        .select('street_and_number, settlement_id')
                        .eq('id', buildingData.address)
                        .single()

                      if (!addressError && addressData) {
                        // Start with street and number
                        addressFull = addressData.street_and_number

                        // Try to get full location data
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
                                addressFull = `${addressData.street_and_number}, ${settlement.name} ${settlement.settlement_type}, ${municipality.name}, ${county.name}`
                              }
                            }
                          }
                        } catch (locationErr) {
                          console.warn('useFlatRequests: Could not fetch full location:', locationErr)
                        }

                        console.log('useFlatRequests: Got address data, full address:', addressFull)
                      }
                    }
                  }
                }
              }
            } catch (flatErr) {
              console.warn('useFlatRequests: Error fetching flat data:', flatErr)
            }

            // Get user data
            if (request.user_id) {
              try {
                const { data: userData, error: userError } = await supabase
                  .from('profiles')
                  .select('full_name, email')
                  .eq('id', request.user_id)
                  .single()

                if (!userError && userData) {
                  userName = userData.full_name
                  userEmail = userData.email || userEmail
                  console.log('useFlatRequests: Got user data:', userData)
                }
              } catch (userErr) {
                console.warn('useFlatRequests: Error fetching user data:', userErr)
              }
            }

            return {
              id: request.id,
              flat_id: request.flat_id,
              user_id: request.user_id,
              status: request.status,
              requested_at: request.requested_at,
              reviewed_at: request.reviewed_at,
              reviewed_by: request.reviewed_by,
              notes: request.notes,
              unit_number: unitNumber,
              building_name: buildingName,
              address_full: addressFull,
              user_name: userName,
              user_email: userEmail
            }
          } catch (requestProcessingError) {
            console.error('useFlatRequests: Error processing individual request:', request.id, requestProcessingError)
            // Return a minimal request object even if processing fails
            return {
              id: request.id,
              flat_id: request.flat_id,
              user_id: request.user_id,
              status: request.status,
              requested_at: request.requested_at,
              reviewed_at: request.reviewed_at,
              reviewed_by: request.reviewed_by,
              notes: request.notes,
              unit_number: 'Error loading',
              building_name: 'Error loading',
              address_full: 'Error loading',
              user_name: undefined,
              user_email: 'Error loading'
            }
          }
        })
      )

      console.log('useFlatRequests: Successfully processed', enrichedRequests.length, 'requests')
      setRequests(enrichedRequests)
      
    } catch (error) {
      console.error('Error in fetchRequests:', error)
      
      let errorMessage = 'Failed to load registration requests'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      setRequests([])
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [userId, userRole])

  const createRequest = async (flatId: string, userId: string) => {
    try {
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

      if (error) throw error

      await fetchRequests()
      return { success: true, message: 'Registration request submitted! Building manager will review it.' }
    } catch (error) {
      console.error('Error creating request:', error)
      return { success: false, message: 'Error submitting request' }
    }
  }

  const approveRequest = async (requestId: string, notes?: string) => {
    try {
      // Get the request details
      const { data: request } = await supabase
        .from('flat_registration_requests')
        .select('flat_id, user_id')
        .eq('id', requestId)
        .single()

      if (!request) throw new Error('Request not found')

      // Update the flat to assign the tenant
      const { error: flatError } = await supabase
        .from('flats')
        .update({ tenant_id: request.user_id })
        .eq('id', request.flat_id)

      if (flatError) throw flatError

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

      if (requestError) throw requestError

      await fetchRequests()
      return { success: true, message: 'Request approved successfully!' }
    } catch (error) {
      console.error('Error approving request:', error)
      return { success: false, message: 'Error approving request' }
    }
  }

  const rejectRequest = async (requestId: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('flat_registration_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          notes
        })
        .eq('id', requestId)

      if (error) throw error

      await fetchRequests()
      return { success: true, message: 'Request rejected.' }
    } catch (error) {
      console.error('Error rejecting request:', error)
      return { success: false, message: 'Error rejecting request' }
    }
  }

  // Only fetch when userId or userRole changes
  useEffect(() => {
    if (userId && (userId !== lastParamsRef.current.userId || userRole !== lastParamsRef.current.userRole)) {
      console.log('useFlatRequests: Parameters changed, fetching requests...')
      fetchRequests()
    }
  }, [userId, userRole, fetchRequests])

  return {
    requests,
    loading,
    error,
    fetchRequests,
    createRequest,
    approveRequest,
    rejectRequest
  }
}