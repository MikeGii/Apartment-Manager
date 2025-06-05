// src/hooks/useAddresses.ts
"use client"

import { useState, useEffect } from 'react'
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

  const fetchAddresses = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      console.log('Fetching addresses for user:', userId)
      
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

      console.log('Raw addresses data:', data)

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
      
      console.log('Pending addresses:', pending)
      console.log('Approved addresses:', approved)
      
      setPendingAddresses(pending)
      setApprovedAddresses(approved)

    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setLoading(false)
    }
  }

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

  // Auto-fetch when userId changes
  useEffect(() => {
    if (userId) {
      fetchAddresses()
    }
  }, [userId])

  return {
    pendingAddresses,
    approvedAddresses,
    loading,
    fetchAddresses,
    createAddress
  }
}