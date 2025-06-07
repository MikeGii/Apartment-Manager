// src/components/admin/UserManagement/AdminUserManagement.tsx
"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'

type Profile = {
  id: string
  email: string
  full_name: string
  phone?: string
  role: string
  created_at: string
}

interface AdminUserManagementProps {
  isAdmin: boolean
}

export const AdminUserManagement = ({ isAdmin }: AdminUserManagementProps) => {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [processingUser, setProcessingUser] = useState<string | null>(null)
  const { success, error: showError } = useToast()

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, role, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      showError('Error', 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string, roleName: string) => {
    setProcessingUser(userId)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)

      if (error) throw error

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))

      success('Success', `User promoted to ${roleName} successfully!`)
      
    } catch (error) {
      console.error(`Error promoting user to ${roleName}:`, error)
      showError('Error', `Failed to promote user to ${roleName}`)
    } finally {
      setProcessingUser(null)
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch(role) {
      case 'user': return 'Flat Owner'
      case 'accountant': return 'Accountant'
      case 'building_manager': return 'Building Manager'
      case 'admin': return 'Administrator'
      default: return role.replace('_', ' ').toUpperCase()
    }
  }

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'user': return 'bg-blue-100 text-blue-800'
      case 'accountant': return 'bg-yellow-100 text-yellow-800'
      case 'building_manager': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          User Management ({users.length})
        </h3>
        
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
              {users.map((user) => (
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
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
                          onClick={() => updateUserRole(user.id, 'building_manager', 'building manager')}
                          disabled={processingUser === user.id}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50 font-medium"
                        >
                          {processingUser === user.id ? 'Processing...' : 'Make Manager'}
                        </button>
                        <button
                          onClick={() => updateUserRole(user.id, 'admin', 'admin')}
                          disabled={processingUser === user.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 font-medium"
                        >
                          {processingUser === user.id ? 'Processing...' : 'Make Admin'}
                        </button>
                      </>
                    )}
                    {user.role === 'building_manager' && (
                      <button
                        onClick={() => updateUserRole(user.id, 'admin', 'admin')}
                        disabled={processingUser === user.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 font-medium"
                      >
                        {processingUser === user.id ? 'Processing...' : 'Make Admin'}
                      </button>
                    )}
                    {user.role === 'accountant' && (
                      <>
                        <button
                          onClick={() => updateUserRole(user.id, 'building_manager', 'building manager')}
                          disabled={processingUser === user.id}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50 font-medium"
                        >
                          {processingUser === user.id ? 'Processing...' : 'Make Manager'}
                        </button>
                        <button
                          onClick={() => updateUserRole(user.id, 'admin', 'admin')}
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
      </div>
    </div>
  )
}