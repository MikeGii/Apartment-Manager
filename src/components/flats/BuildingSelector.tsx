// src/components/flats/BuildingSelector.tsx
"use client"

import { useState, useEffect } from 'react'
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { FlatRegistrationData } from '@/hooks/useUserFlats'

interface Building {
  id: string
  name: string
  address_id: string
  street_and_number: string
  settlement_name: string
  settlement_type: string
  municipality_name: string
  county_name: string
  full_address: string
}

interface BuildingSelectorProps {
  register: UseFormRegister<FlatRegistrationData>
  errors: FieldErrors<FlatRegistrationData>
  setValue: UseFormSetValue<FlatRegistrationData>
  watchedSettlement?: string
  disabled?: boolean
}

export const BuildingSelector = ({ 
  register, 
  errors, 
  setValue, 
  watchedSettlement, 
  disabled = false 
}: BuildingSelectorProps) => {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)

  useEffect(() => {
    if (watchedSettlement) {
      fetchBuildingsForSettlement(watchedSettlement)
    } else {
      setBuildings([])
    }
  }, [watchedSettlement])

  const fetchBuildingsForSettlement = async (settlementId: string) => {
    setLoading(true)
    try {
      console.log('Fetching buildings for settlement:', settlementId)
      
      // First, let's check what buildings exist in the database
      const { data: allBuildings, error: allBuildingsError } = await supabase
        .from('buildings')
        .select('*')
        .limit(10)

      console.log('All buildings in database:', allBuildings, allBuildingsError)

      // Let's also check the actual column names in buildings table
      if (allBuildings && allBuildings.length > 0) {
        console.log('Buildings table columns:', Object.keys(allBuildings[0]))
        console.log('Sample building record:', allBuildings[0])
      }

      // Now let's fetch addresses in this settlement
      const { data: addressesInSettlement, error: addressesError } = await supabase
        .from('addresses')
        .select('*')
        .eq('settlement_id', settlementId)
        .eq('status', 'approved')

      console.log('Addresses in settlement:', addressesInSettlement, addressesError)

      if (!addressesInSettlement || addressesInSettlement.length === 0) {
        console.log('No approved addresses in this settlement')
        setBuildings([])
        return
      }

      // Extract address IDs
      const addressIds = addressesInSettlement.map(addr => addr.id)
      console.log('Looking for buildings with address IDs:', addressIds)

      // Corrected query - using 'addresses' (the table name) as the foreign key relationship
      const { data, error } = await supabase
        .from('buildings')
        .select(`
          id,
          name,
          address,
          addresses:address (
            id,
            street_and_number,
            settlement_id,
            status,
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
        `)
        .in('address', addressIds)

      console.log('Buildings query result:', { data, error })

      if (error) {
        console.error('Buildings query error details:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fullError: JSON.stringify(error)
        })
        
        // If the relationship is still wrong, let's try a simpler approach
        console.log('Relationship error detected, trying alternative approach...')
        
        // Alternative: get buildings by address IDs directly
        const { data: buildingsAlt, error: errorAlt } = await supabase
          .from('buildings')
          .select('*')
          .in('address', addressIds)  // Use 'address' column as confirmed by logs

        console.log('Alternative buildings query:', { buildingsAlt, errorAlt })

        if (errorAlt) {
          throw errorAlt
        }

        // Manually fetch address details for each building
        const buildingsWithAddresses = await Promise.all(
          (buildingsAlt || []).map(async (building) => {
            const addressData = addressesInSettlement.find(addr => addr.id === building.address)
            
            if (addressData) {
              // Fetch settlement details
              const { data: settlement } = await supabase
                .from('settlements')
                .select(`
                  name,
                  settlement_type,
                  municipalities (
                    name,
                    counties (
                      name
                    )
                  )
                `)
                .eq('id', addressData.settlement_id)
                .single()

              const municipality = settlement?.municipalities?.[0]
              const county = municipality?.counties?.[0]

              return {
                id: building.id,
                name: building.name,
                address_id: building.address,
                street_and_number: addressData.street_and_number,
                settlement_name: settlement?.name || 'Unknown',
                settlement_type: settlement?.settlement_type || '',
                municipality_name: municipality?.name || 'Unknown',
                county_name: county?.name || 'Unknown',
                full_address: settlement && municipality && county
                  ? `${addressData.street_and_number}, ${settlement.name} ${settlement.settlement_type}, ${municipality.name}, ${county.name}`
                  : addressData.street_and_number
              }
            }
            return null
          })
        )

        const validBuildings = buildingsWithAddresses.filter((building): building is Building => building !== null)
        console.log('Manually constructed buildings:', validBuildings)
        setBuildings(validBuildings)
        return
      }

      const transformedBuildings = (data || []).map((building: any) => {
        const address = building.addresses
        const settlement = address?.settlements
        const municipality = settlement?.municipalities
        const county = municipality?.counties

        console.log('Transforming building:', { building, address, settlement })

        return {
          id: building.id,
          name: building.name,
          address_id: building.address,
          street_and_number: address?.street_and_number || 'Unknown',
          settlement_name: settlement?.name || 'Unknown',
          settlement_type: settlement?.settlement_type || '',
          municipality_name: municipality?.name || 'Unknown',
          county_name: county?.name || 'Unknown',
          full_address: settlement 
            ? `${address.street_and_number}, ${settlement.name} ${settlement.settlement_type}, ${municipality.name}, ${county.name}`
            : address?.street_and_number || 'Unknown Address'
        }
      })

      console.log('Transformed buildings:', transformedBuildings)
      setBuildings(transformedBuildings)
    } catch (error) {
      console.error('Error fetching buildings:', error)
      let errorMessage = 'Unknown error'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error)
      }
      
      console.error('Detailed error:', errorMessage)
      setBuildings([])
    } finally {
      setLoading(false)
    }
  }

  const handleBuildingSelect = (building: Building) => {
    setValue('street_and_number', building.street_and_number)
    setShowManualInput(false)
  }

  if (!watchedSettlement) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Street and Building Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          disabled
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
          placeholder="Select settlement first"
        />
        <p className="mt-1 text-sm text-gray-500">Please select a settlement first to see available buildings</p>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Street and Building Number <span className="text-red-500">*</span>
      </label>
      
      {loading ? (
        <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">Loading buildings...</span>
          </div>
        </div>
      ) : buildings.length > 0 ? (
        <div className="mt-1">
          {!showManualInput ? (
            <div className="space-y-2">
              <select
                onChange={(e) => {
                  if (e.target.value === 'manual') {
                    setShowManualInput(true)
                    setValue('street_and_number', '')
                  } else if (e.target.value) {
                    const building = buildings.find(b => b.address_id === e.target.value)
                    if (building) {
                      handleBuildingSelect(building)
                    }
                  }
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={disabled}
              >
                <option value="">Select a building from the list</option>
                {buildings.map((building) => (
                  <option key={building.address_id} value={building.address_id}>
                    {building.street_and_number} - {building.name}
                  </option>
                ))}
                <option value="manual">🖊️ Enter manually (not in list)</option>
              </select>
              
              {/* Hidden input for form registration */}
              <input
                {...register('street_and_number', { 
                  required: 'Street and number is required',
                  minLength: {
                    value: 2,
                    message: 'Street and number must be at least 2 characters'
                  }
                })}
                type="hidden"
              />
              
              <div className="text-xs text-gray-500">
                💡 Select from {buildings.length} available building{buildings.length > 1 ? 's' : ''} in this settlement
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                {...register('street_and_number', { 
                  required: 'Street and number is required',
                  minLength: {
                    value: 2,
                    message: 'Street and number must be at least 2 characters'
                  }
                })}
                type="text"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Sõpruse 10"
                disabled={disabled}
              />
              <button
                type="button"
                onClick={() => {
                  setShowManualInput(false)
                  setValue('street_and_number', '')
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                ← Back to building list
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-1 space-y-2">
          <input
            {...register('street_and_number', { 
              required: 'Street and number is required',
              minLength: {
                value: 2,
                message: 'Street and number must be at least 2 characters'
              }
            })}
            type="text"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Sõpruse 10"
            disabled={disabled}
          />
          <div className="text-xs text-gray-500">
            ℹ️ No buildings found in this settlement. Enter the address manually.
          </div>
        </div>
      )}
      
      {errors.street_and_number && (
        <p className="mt-1 text-sm text-red-600">{errors.street_and_number.message}</p>
      )}
      
      {/* Preview of available buildings */}
      {buildings.length > 0 && !loading && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Available Buildings in this Settlement:
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {buildings.map((building) => (
              <div key={building.id} className="text-xs text-blue-700">
                📍 {building.street_and_number} - {building.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}