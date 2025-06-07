// src/components/flats/BuildingSelector.tsx - Cleaned with proper error handling
"use client"

import { useState, useEffect } from 'react'
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { FlatRegistrationData } from '@/hooks/useUserFlats'
import { createLogger } from '@/utils/logger'

const log = createLogger('BuildingSelector')

// Buildings table uses 'address' column consistently
const BUILDING_ADDRESS_COLUMN = 'address'

interface Building {
  id: string
  name: string
  address: string
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
  const [error, setError] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)

  useEffect(() => {
    if (watchedSettlement) {
      fetchBuildingsForSettlement(watchedSettlement)
    } else {
      setBuildings([])
      setError(null)
    }
  }, [watchedSettlement])

  const fetchBuildingsForSettlement = async (settlementId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      log.debug('Fetching buildings for settlement:', settlementId)
      
      // Get approved addresses in this settlement
      const { data: addresses, error: addressError } = await supabase
        .from('addresses')
        .select('id, street_and_number')
        .eq('settlement_id', settlementId)
        .eq('status', 'approved')

      if (addressError) {
        throw new Error(`Failed to fetch addresses: ${addressError.message}`)
      }

      if (!addresses || addresses.length === 0) {
        log.debug('No approved addresses in this settlement')
        setBuildings([])
        return
      }

      const addressIds = addresses.map(addr => addr.id)
      log.debug(`Found ${addresses.length} approved addresses`)

      // Get buildings for these addresses
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select(`id, name, ${BUILDING_ADDRESS_COLUMN}`)
        .in(BUILDING_ADDRESS_COLUMN, addressIds)

      if (buildingsError) {
        throw new Error(`Failed to fetch buildings: ${buildingsError.message}`)
      }

      if (!buildingsData || buildingsData.length === 0) {
        log.debug('No buildings found for these addresses')
        setBuildings([])
        return
      }

      // Type the building data properly
      type BuildingData = {
        id: string
        name: string
        address: string
      }

      // Enrich buildings with address and location data
      const enrichedBuildings = await Promise.all(
        (buildingsData as BuildingData[]).map(async (building) => {
          const addressData = addresses.find(addr => addr.id === building.address)
          
          if (!addressData) {
            return null
          }

          // Get location hierarchy
          try {
            const { data: settlement, error: settlementError } = await supabase
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
              .eq('id', settlementId)
              .single()

            if (settlementError) {
              log.warn('Could not fetch settlement details:', settlementError)
            }

            const municipality = settlement?.municipalities?.[0]
            const county = municipality?.counties?.[0]

            return {
              id: building.id,
              name: building.name,
              address: building.address,
              street_and_number: addressData.street_and_number,
              settlement_name: settlement?.name || 'Unknown',
              settlement_type: settlement?.settlement_type || '',
              municipality_name: municipality?.name || 'Unknown',
              county_name: county?.name || 'Unknown',
              full_address: settlement && municipality && county
                ? `${addressData.street_and_number}, ${settlement.name} ${settlement.settlement_type}, ${municipality.name}, ${county.name}`
                : addressData.street_and_number
            }
          } catch (locationError) {
            log.warn('Error fetching location data:', locationError)
            return {
              id: building.id,
              name: building.name,
              address: building.address,
              street_and_number: addressData.street_and_number,
              settlement_name: 'Unknown',
              settlement_type: '',
              municipality_name: 'Unknown',
              county_name: 'Unknown',
              full_address: addressData.street_and_number
            }
          }
        })
      )

      const validBuildings = enrichedBuildings.filter((building): building is Building => building !== null)
      log.debug(`Successfully processed ${validBuildings.length} buildings`)
      setBuildings(validBuildings)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load buildings'
      log.error('Error fetching buildings:', error)
      setError(errorMessage)
      setBuildings([])
    } finally {
      setLoading(false)
    }
  }

  const handleBuildingSelect = (building: Building) => {
    setValue('street_and_number', building.street_and_number)
    setShowManualInput(false)
    log.debug('Building selected:', building.name)
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

  if (error) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Street and Building Number <span className="text-red-500">*</span>
        </label>
        <input
          {...register('street_and_number', { 
            required: 'Street and number is required',
            minLength: { value: 2, message: 'Street and number must be at least 2 characters' }
          })}
          type="text"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Sõpruse 10"
          disabled={disabled}
        />
        <p className="mt-1 text-sm text-red-600">{error}</p>
        {errors.street_and_number && (
          <p className="mt-1 text-sm text-red-600">{errors.street_and_number.message}</p>
        )}
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
                    const building = buildings.find(b => b.address === e.target.value)
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
                  <option key={building.address} value={building.address}>
                    {building.street_and_number} - {building.name}
                  </option>
                ))}
                <option value="manual">🖊️ Enter manually (not in list)</option>
              </select>
              
              <input
                {...register('street_and_number', { 
                  required: 'Street and number is required',
                  minLength: { value: 2, message: 'Street and number must be at least 2 characters' }
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
                  minLength: { value: 2, message: 'Street and number must be at least 2 characters' }
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
              minLength: { value: 2, message: 'Street and number must be at least 2 characters' }
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