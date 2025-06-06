// src/hooks/useAddresses.ts - Cleaned version with proper logging
"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { createLogger } from '@/utils/logger'

const log = createLogger('useAddresses')

export type Address = {
  id: string
  street_and_number: string
  status: 'pending' | 'approved' | 'rejected'
  full_address: string
  settlement_id: string
}

export type AddressFormData = {
  county_id: string
  municipality_id: string
  settlement_id: string
  street_and_number: string
}

export const useAddresses = (userId?: string) => {
  const [pendingAddresses, setPendingAddresses] = useState<Address[]>([])
  const [approvedAddresses, setApprovedAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  
  // Prevent multiple simultaneous fetches
  const fetchingRef = useRef(false)
  const lastUserIdRef = useRef<string | undefined>(undefined)

  const fetchAddresses = useCallback(async () => {
    if (!userId) {
      log.debug('No userId provided, skipping fetch')
      return
    }
    
    // Prevent multiple simultaneous fetches for the same user
    if (fetchingRef.current && lastUserIdRef.current === userId) {
      log.debug('Fetch already in progress for this user, skipping')
      return
    }

    fetchingRef.current = true
    lastUserIdRef.current = userId
    setLoading(true)
    
    try {
      log.debug('Fetching addresses for user:', userId)
      
      const { data, error } = await supabase
        .from('addresses')
        .select(`
          id,
          street_and_number,
          status,
          settlement_id,
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
        `)
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

      if (error) {
        log.error('Address fetch error:', error)
        throw error
      }

      // Transform the data to include full address
      const transformedData = (data || []).map((address: any) => {
        const settlement = address.settlements
        const municipality = settlement?.municipalities
        const county = municipality?.counties
        
        return {
          id: address.id,
          street_and_number: address.street_and_number,
          status: address.status,
          settlement_id: address.settlement_id,
          full_address: settlement 
            ? `${address.street_and_number}, ${settlement.name} ${settlement.settlement_type}, ${municipality.name}, ${county.name}`
            : address.street_and_number
        }
      })

      // Separate pending and approved addresses
      const pending = transformedData.filter(addr => addr.status === 'pending')
      const approved = transformedData.filter(addr => addr.status === 'approved')
      
      log.debug(`Addresses fetched - Pending: ${pending.length}, Approved: ${approved.length}`)
      
      setPendingAddresses(pending)
      setApprovedAddresses(approved)

    } catch (error) {
      log.error('Error fetching addresses:', error)
      // Don't clear existing data on error
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [userId])

  const createAddress = async (data: AddressFormData, userId: string) => {
    try {
      log.debug('Creating address:', data.street_and_number)
      
      const { error } = await supabase
        .from('addresses')
        .insert({
          settlement_id: data.settlement_id,
          street_and_number: data.street_and_number,
          created_by: userId,
          status: 'pending'
        })

      if (error) {
        log.error('Error creating address:', error)
        throw error
      }

      log.info('Address created successfully')
      
      // Refresh addresses after creation
      await fetchAddresses()
      
      return { success: true, message: 'Address submitted for approval! Admin will review it.' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creating address'
      log.error('Create address failed:', errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  // Only fetch when userId changes and is valid
  useEffect(() => {
    if (userId && userId !== lastUserIdRef.current) {
      log.debug('UserId changed, fetching addresses')
      fetchAddresses()
    }
  }, [userId, fetchAddresses])

  return {
    pendingAddresses,
    approvedAddresses,
    loading,
    fetchAddresses,
    createAddress
  }
}