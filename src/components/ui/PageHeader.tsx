// Updated PageHeader.tsx - With Navigation Menu
"use client"

import { NavigationMenu } from './NavigationMenu'
import { getRoleDisplayName } from '@/components/navigation/RoleNavigation'

interface Profile {
  id: string
  email: string
  full_name?: string
  role: string
}

interface PageHeaderProps {
  title: string
  profile: Profile
}

export const PageHeader = ({ title, profile }: PageHeaderProps) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {title}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700 font-medium">
              Welcome, {profile.full_name || profile.email}!
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
              {getRoleDisplayName(profile.role)}
            </span>
            
            {/* Navigation Menu */}
            <NavigationMenu profile={profile} />
          </div>
        </div>
      </div>
    </header>
  )
}