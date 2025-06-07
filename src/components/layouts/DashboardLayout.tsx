// Updated DashboardLayout.tsx - Now includes burger menu navigation
"use client"

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'
import { NavigationMenu } from '@/components/ui/NavigationMenu'

interface DashboardLayoutProps {
  children: ReactNode
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { profile } = useAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header - Clean and minimal with burger menu */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Left side - App branding */}
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 rounded-lg p-2">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Apartment Management System
                </h1>
                <p className="text-sm text-gray-600 font-medium">Dashboard</p>
              </div>
            </div>
            
            {/* Right side - User info and navigation menu */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700 font-medium">
                Welcome, {profile?.full_name || profile?.email}!
              </div>
              
              {/* Navigation Menu - Now included in dashboard */}
              {profile && <NavigationMenu profile={profile} />}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  )
}