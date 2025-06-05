// src/app/dashboard/page.tsx
"use client"

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      console.log('Dashboard - Signing out...')
      await signOut()
      console.log('Dashboard - Sign out successful, redirecting to login')
      router.push('/login')
    } catch (error) {
      console.error('Dashboard - Sign out error:', error)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Apartment Management System
              </h1>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Welcome, {profile?.full_name || profile?.email}!
                </div>
                <div className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  {profile?.role?.replace('_', ' ').toUpperCase()}
                </div>
                
                {/* Role-based Navigation */}
                {profile?.role === 'user' && (
                  <a
                    href="/my-flats"
                    className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    🏠 My Flats
                  </a>
                )}
                
                {(profile?.role === 'building_manager' || profile?.role === 'admin') && (
                  <a
                    href="/buildings"
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    🏢 Manage Buildings
                  </a>
                )}
                
                {profile?.role === 'admin' && (
                  <a
                    href="/admin"
                    className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    ⚡ Admin Panel
                  </a>
                )}
                
                <button
                  onClick={handleSignOut}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            
            {/* Welcome Section */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to Your Dashboard! 🎉
                </h2>
                
                {/* Role-specific welcome messages */}
                {profile?.role === 'user' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">🏠</div>
                      <div>
                        <h3 className="font-medium text-green-900">Tenant Dashboard</h3>
                        <p className="text-green-700 text-sm mt-1">
                          Manage your flat registrations, view your registered properties, and submit requests to building managers.
                        </p>
                        <a
                          href="/my-flats"
                          className="inline-flex items-center mt-3 text-sm font-medium text-green-600 hover:text-green-500"
                        >
                          Get started with My Flats →
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {profile?.role === 'building_manager' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">🏢</div>
                      <div>
                        <h3 className="font-medium text-blue-900">Building Manager Dashboard</h3>
                        <p className="text-blue-700 text-sm mt-1">
                          Manage your buildings, approve tenant requests, add flats, and oversee building operations.
                        </p>
                        <a
                          href="/buildings"
                          className="inline-flex items-center mt-3 text-sm font-medium text-blue-600 hover:text-blue-500"
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
                        <h3 className="font-medium text-red-900">Administrator Dashboard</h3>
                        <p className="text-red-700 text-sm mt-1">
                          Full system access: manage users, approve addresses, oversee all buildings, and system administration.
                        </p>
                        <div className="flex space-x-4 mt-3">
                          <a
                            href="/admin"
                            className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-500"
                          >
                            Admin Panel →
                          </a>
                          <a
                            href="/buildings"
                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            Buildings →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {profile?.role === 'user' && (
                    <>
                      <a
                        href="/my-flats"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                      >
                        <span>🏠</span>
                        <span>Register New Flat</span>
                      </a>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center space-x-2">
                        <span>📋</span>
                        <span>View My Requests</span>
                      </button>
                    </>
                  )}

                  {(profile?.role === 'building_manager' || profile?.role === 'admin') && (
                    <>
                      <a
                        href="/buildings"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                      >
                        <span>🏢</span>
                        <span>Manage Buildings</span>
                      </a>
                      <a
                        href="/buildings"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                      >
                        <span>✅</span>
                        <span>Approve Requests</span>
                      </a>
                    </>
                  )}

                  {profile?.role === 'admin' && (
                    <a
                      href="/admin"
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      <span>⚡</span>
                      <span>Admin Settings</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Getting Started Guide */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  How It Works
                </h3>
                
                {profile?.role === 'user' && (
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                        <span className="text-blue-600 font-semibold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Register Your Flat</h4>
                        <p className="text-gray-600 text-sm">Find your building and submit a registration request for your flat.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                        <span className="text-blue-600 font-semibold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Wait for Approval</h4>
                        <p className="text-gray-600 text-sm">Building manager will review and approve your registration request.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                        <span className="text-blue-600 font-semibold text-sm">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Manage Your Property</h4>
                        <p className="text-gray-600 text-sm">Access your registered flats and communicate with building management.</p>
                      </div>
                    </div>
                  </div>
                )}

                {(profile?.role === 'building_manager' || profile?.role === 'admin') && (
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                        <span className="text-green-600 font-semibold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Add Your Buildings</h4>
                        <p className="text-gray-600 text-sm">Submit building addresses for admin approval and start managing.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                        <span className="text-green-600 font-semibold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Create Flats</h4>
                        <p className="text-gray-600 text-sm">Add individual flats to your approved buildings.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                        <span className="text-green-600 font-semibold text-sm">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Manage Tenants</h4>
                        <p className="text-gray-600 text-sm">Review tenant applications and manage occupancy.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}