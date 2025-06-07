// src/components/admin/AdminStats.tsx
"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface AdminStatsProps {
  className?: string
}

export const AdminStats = ({ className = '' }: AdminStatsProps) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    buildingManagers: 0,
    pendingAddresses: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Get user counts
      const { data: users } = await supabase
        .from('profiles')
        .select('role')

      // Get pending addresses count
      const { data: addresses } = await supabase
        .from('addresses')
        .select('id')
        .eq('status', 'pending')

      const totalUsers = users?.length || 0
      const buildingManagers = users?.filter(u => u.role === 'building_manager').length || 0
      const pendingAddresses = addresses?.length || 0

      setStats({ totalUsers, buildingManagers, pendingAddresses })
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
            <div className="p-5">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ${className}`}>
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">👥</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">🏢</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Building Managers</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.buildingManagers}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">📍</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Pending Addresses</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.pendingAddresses}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}