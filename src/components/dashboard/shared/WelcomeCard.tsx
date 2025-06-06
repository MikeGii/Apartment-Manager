// src/components/dashboard/shared/WelcomeCard.tsx
"use client"

interface WelcomeCardProps {
  userName: string
  title: string
  subtitle?: string
  gradient?: string
  children?: React.ReactNode
}

export const WelcomeCard = ({ 
  userName, 
  title, 
  subtitle, 
  gradient = "from-blue-600 to-indigo-600",
  children 
}: WelcomeCardProps) => {
  return (
    <div className="bg-white shadow-lg rounded-xl mb-8 overflow-hidden">
      <div className={`bg-gradient-to-r ${gradient} px-6 py-8`}>
        <h2 className="text-3xl font-bold text-white mb-2">
          {title} {userName}
        </h2>
        {subtitle && (
          <p className="text-white text-opacity-90 text-lg">
            {subtitle}
          </p>
        )}
      </div>
      
      {children && (
        <div className="px-6 py-6">
          {children}
        </div>
      )}
    </div>
  )
}