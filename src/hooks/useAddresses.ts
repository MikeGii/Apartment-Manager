// src/hooks/useAddresses.ts - Enhanced with Error Handling System
"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { createLogger } from '@/utils/logger'
import { 
  errorHandler, 
  withRetry, 
  throwValidationError, 
  AppError,
  ValidationError,
  NotFoundError 
} from '@/utils/errors'
import { useToast } from '@/components/ui/Toast'

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

  // Toast notifications
  const { success, error: showError, warning } = useToast()

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
          warning('Validation Error', appError.message)
        } else if (appError instanceof NotFoundError) {
          showError('Not Found', appError.message)
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
    
    const { data, error } = await handleOperation(async () => {
      return await withRetry(async () => {
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
          throw errorHandler.parseSupabaseError(error)
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

        log.debug(`Addresses fetched successfully: ${transformedData.length} addresses`)
        return transformedData
      })
    }, 'fetchAddresses', false) // Don't show toast for fetch operations

    if (data) {
      // Separate pending and approved addresses
      const pending = data.filter(addr => addr.status === 'pending')
      const approved = data.filter(addr => addr.status === 'approved')
      
      log.debug(`Addresses separated - Pending: ${pending.length}, Approved: ${approved.length}`)
      
      setPendingAddresses(pending)
      setApprovedAddresses(approved)
    }

    setLoading(false)
    fetchingRef.current = false
  }, [userId, handleOperation])

  const createAddress = async (data: AddressFormData, userId: string) => {
    // Input validation
    if (!data.settlement_id?.trim()) {
      throwValidationError('Settlement')
    }
    if (!data.street_and_number?.trim()) {
      throwValidationError('Street and number')
    }
    if (!userId?.trim()) {
      throwValidationError('User ID')
    }

    const { data: result, error } = await handleOperation(async () => {
      return await withRetry(async () => {
        log.debug('Creating address:', data.street_and_number)
        
        // Check if address already exists for this settlement
        const { data: existingAddress } = await supabase
          .from('addresses')
          .select('id, status')
          .eq('settlement_id', data.settlement_id)
          .eq('street_and_number', data.street_and_number.trim())
          .single()

        if (existingAddress) {
          if (existingAddress.status === 'approved') {
            throw new ValidationError('This address already exists and is approved')
          } else if (existingAddress.status === 'pending') {
            throw new ValidationError('This address is already pending approval')
          } else if (existingAddress.status === 'rejected') {
            throw new ValidationError('This address was previously rejected. Please contact support.')
          }
        }

        const { error } = await supabase
          .from('addresses')
          .insert({
            settlement_id: data.settlement_id,
            street_and_number: data.street_and_number.trim(),
            created_by: userId,
            status: 'pending'
          })

        if (error) {
          throw errorHandler.parseSupabaseError(error)
        }

        log.info('Address created successfully')
        
        // Refresh addresses after creation
        await fetchAddresses()
        
        return { 
          success: true, 
          message: 'Address submitted for approval! Admin will review it.' 
        }
      })
    }, 'createAddress')

    if (result) {
      success('Success', 'Address submitted for approval!')
      return result
    } else {
      return { 
        success: false, 
        message: error?.message || 'Failed to create address' 
      }
    }
  }

  // Auto-refresh addresses when userId changes
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
    createAddress,
    // Helper to clear any cached data
    clearCache: () => {
      setPendingAddresses([])
      setApprovedAddresses([])
      lastUserIdRef.current = undefined
    }
  }
}