// Updated PageHeader.tsx - Proper role display without duplicate navigation
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
            
            {/* Clean header - no navigation buttons */}
          </div>
        </div>
      </div>
    </header>
  )
}