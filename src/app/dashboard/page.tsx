// src/app/dashboard/page.tsx - Improved User Dashboard
"use client"

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
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
    <ProtectedRoute>
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
                <div className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
                  {profile?.role ? getRoleDisplayName(profile.role) : 'Loading...'}
                </div>
                
                {/* Role-based Navigation */}
                {profile?.role === 'user' && (
                  <a
                    href="/my-flats"
                    className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
                  >
                    🏠 My Flats
                  </a>
                )}
                
                {(profile?.role === 'building_manager' || profile?.role === 'admin') && (
                  <a
                    href="/buildings"
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
                  >
                    🏢 Manage Buildings
                  </a>
                )}
                
                {profile?.role === 'admin' && (
                  <a
                    href="/admin"
                    className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
                  >
                    ⚡ Admin Panel
                  </a>
                )}
                
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

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            
            {/* USER ROLE SPECIFIC DASHBOARD */}
            {profile?.role === 'user' && (
              <>
                {/* Welcome Section - User */}
                <div className="bg-white shadow-lg rounded-xl mb-8 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Welcome to Your Dashboard! {profile?.full_name || profile?.email?.split('@')[0]}
                    </h2>
                    <p className="text-blue-100 text-lg">
                      Manage your flat registrations and stay connected with building management
                    </p>
                  </div>
                  
                  {/* Quick Options Row */}
                  <div className="px-6 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* My Flats */}
                      <a
                        href="/my-flats"
                        className="group bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="bg-green-600 rounded-lg p-3 group-hover:bg-green-700 transition-colors">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-green-800">My Flats</h3>
                            <p className="text-sm text-gray-600">Manage your properties</p>
                          </div>
                        </div>
                      </a>

                      {/* Notifications */}
                      <button className="group bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 hover:shadow-md cursor-not-allowed opacity-75">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-600 rounded-lg p-3 group-hover:bg-blue-700 transition-colors">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19l1-7h14l1 7H4z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-800">Notifications</h3>
                            <p className="text-sm text-gray-600">Coming soon</p>
                          </div>
                        </div>
                      </button>

                      {/* My Settings */}
                      <button className="group bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-xl p-6 hover:from-purple-100 hover:to-violet-100 hover:border-purple-300 transition-all duration-200 hover:shadow-md cursor-not-allowed opacity-75">
                        <div className="flex items-center space-x-4">
                          <div className="bg-purple-600 rounded-lg p-3 group-hover:bg-purple-700 transition-colors">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-purple-800">My Settings</h3>
                            <p className="text-sm text-gray-600">Coming soon</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Current Quick Actions - Keep for now */}
                <div className="bg-white shadow rounded-lg mb-8">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-semibold text-gray-900 mb-4">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <a
                        href="/my-flats"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-sm font-semibold transition-colors flex items-center space-x-2"
                      >
                        <span>🏠</span>
                        <span>Register New Flat</span>
                      </a>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-sm font-semibold transition-colors flex items-center space-x-2">
                        <span>📋</span>
                        <span>View My Requests</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* How It Works - Keep for now */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-semibold text-gray-900 mb-4">
                      How It Works
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                          <span className="text-blue-600 font-bold text-sm">1</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Register Your Flat</h4>
                          <p className="text-gray-600 text-sm font-medium">Find your building and submit a registration request for your flat.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                          <span className="text-blue-600 font-bold text-sm">2</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Wait for Approval</h4>
                          <p className="text-gray-600 text-sm font-medium">Building manager will review and approve your registration request.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                          <span className="text-blue-600 font-bold text-sm">3</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Manage Your Property</h4>
                          <p className="text-gray-600 text-sm font-medium">Access your registered flats and communicate with building management.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* OTHER ROLES - Keep existing content for now */}
            {profile?.role !== 'user' && (
              <>
                {/* Welcome Section */}
                <div className="bg-white shadow rounded-lg mb-8">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Welcome to Your Dashboard! 🎉
                    </h2>
                    
                    {/* Role-specific welcome messages */}
                    {profile?.role === 'building_manager' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">🏢</div>
                          <div>
                            <h3 className="font-semibold text-blue-900">Building Manager Dashboard</h3>
                            <p className="text-blue-700 text-sm mt-1 font-medium">
                              Manage your buildings, approve tenant requests, add flats, and oversee building operations.
                            </p>
                            <a
                              href="/buildings"
                              className="inline-flex items-center mt-3 text-sm font-semibold text-blue-600 hover:text-blue-500"
                            >
                              Access Building Management →
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {profile?.role === 'admin' && (
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
                                href="/buildings"
                                className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-500"
                              >
                                Buildings →
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {profile?.role === 'accountant' && (
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
                    )}
                  </div>
                </div>

                {/* Quick Actions for other roles */}
                <div className="bg-white shadow rounded-lg mb-8">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-semibold text-gray-900 mb-4">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      
                      {(profile?.role === 'building_manager' || profile?.role === 'admin') && (
                        <>
                          <a
                            href="/buildings"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-sm font-semibold transition-colors flex items-center space-x-2"
                          >
                            <span>🏢</span>
                            <span>Manage Buildings</span>
                          </a>
                          <a
                            href="/buildings"
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-sm font-semibold transition-colors flex items-center space-x-2"
                          >
                            <span>✅</span>
                            <span>Approve Requests</span>
                          </a>
                        </>
                      )}

                      {profile?.role === 'admin' && (
                        <a
                          href="/admin"
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-md text-sm font-semibold transition-colors flex items-center space-x-2"
                        >
                          <span>⚡</span>
                          <span>Admin Settings</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}