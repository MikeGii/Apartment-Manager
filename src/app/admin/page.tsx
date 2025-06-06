// src/app/admin/page.tsx - Complete admin page with auto building creation
"use client"

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string
  email: string
  full_name: string
  phone?: string
  role: string
  created_at: string
}

type PendingAddress = {
  id: string
  street_and_number: string
  status: string
  created_at: string
  full_address: string
  created_by: string
  creator_email?: string
  creator_name?: string
}

export default function AdminDashboard() {
  const { profile, signOut, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<Profile[]>([])
  const [pendingAddresses, setPendingAddresses] = useState<PendingAddress[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [processingUser, setProcessingUser] = useState<string | null>(null)
  const [processingAddress, setProcessingAddress] = useState<string | null>(null)
  const [fixingAddresses, setFixingAddresses] = useState(false)

  // Redirect if not admin
  useEffect(() => {
    if (!loading && profile?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [loading, profile, router])

  // Fetch all users and addresses
  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchUsers()
      fetchPendingAddresses()
    }
  }, [profile])

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...')
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, role, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
        throw error
      }
      
      console.log('Users fetched successfully:', data?.length || 0)
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchPendingAddresses = async () => {
    try {
      console.log('Fetching pending addresses...')
      const { data, error } = await supabase
        .from('addresses')
        .select(`
          id,
          street_and_number,
          status,
          created_at,
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
          ),
          profiles!addresses_created_by_fkey (
            email,
            full_name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching pending addresses:', error)
        throw error
      }

      // Transform the data
      const transformedData = (data || []).map((address: any) => {
        // Handle nested objects - Supabase can return arrays or single objects
        const settlement = Array.isArray(address.settlements) ? address.settlements[0] : address.settlements
        const municipality = Array.isArray(settlement?.municipalities) ? settlement.municipalities[0] : settlement?.municipalities
        const county = Array.isArray(municipality?.counties) ? municipality.counties[0] : municipality?.counties
        const creator = Array.isArray(address.profiles) ? address.profiles[0] : address.profiles

        return {
          id: address.id,
          street_and_number: address.street_and_number,
          status: address.status,
          created_at: address.created_at,
          created_by: address.created_by,
          creator_email: creator?.email,
          creator_name: creator?.full_name,
          full_address: settlement 
            ? `${address.street_and_number}, ${settlement.name} ${settlement.settlement_type}, ${municipality.name}, ${county.name}`
            : address.street_and_number
        }
      })

      console.log('Pending addresses fetched successfully:', transformedData.length)
      setPendingAddresses(transformedData)
    } catch (error) {
      console.error('Error fetching pending addresses:', error)
    } finally {
      setLoadingAddresses(false)
    }
  }

  const makeAdmin = async (userId: string) => {
    setProcessingUser(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)

      if (error) throw error

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: 'admin' } : user
      ))

      alert('User promoted to admin successfully!')
    } catch (error) {
      console.error('Error promoting user to admin:', error)
      alert('Error promoting user to admin')
    } finally {
      setProcessingUser(null)
    }
  }

  const makeBuildingManager = async (userId: string) => {
    setProcessingUser(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: 'building_manager',
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)

      if (error) throw error

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: 'building_manager' } : user
      ))

      alert('User promoted to building manager successfully!')
    } catch (error) {
      console.error('Error promoting user to building manager:', error)
      alert('Error promoting user to building manager')
    } finally {
      setProcessingUser(null)
    }
  }

  const handleSignOut = async () => {
    try {
      console.log('Admin - Signing out...')
      await signOut()
      console.log('Admin - Sign out successful, redirecting to login')
      
      // Force a hard redirect to ensure clean state
      window.location.href = '/login'
    } catch (error) {
      console.error('Admin - Sign out error:', error)
    }
  }

  // Updated function to create building when approving address
  const updateAddressStatus = async (addressId: string, newStatus: 'approved' | 'rejected') => {
    setProcessingAddress(addressId)
    try {
      console.log('Updating address status:', { addressId, newStatus })
      
      // First, update the address status
      const { error: updateError } = await supabase
        .from('addresses')
        .update({ 
          status: newStatus, 
          approved_by: profile?.id,
          updated_at: new Date().toISOString() 
        })
        .eq('id', addressId)

      if (updateError) {
        console.error('Supabase error details:', updateError)
        throw updateError
      }

      // If approved, automatically create the building
      if (newStatus === 'approved') {
        console.log('Creating building for approved address...')
        
        // Get the full address details and creator info
        const currentAddress = pendingAddresses.find(addr => addr.id === addressId)
        if (!currentAddress) {
          throw new Error('Address not found in current list')
        }

        // Create the building - use your actual column names
        const { error: buildingError } = await supabase
          .from('buildings')
          .insert({
            address: addressId, // Use 'address' column based on your CSV data
            name: currentAddress.full_address, // Use full address as building name
            manager_id: currentAddress.created_by, // Use manager_id (not building_manager_id)
            created_at: new Date().toISOString()
          })

        if (buildingError) {
          console.error('Error creating building:', buildingError)
          // Don't throw here - address is still approved even if building creation fails
          alert(`Address approved successfully, but there was an issue creating the building: ${buildingError.message}. Please contact support.`)
        } else {
          console.log('Building created successfully for approved address')
        }
      }

      console.log('Address status updated successfully')

      // Remove from pending list
      setPendingAddresses(pendingAddresses.filter(addr => addr.id !== addressId))

      alert(`Address ${newStatus} successfully!${newStatus === 'approved' ? ' Building has been created and the manager can now add flats.' : ''}`)
    } catch (error: any) {
      console.error('Error updating address status:', error)
      alert(`Error updating address status: ${error.message || 'Unknown error'}`)
    } finally {
      setProcessingAddress(null)
    }
  }

  // Utility function to fix existing approved addresses without buildings
  const fixExistingAddresses = async () => {
    setFixingAddresses(true)
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

      if (addressError) {
        throw addressError
      }

      // Get existing buildings to check which addresses already have buildings
      const { data: existingBuildings, error: buildingError } = await supabase
        .from('buildings')
        .select('address') // Use 'address' column instead of 'address_id'

      if (buildingError) {
        throw buildingError
      }

      const existingBuildingAddressIds = new Set(
        existingBuildings?.map(b => b.address) || [] // Use 'address' column
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

      // Create buildings for these addresses - handle nested objects properly
      const buildingsToCreate = addressesWithoutBuildings.map(address => {
        // Handle nested objects - Supabase can return arrays or single objects
        const settlement = Array.isArray(address.settlements) ? address.settlements[0] : address.settlements
        const municipality = Array.isArray(settlement?.municipalities) ? settlement.municipalities[0] : settlement?.municipalities
        const county = Array.isArray(municipality?.counties) ? municipality.counties[0] : municipality?.counties
        
        const fullAddress = settlement 
          ? `${address.street_and_number}, ${settlement.name} ${settlement.settlement_type}, ${municipality.name}, ${county.name}`
          : address.street_and_number

        return {
          address: address.id, // Use 'address' column based on your CSV structure
          name: fullAddress,
          manager_id: address.created_by, // Use manager_id to match your schema
          created_at: new Date().toISOString()
        }
      })

      // Batch insert buildings
      const { error: insertError } = await supabase
        .from('buildings')
        .insert(buildingsToCreate)

      if (insertError) {
        throw insertError
      }

      console.log(`Successfully created ${buildingsToCreate.length} buildings`)
      alert(`Successfully created buildings for ${buildingsToCreate.length} approved addresses!`)

    } catch (error: any) {
      console.error('Error fixing existing addresses:', error)
      alert(`Error fixing existing addresses: ${error.message || 'Unknown error'}`)
    } finally {
      setFixingAddresses(false)
    }
  }

  // Function to get display name for roles
  const getRoleDisplayName = (role: string) => {
    switch(role) {
      case 'user': return 'Flat Owner'
      case 'accountant': return 'Accountant'
      case 'building_manager': return 'Building Manager'
      case 'admin': return 'Administrator'
      default: return role.replace('_', ' ').toUpperCase()
    }
  }

  if (loading || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const allUsers = users

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700 font-medium">
                Welcome back, {profile?.full_name || profile?.email}!
              </div>
              <div className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-800 font-semibold">
                {getRoleDisplayName(profile?.role || '')}
              </div>
              <a
                href="/dashboard"
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors font-medium"
              >
                Back to Dashboard
              </a>
              <button
                onClick={handleSignOut}
                className="text-sm text-red-600 hover:text-red-800 font-semibold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">👥</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{allUsers.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">🏢</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Building Managers</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {allUsers.filter(u => u.role === 'building_manager').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">📍</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Addresses</dt>
                      <dd className="text-lg font-medium text-gray-900">{pendingAddresses.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Utility Fix Button */}
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
                    disabled={fixingAddresses}
                    className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {fixingAddresses ? 'Creating Buildings...' : 'Create Missing Buildings'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Address Approvals */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Pending Address Approvals ({pendingAddresses.length})
              </h3>
              {loadingAddresses ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : pendingAddresses.length === 0 ? (
                <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No pending address approvals</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requested by
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingAddresses.map((address) => (
                        <tr key={address.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {address.full_address}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {address.creator_name || 'No name provided'}
                              </div>
                              <div className="text-sm text-gray-500">{address.creator_email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(address.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => updateAddressStatus(address.id, 'approved')}
                              disabled={processingAddress === address.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50 font-medium"
                            >
                              {processingAddress === address.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => updateAddressStatus(address.id, 'rejected')}
                              disabled={processingAddress === address.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 font-medium"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* All Users */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                User Management ({allUsers.length})
              </h3>
              {loadingUsers ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registered
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.full_name || 'No name provided'}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                              user.role === 'admin' 
                                ? 'bg-red-100 text-red-800' 
                                : user.role === 'building_manager'
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'accountant'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {getRoleDisplayName(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.phone || 'Not provided'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {user.role === 'user' && (
                              <>
                                <button
                                  onClick={() => makeBuildingManager(user.id)}
                                  disabled={processingUser === user.id}
                                  className="text-purple-600 hover:text-purple-900 disabled:opacity-50 font-medium"
                                >
                                  {processingUser === user.id ? 'Processing...' : 'Make Manager'}
                                </button>
                                <button
                                  onClick={() => makeAdmin(user.id)}
                                  disabled={processingUser === user.id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50 font-medium"
                                >
                                  {processingUser === user.id ? 'Processing...' : 'Make Admin'}
                                </button>
                              </>
                            )}
                            {user.role === 'building_manager' && (
                              <button
                                onClick={() => makeAdmin(user.id)}
                                disabled={processingUser === user.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50 font-medium"
                              >
                                {processingUser === user.id ? 'Processing...' : 'Make Admin'}
                              </button>
                            )}
                            {user.role === 'accountant' && (
                              <>
                                <button
                                  onClick={() => makeBuildingManager(user.id)}
                                  disabled={processingUser === user.id}
                                  className="text-purple-600 hover:text-purple-900 disabled:opacity-50 font-medium"
                                >
                                  {processingUser === user.id ? 'Processing...' : 'Make Manager'}
                                </button>
                                <button
                                  onClick={() => makeAdmin(user.id)}
                                  disabled={processingUser === user.id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50 font-medium"
                                >
                                  {processingUser === user.id ? 'Processing...' : 'Make Admin'}
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}