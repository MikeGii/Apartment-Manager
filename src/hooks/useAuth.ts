// Clean useAuth.ts - Completely removed all status logic
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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const initializingRef = useRef(false)

  const fetchProfile = async (userId: string) => {
    try {
      console.log('useAuth: Fetching profile for user:', userId)
      setProfileError(null)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        
        if (error.code === 'PGRST116') {
          // No profile found - user exists in auth but not in profiles table
          console.warn('User authenticated but no profile found in database')
          setProfileError('PROFILE_NOT_FOUND')
          setProfile(null)
          return
        }
        
        setProfileError('PROFILE_FETCH_ERROR')
        setProfile(null)
        return
      }
      
      console.log('useAuth: Profile fetched successfully:', data.role)
      setProfile(data)
      setProfileError(null)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfileError('PROFILE_FETCH_ERROR')
      setProfile(null)
    }
  }

  const signOut = async () => {
    console.log('useAuth: Signing out...')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear local state immediately
      setUser(null)
      setProfile(null)
      setProfileError(null)
      console.log('useAuth: Sign out successful, state cleared')
    } catch (error) {
      console.error('useAuth: Sign out error:', error)
      throw error
    }
  }

  const createMissingProfile = async (user: User) => {
    try {
      console.log('Creating missing profile for user:', user.id)
      
      // Get data from user metadata (set during registration)
      const userRole = user.user_metadata?.role || 'user'
      const userFullName = user.user_metadata?.full_name || ''
      const userPhone = user.user_metadata?.phone || ''
      
      const profileData = {
        id: user.id,
        email: user.email || '',
        full_name: userFullName,
        phone: userPhone,
        role: userRole
      }

      console.log('Creating profile with data:', profileData)

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        throw error
      }

      console.log('Profile created successfully:', data)
      setProfile(data)
      setProfileError(null)
      return data
    } catch (error) {
      console.error('Failed to create profile:', error)
      setProfileError('PROFILE_CREATE_ERROR')
      throw error
    }
  }

  useEffect(() => {
    let mounted = true
    
    // Prevent multiple initializations
    if (initializingRef.current) {
      console.log('useAuth: Already initializing, skipping...')
      return
    }
    
    initializingRef.current = true

    const getInitialSession = async () => {
      try {
        console.log('useAuth: Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('useAuth: Session error:', error)
          throw error
        }
        
        if (!mounted) return
        
        console.log('useAuth: Session found:', !!session?.user, session?.user?.email)
        
        // Simple: if user exists and email is confirmed, they're authenticated
        if (session?.user && session.user.email_confirmed_at) {
          console.log('useAuth: User is authenticated and confirmed')
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          console.log('useAuth: No authenticated user or email not confirmed')
          setUser(null)
          setProfile(null)
          setProfileError(null)
        }
        
        setInitialized(true)
        setLoading(false)
        
      } catch (error) {
        console.error('useAuth: Error getting session:', error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setProfileError('SESSION_ERROR')
          setInitialized(true)
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Timeout fallback
    const timeoutId = setTimeout(() => {
      if (mounted && !initialized) {
        console.warn('useAuth: Timeout reached, forcing initialization complete')
        setLoading(false)
        setInitialized(true)
      }
    }, 3000)

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state change:', event, session?.user?.email)
        
        if (!mounted) return
        
        clearTimeout(timeoutId)
        
        // Handle auth events simply
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          console.log('useAuth: User signed in')
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          console.log('useAuth: User signed out')
          setUser(null)
          setProfile(null)
          setProfileError(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('useAuth: Token refreshed')
          setUser(session.user)
          if (!profile) {
            await fetchProfile(session.user.id)
          }
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
      initializingRef.current = false
    }
  }, []) // Empty dependency array is crucial

  return {
    user,
    profile,
    loading,
    profileError,
    signOut,
    createMissingProfile,
    isAuthenticated: !!user,
    hasProfile: !!profile && !profileError
  }
}