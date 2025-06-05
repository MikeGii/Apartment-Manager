// Fixed useAddresses.ts - Prevent multiple fetches and race conditions
"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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
  
  // Use ref to prevent multiple simultaneous fetches
  const fetchingRef = useRef(false)
  const lastUserIdRef = useRef<string | undefined>(undefined)

  const fetchAddresses = useCallback(async () => {
    if (!userId) {
      console.log('useAddresses: No userId provided, skipping fetch')
      return
    }
    
    // Prevent multiple simultaneous fetches for the same user
    if (fetchingRef.current && lastUserIdRef.current === userId) {
      console.log('useAddresses: Fetch already in progress for this user, skipping...')
      return
    }

    fetchingRef.current = true
    lastUserIdRef.current = userId
    setLoading(true)
    
    try {
      console.log('useAddresses: Fetching addresses for user:', userId)
      
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
        console.error('Address fetch error details:', error)
        throw error
      }

      console.log('useAddresses: Raw addresses data:', data)

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
      
      console.log('useAddresses: Pending addresses:', pending.length)
      console.log('useAddresses: Approved addresses:', approved.length)
      
      setPendingAddresses(pending)
      setApprovedAddresses(approved)

    } catch (error) {
      console.error('Error fetching addresses:', error)
      // Don't clear existing data on error, just log it
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [userId])

  const createAddress = async (data: AddressFormData, userId: string) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .insert({
          settlement_id: data.settlement_id,
          street_and_number: data.street_and_number,
          created_by: userId,
          status: 'pending'
        })

      if (error) throw error

      // Refresh addresses after creation
      await fetchAddresses()
      
      return { success: true, message: 'Address submitted for approval! Admin will review it.' }
    } catch (error) {
      console.error('Error creating address:', error)
      return { success: false, message: 'Error creating address' }
    }
  }

  // Only fetch when userId changes and is valid
  useEffect(() => {
    if (userId && userId !== lastUserIdRef.current) {
      console.log('useAddresses: UserId changed, fetching addresses...')
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