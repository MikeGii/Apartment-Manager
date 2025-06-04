"use client"

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PendingApproval() {
  const { profile, signOut, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && profile?.status === 'approved') {
      router.push('/dashboard')
    }
  }, [loading, profile, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-yellow-100">
            <span className="text-2xl">⏳</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Pending Approval
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account is waiting for approval
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900">Account Details</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Email:</span>
                <span className="text-sm text-gray-900">{profile?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Name:</span>
                <span className="text-sm text-gray-900">{profile?.full_name || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Role:</span>
                <span className="text-sm text-gray-900 capitalize">
                  {profile?.role?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  {profile?.status}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-md">
            <div className="text-sm text-yellow-700">
              <p className="font-medium mb-2">What happens next?</p>
              <ul className="list-disc list-inside space-y-1">
                {profile?.role === 'building_manager' && (
                  <li>An admin will review your building manager application</li>
                )}
                {(profile?.role === 'accountant' || profile?.role === 'user') && (
                  <li>Your building manager will review your application</li>
                )}
                <li>You'll receive an email notification once approved</li>
                <li>After approval, you can access the full dashboard</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Check Status
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact support at support@apartmentmanager.com
          </p>
        </div>
      </div>
    </div>
  )
}