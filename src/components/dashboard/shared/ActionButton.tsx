// src/components/dashboard/shared/ActionButton.tsx
"use client"

interface ActionButtonProps {
  href?: string
  onClick?: () => void
  icon: React.ReactNode
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export const ActionButton = ({ 
  href, 
  onClick, 
  icon, 
  children, 
  variant = 'primary',
  size = 'md',
  disabled = false 
}: ActionButtonProps) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base'
  }

  const baseClasses = `${variants[variant]} ${sizes[size]} rounded-md font-semibold transition-colors flex items-center space-x-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`

  const content = (
    <>
      {icon}
      <span>{children}</span>
    </>
  )

  if (href && !disabled) {
    return (
      <a href={href} className={baseClasses}>
        {content}
      </a>
    )
  }

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={baseClasses}
    >
      {content}
    </button>
  )
}