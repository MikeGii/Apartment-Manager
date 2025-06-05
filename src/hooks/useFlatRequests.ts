// src/hooks/useFlatRequests.ts
"use client"

import { useState, useEffect, useCallback } from 'react'
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

  const fetchRequests = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from('flat_registration_requests')
        .select(`
          id,
          flat_id,
          user_id,
          status,
          requested_at,
          reviewed_at,
          reviewed_by,
          notes,
          flats!inner (
            unit_number,
            buildings!inner (
              name,
              address,
              addresses!inner (
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
          ),
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('requested_at', { ascending: false })

      // Filter based on user role
      if (userRole === 'user') {
        query = query.eq('user_id', userId)
      }
      // Building managers and admins see requests for their buildings (handled by RLS)

      const { data, error } = await query

      if (error) throw error

      // Transform the data
      const transformedRequests = (data || []).map((request: any) => {
        const flat = request.flats
        const building = flat?.buildings
        const address = building?.addresses
        const settlement = address?.settlements
        const municipality = settlement?.municipalities?.[0]
        const county = municipality?.counties?.[0]
        const user = request.profiles
        
        return {
          id: request.id,
          flat_id: request.flat_id,
          user_id: request.user_id,
          status: request.status,
          requested_at: request.requested_at,
          reviewed_at: request.reviewed_at,
          reviewed_by: request.reviewed_by,
          notes: request.notes,
          unit_number: flat?.unit_number || 'Unknown',
          building_name: building?.name || 'Unknown Building',
          address_full: settlement 
            ? `${address.street_and_number}, ${settlement.name} ${settlement.settlement_type}, ${municipality.name}, ${county.name}`
            : address?.street_and_number || 'Unknown Address',
          user_name: user?.full_name,
          user_email: user?.email || 'Unknown Email'
        }
      })

      setRequests(transformedRequests)
    } catch (error) {
      console.error('Error fetching requests:', error)
      setError('Failed to load registration requests')
      setRequests([])
    } finally {
      setLoading(false)
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

  useEffect(() => {
    if (userId) {
      fetchRequests()
    }
  }, [userId, fetchRequests])

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