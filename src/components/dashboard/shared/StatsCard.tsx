// src/components/dashboard/shared/StatsCard.tsx - Updated with loading state
"use client"

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red'
  subtitle?: string
  loading?: boolean
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500'
}

export const StatsCard = ({ title, value, icon, color, subtitle, loading = false }: StatsCardProps) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`${colorClasses[color]} rounded-md p-3 text-white`}>
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                icon
              )}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 rounded h-8 w-16"></div>
                  ) : (
                    value
                  )}
                </div>
              </dd>
              {subtitle && (
                <div className="text-sm text-gray-600 mt-1">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 rounded h-4 w-24"></div>
                  ) : (
                    subtitle
                  )}
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}