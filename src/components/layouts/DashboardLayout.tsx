// src/components/layouts/DashboardLayout.tsx - Universal layout wrapper
"use client"

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Dashboard - Sign out error:', error)
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
      case 'user': return 'bg-green-100 text-green-800'
      case 'accountant': return 'bg-yellow-100 text-yellow-800'
      case 'building_manager': return 'bg-blue-100 text-blue-800'
      case 'admin': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getNavigationItems = () => {
    const items = []
    
    // Role-based navigation
    if (profile?.role === 'user') {
      items.push({
        href: '/my-flats',
        label: '🏠 My Flats',
        className: 'bg-green-600 hover:bg-green-700'
      })
    }
    
    if (profile?.role === 'building_manager' || profile?.role === 'admin') {
      items.push({
        href: '/buildings',
        label: '🏢 Manage Buildings',
        className: 'bg-blue-600 hover:bg-blue-700'
      })
    }
    
    if (profile?.role === 'admin') {
      items.push({
        href: '/admin',
        label: '⚡ Admin Panel',
        className: 'bg-red-600 hover:bg-red-700'
      })
    }

    return items
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 rounded-lg p-2">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Apartment Management System
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700 font-medium">
                Welcome, {profile?.full_name || profile?.email}!
              </div>
              <div className={`text-xs px-3 py-1 rounded-full font-semibold ${profile?.role ? getRoleColor(profile.role) : 'bg-gray-100 text-gray-800'}`}>
                {profile?.role ? getRoleDisplayName(profile.role) : 'Loading...'}
              </div>
              
              {/* Dynamic Navigation */}
              {getNavigationItems().map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className={`text-sm text-white px-4 py-2 rounded-md transition-colors font-medium ${item.className}`}
                >
                  {item.label}
                </a>
              ))}
              
              <button
                onClick={handleSignOut}
                className="text-sm text-red-600 hover:text-red-800 font-semibold transition-colors"
              >
                Sign Out
              </button>
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