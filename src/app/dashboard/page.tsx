// src/app/dashboard/page.tsx - Clean dashboard router without buildings references
"use client"

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { UserDashboard } from '@/components/dashboard/UserDashboard'
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard'
// Import other role dashboards when ready
// import { AdminDashboard } from '@/components/dashboard/AdminDashboard'
// import { AccountantDashboard } from '@/components/dashboard/AccountantDashboard'

export default function Dashboard() {
  const { profile } = useAuth()

  // Get user display name
  const getUserName = () => {
    if (profile?.full_name) {
      return profile.full_name
    }
    if (profile?.email) {
      return profile.email.split('@')[0]
    }
    return 'User'
  }

  // Render role-specific dashboard
  const renderDashboard = () => {
    if (!profile?.role) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      )
    }

    switch (profile.role) {
      case 'user':
        return <UserDashboard userName={getUserName()} />
      
      case 'building_manager':
        return <ManagerDashboard userName={getUserName()} />
      
      case 'admin':
        // Temporary fallback - will be replaced with AdminDashboard component
        return <LegacyAdminDashboard />
      
      case 'accountant':
        // Temporary fallback - will be replaced with AccountantDashboard component
        return <LegacyAccountantDashboard />
      
      default:
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Dashboard Not Available
            </h2>
            <p className="text-gray-600">
              Dashboard for role "{profile.role}" is not yet implemented.
            </p>
          </div>
        )
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {renderDashboard()}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

// Temporary legacy components for other roles (will be replaced)
const LegacyAdminDashboard = () => (
  <div className="bg-white shadow rounded-lg mb-8">
    <div className="px-4 py-5 sm:p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Administrator Dashboard
      </h2>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">⚡</div>
          <div>
            <h3 className="font-semibold text-red-900">Administrator Dashboard</h3>
            <p className="text-red-700 text-sm mt-1 font-medium">
              Full system access: manage users, approve addresses, oversee all buildings, and system administration.
            </p>
            <div className="flex space-x-4 mt-3">
              <a
                href="/admin"
                className="inline-flex items-center text-sm font-semibold text-red-600 hover:text-red-500"
              >
                Admin Panel →
              </a>
              <a
                href="/building-management"
                className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-500"
              >
                Building Management →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const LegacyAccountantDashboard = () => (
  <div className="bg-white shadow rounded-lg mb-8">
    <div className="px-4 py-5 sm:p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Accountant Dashboard
      </h2>
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">📊</div>
          <div>
            <h3 className="font-semibold text-purple-900">Accountant Dashboard</h3>
            <p className="text-purple-700 text-sm mt-1 font-medium">
              Manage financial records, track payments, and handle accounting operations for the apartment management system.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)