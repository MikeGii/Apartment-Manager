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

export default function BuildingsManagement() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [flats, setFlats] = useState<Flat[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  const [loadingBuildings, setLoadingBuildings] = useState(true)
  const [loadingFlats, setLoadingFlats] = useState(false)
  const [showBuildingForm, setShowBuildingForm] = useState(false)
  const [showFlatForm, setShowFlatForm] = useState(false)

  const buildingForm = useForm<BuildingFormData>()
  const flatForm = useForm<FlatFormData>()

  // Redirect if not building manager or admin
  useEffect(() => {
    if (!loading && profile) {
      if (profile.role !== 'building_manager' && profile.role !== 'admin') {
        router.push('/dashboard')
      }
    }
  }, [loading, profile, router])

  // Fetch buildings
  useEffect(() => {
    if (profile && (profile.role === 'building_manager' || profile.role === 'admin')) {
      fetchBuildings()
    }
  }, [profile])

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

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (profile.role !== 'building_manager' && profile.role !== 'admin') {
    return null
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
                            />
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