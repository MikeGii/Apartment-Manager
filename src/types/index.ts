// src/types/index.ts - Shared types to reduce duplication

export interface BaseProfile {
  id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  created_at: string
  updated_at?: string
}

export type UserRole = 'user' | 'building_manager' | 'admin' | 'accountant'

export interface Address {
  id: string
  street_and_number: string
  status: AddressStatus
  full_address: string
  settlement_id: string
  created_by?: string
  created_at?: string
}

export type AddressStatus = 'pending' | 'approved' | 'rejected'

export interface Building {
  id: string
  name: string
  address: string
  manager_id: string
  created_at?: string
}

export interface Flat {
  id: string
  building_id: string
  unit_number: string
  tenant_id: string | null
  created_at?: string
}

export interface FlatWithTenant extends Flat {
  tenant_email?: string
  tenant_name?: string
  tenant_phone?: string
}

export interface FlatRegistrationRequest {
  id: string
  flat_id: string
  user_id: string
  status: RequestStatus
  requested_at: string
  reviewed_at?: string
  reviewed_by?: string
  notes?: string
}

export type RequestStatus = 'pending' | 'approved' | 'rejected'

// Form data types
export interface AddressFormData {
  county_id: string
  municipality_id: string
  settlement_id: string
  street_and_number: string
}

export interface FlatFormData {
  unit_number: string
}

export interface FlatRegistrationData extends AddressFormData {
  unit_number: string
}

// Location hierarchy types
export interface County {
  id: string
  name: string
}

export interface Municipality {
  id: string
  name: string
  county_id: string
}

export interface Settlement {
  id: string
  name: string
  settlement_type: string
  municipality_id: string
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

// Hook response types
export interface UseAsyncResult<T> {
  data: T
  loading: boolean
  error: string | null
}

// Constants
export const CACHE_DURATION = {
  SHORT: 30000,   // 30 seconds
  MEDIUM: 300000, // 5 minutes
  LONG: 3600000   // 1 hour
} as const

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  user: 'Flat Owner',
  building_manager: 'Building Manager',
  admin: 'Administrator',
  accountant: 'Accountant'
} as const

export const ROLE_COLORS: Record<UserRole, string> = {
  user: 'bg-green-100 text-green-800',
  building_manager: 'bg-blue-100 text-blue-800',
  admin: 'bg-red-100 text-red-800',
  accountant: 'bg-yellow-100 text-yellow-800'
} as const

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

// src/utils/constants.ts - Database and UI constants

export const DATABASE_COLUMNS = {
  BUILDING_ADDRESS: 'address', // Use 'address' consistently
  PROFILES_TABLE: 'profiles',
  ADDRESSES_TABLE: 'addresses',
  BUILDINGS_TABLE: 'buildings',
  FLATS_TABLE: 'flats',
  REQUESTS_TABLE: 'flat_registration_requests'
} as const

export const UI_CONSTANTS = {
  MAX_FLATS_BULK_CREATE: 200,
  DEFAULT_PAGE_SIZE: 20,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000
} as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  MY_FLATS: '/my-flats',
  ADDRESS_MANAGEMENT: '/address-management',
  BUILDING_MANAGEMENT: '/building-management',
  ADMIN: '/admin'
} as const