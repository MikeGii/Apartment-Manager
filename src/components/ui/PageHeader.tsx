// src/components/ui/PageHeader.tsx
"use client"

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
            <span className="text-sm text-gray-600">
              Welcome, {profile.full_name || profile.email}!
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
              {profile.role.replace('_', ' ').toUpperCase()}
            </span>
            
            {/* Navigation Links based on role */}
            {profile.role === 'user' && (
              <a
                href="/my-flats"
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md transition-colors"
              >
                My Flats
              </a>
            )}
            
            {(profile.role === 'building_manager' || profile.role === 'admin') && (
              <a
                href="/buildings"
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md transition-colors"
              >
                Manage Buildings
              </a>
            )}
            
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
  )
}