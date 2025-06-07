// src/app/admin/page.tsx
"use client"

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { NavigationMenu } from '@/components/ui/NavigationMenu'
import { AdminUserManagement } from '@/components/admin/UserManagement/AdminUserManagement'
import { AdminAddressApproval } from '@/components/admin/AddressApproval/AdminAddressApproval'
import { AdminStats } from '@/components/admin/AdminStats'
import { BuildingFixer } from '@/components/admin/BuildingFixer'

export default function AdminDashboard() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)

  // Redirect if not admin
  useEffect(() => {
    if (!loading && profile?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [loading, profile, router])

  const handleDataRefresh = () => {
    setRefreshKey(prev => prev + 1)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Burger Menu */}
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
              <NavigationMenu profile={profile} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Statistics Overview */}
          <AdminStats key={`stats-${refreshKey}`} />

          {/* Building Fixer Utility */}
          <BuildingFixer onFixComplete={handleDataRefresh} />

          {/* Address Approvals */}
          <AdminAddressApproval 
            adminId={profile.id} 
            onAddressProcessed={handleDataRefresh}
          />

          {/* User Management */}
          <AdminUserManagement isAdmin={true} />

        </div>
      </main>
    </div>
  )
}