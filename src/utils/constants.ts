// src/utils/constants.ts
"use client"

/**
 * Database and UI constants for the apartment management system
 */

// Cache durations in milliseconds
export const CACHE_DURATION = {
  SHORT: 30000,   // 30 seconds
  MEDIUM: 300000, // 5 minutes  
  LONG: 3600000   // 1 hour
} as const

// Database table and column names
export const DATABASE_COLUMNS = {
  BUILDING_ADDRESS: 'address', // Use 'address' consistently for buildings table
  PROFILES_TABLE: 'profiles',
  ADDRESSES_TABLE: 'addresses',
  BUILDINGS_TABLE: 'buildings',
  FLATS_TABLE: 'flats',
  REQUESTS_TABLE: 'flat_registration_requests'
} as const

// UI Constants
export const UI_CONSTANTS = {
  MAX_FLATS_BULK_CREATE: 200,
  DEFAULT_PAGE_SIZE: 20,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  CACHE_DURATION_DEFAULT: 60000 // 1 minute
} as const

// Application routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  MY_FLATS: '/my-flats',
  ADDRESS_MANAGEMENT: '/address-management',
  BUILDING_MANAGEMENT: '/building-management',
  ADMIN: '/admin'
} as const

// User roles
export type UserRole = 'user' | 'building_manager' | 'admin' | 'accountant'

// Role display names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  user: 'Flat Owner',
  building_manager: 'Building Manager',
  admin: 'Administrator',
  accountant: 'Accountant'
} as const

// Role colors for UI
export const ROLE_COLORS: Record<UserRole, string> = {
  user: 'bg-green-100 text-green-800',
  building_manager: 'bg-blue-100 text-blue-800',
  admin: 'bg-red-100 text-red-800',
  accountant: 'bg-yellow-100 text-yellow-800'
} as const

// Status types
export type AddressStatus = 'pending' | 'approved' | 'rejected'
export type RequestStatus = 'pending' | 'approved' | 'rejected'

// Status colors
export const STATUS_COLORS: Record<AddressStatus | RequestStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
} as const

// Error messages
export const ERROR_MESSAGES = {
  AUTH: {
    NOT_AUTHENTICATED: 'You must be logged in to access this page',
    INSUFFICIENT_PERMISSIONS: 'You do not have permission to access this page',
    PROFILE_NOT_FOUND: 'Your profile could not be found',
    SESSION_EXPIRED: 'Your session has expired, please log in again'
  },
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PHONE: 'Please enter a valid phone number',
    MIN_LENGTH: (field: string, length: number) => `${field} must be at least ${length} characters`,
    NUMERIC_ONLY: 'Only numbers are allowed'
  },
  API: {
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    NOT_FOUND: 'The requested resource was not found',
    FORBIDDEN: 'You do not have permission to perform this action'
  }
} as const

// Default values
export const DEFAULTS = {
  FLAT_CREATION: {
    START_NUMBER: 1,
    END_NUMBER: 10,
    FLOORS: 5,
    FLATS_PER_FLOOR: 4,
    UNIT_PATTERN: '{floor}{unit:02d}'
  },
  CACHE: {
    BUILDINGS: 300000, // 5 minutes
    FLATS: 180000,     // 3 minutes
    ADDRESSES: 600000, // 10 minutes
    USERS: 900000      // 15 minutes
  }
} as const