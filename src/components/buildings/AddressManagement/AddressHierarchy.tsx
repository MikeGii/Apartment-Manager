// src/components/buildings/AddressManagement/AddressHierarchy.tsx
"use client"

import { UseFormRegister, FieldErrors, FieldValues, Path } from 'react-hook-form'
import { useAddressHierarchy, County, Municipality, Settlement } from '@/hooks/useAddressHierarchy'

interface AddressHierarchyProps<T extends FieldValues> {
  register: UseFormRegister<T>
  errors: FieldErrors<T>
  watchedCounty?: string
  watchedMunicipality?: string
}

export const AddressHierarchy = <T extends FieldValues>({ 
  register, 
  errors, 
  watchedCounty, 
  watchedMunicipality 
}: AddressHierarchyProps<T>) => {
  const { 
    counties, 
    municipalities, 
    settlements, 
    loadMunicipalities, 
    loadSettlements,
    clearMunicipalities,
    clearSettlements
  } = useAddressHierarchy()

  // Handle county change
  const handleCountyChange = (countyId: string) => {
    if (countyId) {
      loadMunicipalities(countyId)
    } else {
      clearMunicipalities()
    }
  }

  // Handle municipality change
  const handleMunicipalityChange = (municipalityId: string) => {
    if (municipalityId) {
      loadSettlements(municipalityId)
    } else {
      clearSettlements()
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* County Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          County <span className="text-red-500">*</span>
        </label>
        <select
          {...register('county_id' as Path<T>, { 
            required: 'County is required',
            onChange: (e) => handleCountyChange(e.target.value)
          })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select county</option>
          {counties.map((county) => (
            <option key={county.id} value={county.id}>
              {county.name}
            </option>
          ))}
        </select>
        {errors.county_id && (
          <p className="mt-1 text-sm text-red-600">{String(errors.county_id?.message)}</p>
        )}
      </div>

      {/* Municipality Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Municipality <span className="text-red-500">*</span>
        </label>
        <select
          {...register('municipality_id' as Path<T>, { 
            required: watchedCounty ? 'Municipality is required' : false,
            onChange: (e) => handleMunicipalityChange(e.target.value)
          })}
          disabled={!watchedCounty}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">
            {!watchedCounty ? 'Select county first' : 'Select municipality'}
          </option>
          {municipalities.map((municipality) => (
            <option key={municipality.id} value={municipality.id}>
              {municipality.name}
            </option>
          ))}
        </select>
        {errors.municipality_id && (
          <p className="mt-1 text-sm text-red-600">{String(errors.municipality_id?.message)}</p>
        )}
      </div>

      {/* Settlement Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Settlement <span className="text-red-500">*</span>
        </label>
        <select
          {...register('settlement_id' as Path<T>, { 
            required: watchedMunicipality ? 'Settlement is required' : false 
          })}
          disabled={!watchedMunicipality}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">
            {!watchedMunicipality ? 'Select municipality first' : 'Select settlement'}
          </option>
          {settlements.map((settlement) => (
            <option key={settlement.id} value={settlement.id}>
              {settlement.name} ({settlement.settlement_type})
            </option>
          ))}
        </select>
        {errors.settlement_id && (
          <p className="mt-1 text-sm text-red-600">{String(errors.settlement_id?.message)}</p>
        )}
      </div>
    </div>
  )
}