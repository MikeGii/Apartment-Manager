// Fixed admin/page.tsx - Removed all status references
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
        const settlement = address.settlements
        const municipality = settlement?.municipalities
        const county = municipality?.counties
        const creator = address.profiles

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

  const updateAddressStatus = async (addressId: string, newStatus: 'approved' | 'rejected') => {
    setProcessingAddress(addressId)
    try {
      console.log('Updating address status:', { addressId, newStatus })
      
      const { error } = await supabase
        .from('addresses')
        .update({ 
          status: newStatus, 
          approved_by: profile?.id,
          updated_at: new Date().toISOString() 
        })
        .eq('id', addressId)

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }

      console.log('Address status updated successfully')

      // Remove from pending list
      setPendingAddresses(pendingAddresses.filter(addr => addr.id !== addressId))

      alert(`Address ${newStatus} successfully!${newStatus === 'approved' ? ' Building managers can now add flats to this address.' : ''}`)
    } catch (error: any) {
      console.error('Error updating address status:', error)
      alert(`Error updating address status: ${error.message || 'Unknown error'}`)
    } finally {
      setProcessingAddress(null)
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