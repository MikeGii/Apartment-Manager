// src/components/dashboard/UserDashboard.tsx - User role specific dashboard
"use client"

import { WelcomeCard } from './shared/WelcomeCard'
import { QuickActionCard } from './shared/QuickActionCard'
import { ActionButton } from './shared/ActionButton'

interface UserDashboardProps {
  userName: string
}

export const UserDashboard = ({ userName }: UserDashboardProps) => {
  return (
    <>
      {/* Welcome Section */}
      <WelcomeCard
        userName={userName}
        title="Welcome to Your Dashboard!"
        subtitle="Manage your flat registrations and stay connected with building management"
        gradient="from-green-600 to-emerald-600"
      >
        {/* Quick Options Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* My Flats */}
          <QuickActionCard
            href="/my-flats"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            }
            title="My Flats"
            subtitle="Manage your properties"
            gradient="from-green-500 to-green-600 border-green-300"
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
            gradient="from-blue-500 to-blue-600 border-blue-300"
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
            gradient="from-purple-500 to-purple-600 border-purple-300"
            disabled
          />
        </div>
      </WelcomeCard>

      {/* Quick Actions Section */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-6">
          <h3 className="text-lg leading-6 font-semibold text-gray-900 mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionButton
              href="/my-flats"
              variant="success"
              icon={<span>🏠</span>}
            >
              Register New Flat
            </ActionButton>
            <ActionButton
              variant="primary"
              icon={<span>📋</span>}
              disabled
            >
              View My Requests
            </ActionButton>
            <ActionButton
              variant="secondary"
              icon={<span>💬</span>}
              disabled
            >
              Contact Support
            </ActionButton>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-6">
          <h3 className="text-lg leading-6 font-semibold text-gray-900 mb-6">
            How It Works
          </h3>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-green-100 rounded-full p-3 flex-shrink-0">
                <span className="text-green-600 font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Register Your Flat</h4>
                <p className="text-gray-600 text-sm">Find your building and submit a registration request for your flat.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-green-100 rounded-full p-3 flex-shrink-0">
                <span className="text-green-600 font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Wait for Approval</h4>
                <p className="text-gray-600 text-sm">Building manager will review and approve your registration request.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-green-100 rounded-full p-3 flex-shrink-0">
                <span className="text-green-600 font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Manage Your Property</h4>
                <p className="text-gray-600 text-sm">Access your registered flats and communicate with building management.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}