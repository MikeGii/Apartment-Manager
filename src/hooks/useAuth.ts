// src/hooks/useAuth.ts - Improved version with proper error handling and logging
"use client"

import { useState, useEffect, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string
  email: string
  full_name: string
  phone?: string
  role: string
  created_at: string
  updated_at: string
}

type ProfileError = 'PROFILE_NOT_FOUND' | 'PROFILE_FETCH_ERROR' | 'RLS_ERROR' | 'SESSION_ERROR' | 'PROFILE_CREATE_ERROR'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [profileError, setProfileError] = useState<ProfileError | null>(null)
  
  // Prevent multiple simultaneous operations
  const operationRefs = {
    initializing: useRef(false),
    fetchingProfile: useRef(false)
  }

  const logger = {
    debug: (message: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[useAuth] ${message}`, data || '')
      }
    },
    error: (message: string, error?: any) => {
      console.error(`[useAuth] ${message}`, error || '')
    },
    warn: (message: string, data?: any) => {
      console.warn(`[useAuth] ${message}`, data || '')
    }
  }

  const fetchProfile = async (userId: string) => {
    if (operationRefs.fetchingProfile.current) {
      logger.debug('Profile fetch already in progress, skipping')
      return
    }

    operationRefs.fetchingProfile.current = true
    
    try {
      logger.debug('Fetching profile for user:', userId)
      setProfileError(null)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        logger.error('Profile fetch error:', error)
        
        const errorMap: Record<string, ProfileError> = {
          'PGRST116': 'PROFILE_NOT_FOUND',
          '42P17': 'RLS_ERROR'
        }
        
        const profileError = errorMap[error.code] || 'PROFILE_FETCH_ERROR'
        setProfileError(profileError)
        setProfile(null)
        return
      }
      
      logger.debug('Profile fetched successfully:', { role: data.role, email: data.email })
      setProfile(data)
      setProfileError(null)
    } catch (error) {
      logger.error('Unexpected error fetching profile:', error)
      setProfileError('PROFILE_FETCH_ERROR')
      setProfile(null)
    } finally {
      operationRefs.fetchingProfile.current = false
    }
  }

  const signOut = async () => {
    logger.debug('Signing out...')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear state immediately
      setUser(null)
      setProfile(null)
      setProfileError(null)
      setInitialized(false)
      logger.debug('Sign out successful, state cleared')
    } catch (error) {
      logger.error('Sign out error:', error)
      throw error
    }
  }

  const createMissingProfile = async (user: User) => {
    try {
      logger.debug('Creating missing profile for user:', user.id)
      
      const profileData = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        role: user.user_metadata?.role || 'user'
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        logger.error('Error creating profile:', error)
        throw error
      }

      logger.debug('Profile created successfully')
      setProfile(data)
      setProfileError(null)
      return data
    } catch (error) {
      logger.error('Failed to create profile:', error)
      setProfileError('PROFILE_CREATE_ERROR')
      throw error
    }
  }

  useEffect(() => {
    let mounted = true
    
    if (operationRefs.initializing.current) {
      logger.debug('Already initializing, skipping')
      return
    }
    
    operationRefs.initializing.current = true

    const initializeAuth = async () => {
      try {
        logger.debug('Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          logger.error('Session error:', error)
          throw error
        }
        
        if (!mounted) return
        
        if (session?.user?.email_confirmed_at) {
          logger.debug('User is authenticated and confirmed')
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          logger.debug('No authenticated user or email not confirmed')
          setUser(null)
          setProfile(null)
          setProfileError(null)
        }
        
      } catch (error) {
        logger.error('Error during initialization:', error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setProfileError('SESSION_ERROR')
        }
      } finally {
        if (mounted) {
          setInitialized(true)
          setLoading(false)
          logger.debug('Initialization complete')
        }
      }
    }

    initializeAuth()

    // Timeout fallback
    const timeoutId = setTimeout(() => {
      if (mounted && !initialized) {
        logger.warn('Timeout reached, forcing initialization complete')
        setLoading(false)
        setInitialized(true)
      }
    }, 5000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted || !initialized) return
        
        logger.debug('Auth state change:', event)
        clearTimeout(timeoutId)
        
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user?.email_confirmed_at) {
              setUser(session.user)
              await fetchProfile(session.user.id)
            }
            break
          case 'SIGNED_OUT':
            setUser(null)
            setProfile(null)
            setProfileError(null)
            break
          case 'TOKEN_REFRESHED':
            if (session?.user && !profile && !operationRefs.fetchingProfile.current) {
              setUser(session.user)
              await fetchProfile(session.user.id)
            }
            break
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
      operationRefs.initializing.current = false
    }
  }, []) // Empty dependency array is correct

  return {
    user,
    profile,
    loading,
    profileError,
    signOut,
    createMissingProfile,
    isAuthenticated: !!user && !!profile,
    hasProfile: !!profile && !profileError
  }
}