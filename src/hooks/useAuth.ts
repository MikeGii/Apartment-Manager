"use client"

import { useState, useEffect, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  created_at: string
  updated_at: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const initializingRef = useRef(false)

  const fetchProfile = async (userId: string) => {
    try {
      console.log('useAuth: Fetching profile for user:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        setProfile(null)
        return
      }
      
      console.log('useAuth: Profile fetched successfully:', data.role)
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
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
        
        console.log('useAuth: Initial session result:', !!session?.user, session?.user?.email)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setInitialized(true)
        console.log('useAuth: Initialization complete, setting loading to false')
        setLoading(false)
        
      } catch (error) {
        console.error('useAuth: Error getting session:', error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setInitialized(true)
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Timeout fallback - use a ref to check current loading state
    const timeoutId = setTimeout(() => {
      if (mounted && !initialized) {
        console.warn('useAuth: Timeout reached, forcing initialization complete')
        setLoading(false)
        setInitialized(true)
      }
    }, 3000) // Reduced to 3 seconds

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state change:', event, session?.user?.email)
        
        if (!mounted) return
        
        // Clear the timeout since we got an auth event
        clearTimeout(timeoutId)
        
        // Only process auth changes after initial load is complete
        if (initialized) {
          console.log('useAuth: Processing auth change after initialization')
          setUser(session?.user ?? null)
          
          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
          }
        } else {
          console.log('useAuth: Skipping auth change - not yet initialized')
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

  const signOut = async () => {
    console.log('useAuth: Signing out...')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear local state immediately
      setUser(null)
      setProfile(null)
      console.log('useAuth: Sign out successful, state cleared')
    } catch (error) {
      console.error('useAuth: Sign out error:', error)
      throw error
    }
  }

  return {
    user,
    profile,
    loading,
    signOut,
    isAuthenticated: !!user,
    isApproved: profile?.status === 'approved'
  }
}