"use client"

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useForm } from 'react-hook-form'

type Building = {
  id: string
  name: string
  address: string
  manager_id: string
  created_at: string
}

type Flat = {
  id: string
  building_id: string
  unit_number: string
  floor: number
  tenant_id: string | null
  tenant_email?: string
  tenant_name?: string
}

type BuildingFormData = {
  name: string
  address: string
}

type FlatFormData = {
  unit_number: string
  floor: number
}

type AddressFormData = {
  county_id: string
  municipality_id: string
  settlement_id: string
  street_and_number: string
}

type County = {
  id: string
  name: string
}

type Municipality = {
  id: string
  name: string
}

type Settlement = {
  id: string
  name: string
  settlement_type: string
}

type Address = {
  id: string
  street_and_number: string
  status: string
  full_address: string
}

export default function BuildingsManagement() {
  const { profile, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [flats, setFlats] = useState<Flat[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  const [loadingBuildings, setLoadingBuildings] = useState(true)
  const [loadingFlats, setLoadingFlats] = useState(false)
  const [showBuildingForm, setShowBuildingForm] = useState(false)
  const [showFlatForm, setShowFlatForm] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)

  // Address management state
  const [counties, setCounties] = useState<County[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [myAddresses, setMyAddresses] = useState<Address[]>([])

  const buildingForm = useForm<BuildingFormData>()
  const flatForm = useForm<FlatFormData>()
  const addressForm = useForm<AddressFormData>()

  const watchedCounty = addressForm.watch('county_id')
  const watchedMunicipality = addressForm.watch('municipality_id')

  // Access control - redirect if not authorized
  useEffect(() => {
    if (!loading) {
      console.log('Buildings - Auth complete, checking access...')
      
      if (!isAuthenticated) {
        console.log('Buildings - Not authenticated, redirecting to login')
        router.replace('/login')
        return
      }

      if (!profile) {
        console.log('Buildings - No profile found')
        return
      }

      if (profile.role !== 'building_manager' && profile.role !== 'admin') {
        console.log('Buildings - Access denied for role:', profile.role)
        router.replace('/dashboard')
        return
      }

      console.log('Buildings - Access granted for role:', profile.role)
    }
  }, [loading, isAuthenticated, profile, router])

  // Data fetching - only after access is confirmed
  useEffect(() => {
    if (!loading && profile && (profile.role === 'building_manager' || profile.role === 'admin')) {
      console.log('Buildings - Starting data fetch for:', profile.role)
      fetchBuildings()
      loadCounties()
      fetchMyAddresses()
    }
  }, [loading, profile])

  // Load municipalities when county changes
  useEffect(() => {
    if (watchedCounty) {
      loadMunicipalities(watchedCounty)
      setSettlements([])
    }
  }, [watchedCounty])

  // Load settlements when municipality changes
  useEffect(() => {
    if (watchedMunicipality) {
      loadSettlements(watchedMunicipality)
    }
  }, [watchedMunicipality])

  const fetchBuildings = async () => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBuildings(data || [])
    } catch (error) {
      console.error('Error fetching buildings:', error)
    } finally {
      setLoadingBuildings(false)
    }
  }

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

  const fetchMyAddresses = async () => {
    try {
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
        .eq('created_by', profile?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Address fetch error details:', error)
        throw error
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
          full_address: settlement 
            ? `${address.street_and_number}, ${settlement.name} ${settlement.settlement_type}, ${municipality.name}, ${county.name}`
            : address.street_and_number
        }
      })

      setMyAddresses(transformedData)
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }

  const fetchFlats = async (buildingId: string) => {
    setLoadingFlats(true)
    try {
      const { data, error } = await supabase
        .from('flats')
        .select(`
          *,
          tenant:profiles(email, full_name)
        `)
        .eq('building_id', buildingId)
        .order('floor', { ascending: true })
        .order('unit_number', { ascending: true })

      if (error) throw error
      
      // Transform the data to include tenant info
      const flatsWithTenants = data?.map(flat => ({
        ...flat,
        tenant_email: flat.tenant?.email || null,
        tenant_name: flat.tenant?.full_name || null
      })) || []

      setFlats(flatsWithTenants)
    } catch (error) {
      console.error('Error fetching flats:', error)
    } finally {
      setLoadingFlats(false)
    }
  }

  const createBuilding = async (data: BuildingFormData) => {
    try {
      const { error } = await supabase
        .from('buildings')
        .insert({
          name: data.name,
          address: data.address,
          manager_id: profile?.id
        })

      if (error) throw error

      alert('Building created successfully!')
      buildingForm.reset()
      setShowBuildingForm(false)
      fetchBuildings()
    } catch (error) {
      console.error('Error creating building:', error)
      alert('Error creating building')
    }
  }

  const createAddress = async (data: AddressFormData) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .insert({
          settlement_id: data.settlement_id,
          street_and_number: data.street_and_number,
          created_by: profile?.id,
          status: 'pending'
        })

      if (error) throw error

      alert('Address submitted for approval! Admin will review it.')
      addressForm.reset()
      setShowAddressForm(false)
      fetchMyAddresses()
      setMunicipalities([])
      setSettlements([])
    } catch (error) {
      console.error('Error creating address:', error)
      alert('Error creating address')
    }
  }

  const createFlat = async (data: FlatFormData) => {
    if (!selectedBuilding) return

    try {
      const { error } = await supabase
        .from('flats')
        .insert({
          building_id: selectedBuilding,
          unit_number: data.unit_number,
          floor: data.floor
        })

      if (error) throw error

      alert('Flat created successfully!')
      flatForm.reset()
      setShowFlatForm(false)
      fetchFlats(selectedBuilding)
    } catch (error) {
      console.error('Error creating flat:', error)
      alert('Error creating flat')
    }
  }

  const handleBuildingSelect = (buildingId: string) => {
    setSelectedBuilding(buildingId)
    fetchFlats(buildingId)
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    )
  }

  // Show loading if not authenticated or no profile
  if (!isAuthenticated || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking access...</p>
        </div>
      </div>
    )
  }

  // Check access
  if (profile.role !== 'building_manager' && profile.role !== 'admin') {
    return null // Will redirect
  }

  const selectedBuildingData = buildings.find(b => b.id === selectedBuilding)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Building Management
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {profile.full_name || profile.email}!
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                {profile.role.replace('_', ' ').toUpperCase()}
              </span>
              <a
                href="/dashboard"
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors"
              >
                Back to Dashboard
              </a>
              {profile?.role === 'admin' && (
                <a
                  href="/admin"
                  className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md transition-colors"
                >
                  Admin Panel
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Address Management Section */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Address Management
                </h3>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Add New Address
                </button>
              </div>

              {/* Add Address Form */}
              {showAddressForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-md">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Add New Address</h4>
                  <form onSubmit={addressForm.handleSubmit(createAddress)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">County</label>
                        <select
                          {...addressForm.register('county_id', { required: 'County is required' })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select county</option>
                          {counties.map((county) => (
                            <option key={county.id} value={county.id}>{county.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      {watchedCounty && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Municipality</label>
                          <select
                            {...addressForm.register('municipality_id', { required: 'Municipality is required' })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select municipality</option>
                            {municipalities.map((municipality) => (
                              <option key={municipality.id} value={municipality.id}>{municipality.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      {watchedMunicipality && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Settlement</label>
                          <select
                            {...addressForm.register('settlement_id', { required: 'Settlement is required' })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select settlement</option>
                            {settlements.map((settlement) => (
                              <option key={settlement.id} value={settlement.id}>
                                {settlement.name} ({settlement.settlement_type})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Street and Building Number</label>
                        <input
                          {...addressForm.register('street_and_number', { required: 'Street and number is required' })}
                          type="text"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Sõpruse 10"
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Submit for Approval
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* My Addresses List */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">My Submitted Addresses ({myAddresses.length})</h4>
                {myAddresses.length === 0 ? (
                  <p className="text-gray-500 text-sm">No addresses submitted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {myAddresses.map((address) => (
                      <div key={address.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{address.full_address}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          address.status === 'approved' 
                            ? 'bg-green-100 text-green-800'
                            : address.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {address.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Buildings List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    My Buildings ({buildings.length})
                  </h3>
                  <button
                    onClick={() => setShowBuildingForm(!showBuildingForm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Add Building
                  </button>
                </div>

                {/* Add Building Form */}
                {showBuildingForm && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Add New Building</h4>
                    <form onSubmit={buildingForm.handleSubmit(createBuilding)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Building Name</label>
                        <input
                          {...buildingForm.register('name', { required: 'Building name is required' })}
                          type="text"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Sunset Apartments"
                        />
                        {buildingForm.formState.errors.name && (
                          <p className="mt-1 text-sm text-red-600">{buildingForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input
                          {...buildingForm.register('address', { required: 'Address is required' })}
                          type="text"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 123 Main St, City, State"
                        />
                        {buildingForm.formState.errors.address && (
                          <p className="mt-1 text-sm text-red-600">{buildingForm.formState.errors.address.message}</p>
                        )}
                      </div>
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Create Building
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowBuildingForm(false)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Buildings List */}
                {loadingBuildings ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : buildings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No buildings found. Add your first building to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {buildings.map((building) => (
                      <div
                        key={building.id}
                        onClick={() => handleBuildingSelect(building.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedBuilding === building.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h4 className="font-medium text-gray-900">{building.name}</h4>
                        <p className="text-sm text-gray-600">{building.address}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          Created: {new Date(building.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Flats Management */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {selectedBuildingData ? `Flats in ${selectedBuildingData.name}` : 'Select a Building'}
                  </h3>
                  {selectedBuilding && (
                    <button
                      onClick={() => setShowFlatForm(!showFlatForm)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Add Flat
                    </button>
                  )}
                </div>

                {selectedBuilding ? (
                  <>
                    {/* Add Flat Form */}
                    {showFlatForm && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-md">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Add New Flat</h4>
                        <form onSubmit={flatForm.handleSubmit(createFlat)} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Unit Number</label>
                            <input
                              {...flatForm.register('unit_number', { required: 'Unit number is required' })}
                              type="text"
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., 101, 2A, etc."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Floor</label>
                            <input
                              {...flatForm.register('floor', { required: 'Floor is required', valueAsNumber: true })}
                              type="number"
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., 1, 2, 3..."
                            />
                          </div>
                          <div className="flex space-x-3">
                            <button
                              type="submit"
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                              Create Flat
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowFlatForm(false)}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Flats List */}
                    {loadingFlats ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    ) : flats.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No flats found. Add flats to this building!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {flats.map((flat) => (
                          <div key={flat.id} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">Unit {flat.unit_number}</h4>
                                <p className="text-sm text-gray-600">Floor {flat.floor}</p>
                                {flat.tenant_id ? (
                                  <div className="mt-2">
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                      Occupied
                                    </span>
                                    <p className="text-sm text-gray-600 mt-1">
                                      Tenant: {flat.tenant_name || flat.tenant_email}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 mt-2">
                                    Vacant
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Select a building from the left to view and manage its flats.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}