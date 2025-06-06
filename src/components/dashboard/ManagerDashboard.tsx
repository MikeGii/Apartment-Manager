// src/components/dashboard/ManagerDashboard.tsx - Updated with separate page links
"use client"

import { WelcomeCard } from './shared/WelcomeCard'
import { QuickActionCard } from './shared/QuickActionCard'
import { StatsCard } from './shared/StatsCard'
import { ActionButton } from './shared/ActionButton'

interface ManagerDashboardProps {
  userName: string
}

export const ManagerDashboard = ({ userName }: ManagerDashboardProps) => {
  // TODO: Replace with actual data from hooks
  const mockStats = {
    totalAddresses: 8,
    totalBuildings: 3,
    totalFlats: 45,
    occupiedFlats: 38,
    pendingRequests: 5,
    vacantFlats: 7
  }

  return (
    <>
      {/* Welcome Section */}
      <WelcomeCard
        userName={userName}
        title="Welcome to Your Management Hub!"
        subtitle="Oversee addresses, buildings, flats, and tenant operations with comprehensive management tools"
        gradient="from-blue-600 to-indigo-600"
      >
        {/* Manager Quick Options - Updated Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Address Management */}
          <QuickActionCard
            href="/address-management"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="Address Management"
            subtitle="Submit & track address requests"
            gradient="from-emerald-500 to-green-600 border-emerald-300"
          />

          {/* Building Management */}
          <QuickActionCard
            href="/building-management"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            title="Building Management"
            subtitle="Manage buildings & flats"
            gradient="from-blue-500 to-blue-600 border-blue-300"
          />

          {/* Registration Requests - Legacy link for now */}
          <QuickActionCard
            href="/buildings"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="Registration Requests"
            subtitle={`${mockStats.pendingRequests} pending reviews`}
            gradient="from-orange-500 to-red-600 border-orange-300"
          />

          {/* Notifications */}
          <QuickActionCard
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19l1-7h14l1 7H4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="Notifications"
            subtitle="Coming soon"
            gradient="from-yellow-500 to-amber-600 border-yellow-300"
            disabled
          />

          {/* My Settings */}
          <QuickActionCard
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="My Settings"
            subtitle="Coming soon"
            gradient="from-gray-500 to-slate-600 border-gray-300"
            disabled
          />

          {/* Reports & Analytics */}
          <QuickActionCard
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            title="Reports & Analytics"
            subtitle="Coming soon"
            gradient="from-indigo-500 to-purple-600 border-indigo-300"
            disabled
          />
        </div>
      </WelcomeCard>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Addresses"
          value={mockStats.totalAddresses}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          color="green"
          subtitle="Approved addresses"
        />
        
        <StatsCard
          title="Total Buildings"
          value={mockStats.totalBuildings}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          color="blue"
          subtitle="Under management"
        />
        
        <StatsCard
          title="Total Flats"
          value={mockStats.totalFlats}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
          }
          color="purple"
          subtitle={`${mockStats.occupiedFlats} occupied, ${mockStats.vacantFlats} vacant`}
        />
        
        <StatsCard
          title="Pending Requests"
          value={mockStats.pendingRequests}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="yellow"
          subtitle="Awaiting review"
        />
      </div>

      {/* Quick Management Tools */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-6">
          <h3 className="text-lg leading-6 font-semibold text-gray-900 mb-6">
            Quick Management Tools
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionButton
              href="/address-management"
              variant="success"
              icon={<span>📍</span>}
            >
              Add New Address
            </ActionButton>
            <ActionButton
              href="/building-management"
              variant="primary"
              icon={<span>🏢</span>}
            >
              Manage Buildings
            </ActionButton>
            <ActionButton
              href="/building-management"
              variant="secondary"
              icon={<span>🏠</span>}
            >
              Manage Flats
            </ActionButton>
            <ActionButton
              href="/buildings"
              variant="warning"
              icon={<span>✅</span>}
            >
              Review Requests
            </ActionButton>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-6">
          <h3 className="text-lg leading-6 font-semibold text-gray-900 mb-6">
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="bg-orange-100 rounded-full p-2">
                <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New tenant registration request</p>
                <p className="text-xs text-gray-500">Flat 2A at Sõpruse 10 - 2 hours ago</p>
              </div>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                Pending
              </span>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="bg-green-100 rounded-full p-2">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Address request approved</p>
                <p className="text-xs text-gray-500">Tallinna 15 - 1 day ago</p>
              </div>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Approved
              </span>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="bg-blue-100 rounded-full p-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New flat added</p>
                <p className="text-xs text-gray-500">Flat 3B at Tartu 25 - 2 days ago</p>
              </div>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                New
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}