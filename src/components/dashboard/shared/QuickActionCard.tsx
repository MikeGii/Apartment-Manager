// src/components/dashboard/shared/QuickActionCard.tsx
"use client"

interface QuickActionProps {
  href?: string
  onClick?: () => void
  icon: React.ReactNode
  title: string
  subtitle: string
  gradient: string
  disabled?: boolean
}

export const QuickActionCard = ({ 
  href, 
  onClick, 
  icon, 
  title, 
  subtitle, 
  gradient,
  disabled = false 
}: QuickActionProps) => {
  const baseClasses = `group bg-gradient-to-br ${gradient} border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-md`
  const disabledClasses = disabled ? "cursor-not-allowed opacity-75" : "hover:border-opacity-80"
  
  const content = (
    <div className="flex items-center space-x-4">
      <div className="bg-white bg-opacity-20 rounded-lg p-3 group-hover:bg-opacity-30 transition-all">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-white text-opacity-80">{subtitle}</p>
      </div>
    </div>
  )

  if (href && !disabled) {
    return (
      <a href={href} className={`${baseClasses} ${disabledClasses}`}>
        {content}
      </a>
    )
  }

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClasses} ${disabledClasses} w-full text-left`}
    >
      {content}
    </button>
  )
}