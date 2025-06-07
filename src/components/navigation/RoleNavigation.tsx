// src/components/navigation/RoleNavigation.tsx - Role-specific navigation items
"use client"

export interface NavigationItem {
  label: string
  path: string
  icon: string
  disabled?: boolean
}

// User (Flat Owner) Navigation
export const getUserNavigation = (): NavigationItem[] => [
  { label: 'My Flats', path: '/my-flats', icon: '🏠' },
]

// Building Manager Navigation
export const getBuildingManagerNavigation = (): NavigationItem[] => [
  { label: 'Address Management', path: '/address-management', icon: '📍' },
  { label: 'Building Management', path: '/building-management', icon: '🏢' },
  { label: 'Flat Management', path: '/building-management#flats', icon: '🏠' }, // Added #flats to make URL unique
]

// Admin Navigation
export const getAdminNavigation = (): NavigationItem[] => [
  { label: 'Admin Panel', path: '/admin', icon: '⚡' },
]

// Accountant Navigation
export const getAccountantNavigation = (): NavigationItem[] => [
  { label: 'Financial Management', path: '/financial-management', icon: '💰' },
  { label: 'Payment Reports', path: '/payment-reports', icon: '📊' },
]

// Common Navigation Items (available to all roles)
export const getCommonNavigation = (): NavigationItem[] => [
  { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
]

// Settings Navigation Items (available to all roles)
export const getSettingsNavigation = (): NavigationItem[] => [
  { label: 'Notifications', path: '/notifications', icon: '🔔', disabled: true },
  { label: 'Settings', path: '/settings', icon: '⚙️', disabled: true },
]

// Get navigation items based on role
export const getNavigationForRole = (role: string): NavigationItem[] => {
  switch (role) {
    case 'user':
      return getUserNavigation()
    case 'building_manager':
      return getBuildingManagerNavigation()
    case 'admin':
      return getAdminNavigation()
    case 'accountant':
      return getAccountantNavigation()
    default:
      return []
  }
}

// Get role display name
export const getRoleDisplayName = (role: string): string => {
  switch(role) {
    case 'user': return 'Flat Owner'
    case 'accountant': return 'Accountant'
    case 'building_manager': return 'Building Manager'
    case 'admin': return 'Administrator'
    default: return role.replace('_', ' ').toUpperCase()
  }
}