// src/components/dashboard/ManagerDashboard.tsx - Building Manager specific dashboard
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
    totalBuildings: 3,
    totalFlats: 45,
    occupiedFlats: 38,
    pendingRequests: 5
  }

  return (
    <>
      {/* Welcome Section */}
      <WelcomeCard
        userName={userName}
        title="Welcome to Your Management Hub!"
        subtitle="Oversee your buildings, manage tenants, and handle property operations"
        gradient="from-blue-600 to-indigo-600"
      >
        {/* Quick Options Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Manage Buildings */}
          <QuickActionCard
            href="/buildings"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            title="My Buildings"
            subtitle="Manage properties"
            gradient="from-blue-500 to-blue-600 border-blue-300"
          />

          {/* Pending Requests */}
          <QuickActionCard
            href="/buildings#requests"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="Pending Requests"
            subtitle={`${mockStats.pendingRequests} awaiting review`}
            gradient="from-yellow-500 to-orange-600 border-yellow-300"
          />

          {/* Tenant Management */}
          <QuickActionCard
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title="Tenant Management"
            subtitle="Coming soon"
            gradient="from-green-500 to-green-600 border-green-300"
            disabled
          />

          {/* Reports */}
          <QuickActionCard
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            title="Reports"
            subtitle="Coming soon"
            gradient="from-purple-500 to-purple-600 border-purple-300"
            disabled
          />
        </div>
      </WelcomeCard>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Buildings"
          value={mockStats.totalBuildings}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          color="blue"
        />
        
        <StatsCard
          title="Total Flats"
          value={mockStats.totalFlats}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
          }
          color="green"
        />
        
        <StatsCard
          title="Occupied Flats"
          value={mockStats.occupiedFlats}
          subtitle={`${Math.round((mockStats.occupiedFlats / mockStats.totalFlats) * 100)}% occupancy`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          color="purple"
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
        />
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-6">
          <h3 className="text-lg leading-6 font-semibold text-gray-900 mb-6">
            Management Tools
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionButton
              href="/buildings"
              variant="primary"
              icon={<span>🏢</span>}
            >
              Manage Buildings
            </ActionButton>
            <ActionButton
              href="/buildings#requests"
              variant="warning"
              icon={<span>✅</span>}
            >
              Review Requests
            </ActionButton>
            <ActionButton
              variant="success"
              icon={<span>➕</span>}
              disabled
            >
              Add New Building
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
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="bg-blue-100 rounded-full p-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New tenant registration request</p>
                <p className="text-xs text-gray-500">Flat 2A at Sõpruse 10 - 2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="bg-green-100 rounded-full p-2">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Flat registration approved</p>
                <p className="text-xs text-gray-500">Flat 1B at Tallinna 15 - 1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}