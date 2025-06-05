// src/hooks/useAddressHierarchy.ts
"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type County = {
  id: string
  name: string
}

export type Municipality = {
  id: string
  name: string
}

export type Settlement = {
  id: string
  name: string
  settlement_type: string
}

export const useAddressHierarchy = () => {
  const [counties, setCounties] = useState<County[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])

  const loadCounties = async () => {
    try {
      const { data, error } = await supabase
        .from('counties')
        .select('*')
        .order('name')
      
      if (error) throw error
      setCounties(data || [])
    } catch (error) {
      console.error('Error loading counties:', error)
    }
  }

  const loadMunicipalities = async (countyId: string) => {
    try {
      const { data, error } = await supabase
        .from('municipalities')
        .select('*')
        .eq('county_id', countyId)
        .order('name')
      
      if (error) throw error
      setMunicipalities(data || [])
      setSettlements([]) // Clear settlements when county changes
    } catch (error) {
      console.error('Error loading municipalities:', error)
    }
  }

  const loadSettlements = async (municipalityId: string) => {
    try {
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('municipality_id', municipalityId)
        .order('name')
      
      if (error) throw error
      setSettlements(data || [])
    } catch (error) {
      console.error('Error loading settlements:', error)
    }
  }

  const clearMunicipalities = () => {
    setMunicipalities([])
    setSettlements([])
  }

  const clearSettlements = () => {
    setSettlements([])
  }

  useEffect(() => {
    loadCounties()
  }, [])

  return {
    counties,
    municipalities,
    settlements,
    loadMunicipalities,
    loadSettlements,
    clearMunicipalities,
    clearSettlements
  }
}