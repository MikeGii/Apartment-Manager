// src/components/admin/BuildingFixer.tsx
"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface BuildingFixerProps {
  onFixComplete: () => void
}

export const BuildingFixer = ({ onFixComplete }: BuildingFixerProps) => {
  const [isFixing, setIsFixing] = useState(false)

  const fixExistingAddresses = async () => {
    setIsFixing(true)
    try {
      console.log('Starting to fix existing approved addresses...')

      // Find approved addresses that don't have buildings
      const { data: approvedAddresses, error: addressError } = await supabase
        .from('addresses')
        .select(`
          id,
          street_and_number,
          created_by,
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
        .eq('status', 'approved')

      if (addressError) throw addressError

      // Get existing buildings to check which addresses already have buildings
      const { data: existingBuildings, error: buildingError } = await supabase
        .from('buildings')
        .select('address')

      if (buildingError) throw buildingError

      const existingBuildingAddressIds = new Set(
        existingBuildings?.map(b => b.address) || []
      )

      // Filter addresses that don't have buildings
      const addressesWithoutBuildings = approvedAddresses?.filter(
        addr => !existingBuildingAddressIds.has(addr.id)
      ) || []

      console.log(`Found ${addressesWithoutBuildings.length} approved addresses without buildings`)

      if (addressesWithoutBuildings.length === 0) {
        alert('All approved addresses already have buildings!')
        return
      }

      // Create buildings for these addresses
      const buildingsToCreate = addressesWithoutBuildings.map(address => {
        const settlement = Array.isArray(address.settlements) ? address.settlements[0] : address.settlements
        const municipality = Array.isArray(settlement?.municipalities) ? settlement.municipalities[0] : settlement?.municipalities
        const county = Array.isArray(municipality?.counties) ? municipality.counties[0] : municipality?.counties
        
        const fullAddress = settlement 
          ? `${address.street_and_number}, ${settlement.name} ${settlement.settlement_type}, ${municipality.name}, ${county.name}`
          : address.street_and_number

        return {
          address: address.id,
          name: fullAddress,
          manager_id: address.created_by,
          created_at: new Date().toISOString()
        }
      })

      // Batch insert buildings
      const { error: insertError } = await supabase
        .from('buildings')
        .insert(buildingsToCreate)

      if (insertError) throw insertError

      console.log(`Successfully created ${buildingsToCreate.length} buildings`)
      alert(`Successfully created buildings for ${buildingsToCreate.length} approved addresses!`)
      onFixComplete()

    } catch (error: any) {
      console.error('Error fixing existing addresses:', error)
      alert(`Error fixing existing addresses: ${error.message || 'Unknown error'}`)
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Fix Existing Approved Addresses
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>If you have approved addresses that don't show up in Building Management, click this button to create missing buildings.</p>
          </div>
          <div className="mt-4">
            <button
              onClick={fixExistingAddresses}
              disabled={isFixing}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              {isFixing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating Buildings...</span>
                </>
              ) : (
                <span>Create Missing Buildings</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}