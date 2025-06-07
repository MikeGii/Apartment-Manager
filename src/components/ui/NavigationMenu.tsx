// src/components/ui/NavigationMenu.tsx - Role-based burger menu navigation
"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { 
  getNavigationForRole, 
  getRoleDisplayName, 
  getCommonNavigation, 
  getSettingsNavigation 
} from '@/components/navigation/RoleNavigation'

interface Profile {
  id: string
  email: string
  full_name?: string
  role: string
}

interface NavigationMenuProps {
  profile: Profile
}

export const NavigationMenu = ({ profile }: NavigationMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  const { signOut } = useAuth()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle navigation
  const handleNavigate = (path: string) => {
    setIsOpen(false)
    router.push(path)
  }

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Get navigation items for the current role
  const navigationItems = getNavigationForRole(profile.role)
  const commonItems = getCommonNavigation()
  const settingsItems = getSettingsNavigation()

  return (
    <div className="relative">
      {/* Burger Menu Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
        aria-expanded="false"
      >
        <span className="sr-only">Open main menu</span>
        {/* Hamburger Icon */}
        <svg
          className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        {/* Close Icon */}
        <svg
          className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
        >
          <div className="py-1">
            {/* Role Title */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">
                {getRoleDisplayName(profile.role)}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {profile.full_name || profile.email}
              </p>
            </div>

            {/* Navigation Items */}
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                disabled={item.disabled}
                className={`group flex items-center w-full px-4 py-3 text-sm transition-colors ${
                  item.disabled 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {item.disabled && (
                  <span className="ml-auto text-xs text-gray-400">Soon</span>
                )}
              </button>
            ))}

            {/* Dashboard Link */}
            {commonItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className="group flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}

            {/* Divider */}
            <div className="border-t border-gray-100 my-1"></div>

            {/* Settings & Actions */}
            {settingsItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                disabled={item.disabled}
                className={`group flex items-center w-full px-4 py-3 text-sm transition-colors ${
                  item.disabled 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {item.disabled && (
                  <span className="ml-auto text-xs text-gray-400">Soon</span>
                )}
              </button>
            ))}

            {/* Divider */}
            <div className="border-t border-gray-100 my-1"></div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="group flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <span className="mr-3 text-lg">🚪</span>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}