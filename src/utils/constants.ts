// src/utils/constants.ts - Updated to use centralized config
"use client"

// Import from our new config system
import config, { APP_CONSTANTS } from '@/config'

/**
 * Cache durations - now from centralized config
 */
export const CACHE_DURATION = {
  SHORT: 30000,   // 30 seconds
  MEDIUM: config.ui.cacheExpiryMs, // 5 minutes from config
  LONG: 3600000   // 1 hour
} as const

/**
 * Database table and column names - from centralized config
 */
export const DATABASE_COLUMNS = {
  BUILDING_ADDRESS: APP_CONSTANTS.DATABASE.COLUMNS.BUILDING_ADDRESS,
  PROFILES_TABLE: APP_CONSTANTS.DATABASE.TABLES.PROFILES,
  ADDRESSES_TABLE: APP_CONSTANTS.DATABASE.TABLES.ADDRESSES,
  BUILDINGS_TABLE: APP_CONSTANTS.DATABASE.TABLES.BUILDINGS,
  FLATS_TABLE: APP_CONSTANTS.DATABASE.TABLES.FLATS,
  REQUESTS_TABLE: APP_CONSTANTS.DATABASE.TABLES.REQUESTS,
} as const

/**
 * UI Constants - now from centralized config
 */
export const UI_CONSTANTS = {
  MAX_FLATS_BULK_CREATE: config.business.maxBulkFlats,
  DEFAULT_PAGE_SIZE: config.ui.itemsPerPage,
  DEBOUNCE_DELAY: config.ui.debounceDelayMs,
  TOAST_DURATION: config.ui.toastDurationMs,
  CACHE_DURATION_DEFAULT: config.ui.cacheExpiryMs,
} as const

/**
 * Application routes - from centralized config
 */
export const ROUTES = APP_CONSTANTS.ROUTES

/**
 * Role display names - improved with centralized config
 */
export const ROLE_DISPLAY_NAMES = {
  [APP_CONSTANTS.ROLES.USER]: 'Flat Owner',
  [APP_CONSTANTS.ROLES.BUILDING_MANAGER]: 'Building Manager', 
  [APP_CONSTANTS.ROLES.ADMIN]: 'Administrator',
  [APP_CONSTANTS.ROLES.ACCOUNTANT]: 'Accountant'
} as const

/**
 * Role colors for UI - unchanged but improved typing
 */
export const ROLE_COLORS = {
  [APP_CONSTANTS.ROLES.USER]: 'bg-green-100 text-green-800',
  [APP_CONSTANTS.ROLES.BUILDING_MANAGER]: 'bg-blue-100 text-blue-800',
  [APP_CONSTANTS.ROLES.ADMIN]: 'bg-red-100 text-red-800',
  [APP_CONSTANTS.ROLES.ACCOUNTANT]: 'bg-yellow-100 text-yellow-800'
} as const

/**
 * Status colors - unchanged but with better typing
 */
export const STATUS_COLORS = {
  [APP_CONSTANTS.STATUSES.ADDRESS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [APP_CONSTANTS.STATUSES.ADDRESS.APPROVED]: 'bg-green-100 text-green-800',
  [APP_CONSTANTS.STATUSES.ADDRESS.REJECTED]: 'bg-red-100 text-red-800'
} as const

/**
 * Error messages - enhanced with config awareness
 */
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
    MAX_LENGTH: (field: string, length: number) => `${field} cannot exceed ${length} characters`,
    NUMERIC_ONLY: 'Only numbers are allowed',
    ALPHANUMERIC_ONLY: 'Only letters and numbers are allowed',
    FLAT_NUMBER_INVALID: `Flat number must be 1-${config.business.maxFlatNumberLength} characters, letters and numbers only`,
    BUILDING_NAME_TOO_LONG: `Building name cannot exceed ${config.business.maxBuildingNameLength} characters`,
    TOO_MANY_FLATS: `Cannot create more than ${config.business.maxBulkFlats} flats at once`,
  },
  API: {
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    NOT_FOUND: 'The requested resource was not found',
    FORBIDDEN: 'You do not have permission to perform this action',
    TIMEOUT: `Request timed out after ${config.database.timeoutMs / 1000} seconds`,
  },
  BUSINESS: {
    DUPLICATE_FLAT: 'This flat number already exists in the building',
    FLAT_OCCUPIED: 'This flat is already occupied by another tenant',
    BUILDING_FULL: `Building has reached maximum capacity of ${config.business.maxFlatsPerBuilding} flats`,
    BULK_DISABLED: 'Bulk operations are currently disabled',
  }
} as const

/**
 * Default values - now configuration-aware
 */
export const DEFAULTS = {
  FLAT_CREATION: {
    START_NUMBER: 1,
    END_NUMBER: 10,
    FLOORS: 5,
    FLATS_PER_FLOOR: 4,
    UNIT_PATTERN: '{floor}{unit:02d}',
    MAX_BULK: config.business.maxBulkFlats,
  },
  CACHE: {
    BUILDINGS: config.ui.cacheExpiryMs,
    FLATS: Math.floor(config.ui.cacheExpiryMs * 0.6), // 60% of default
    ADDRESSES: config.ui.cacheExpiryMs * 2, // 2x default for addresses
    USERS: config.ui.cacheExpiryMs * 3, // 3x default for users
  },
  UI: {
    DEBOUNCE_MS: config.ui.debounceDelayMs,
    PAGE_SIZE: config.ui.itemsPerPage,
    TOAST_DURATION_MS: config.ui.toastDurationMs,
  }
} as const

/**
 * Helper functions that use configuration
 */
export const configHelpers = {
  // Check if bulk operations are allowed
  canPerformBulkOperations: (): boolean => config.business.allowBulkOperations,
  
  // Get maximum flats allowed
  getMaxFlatLimit: (): number => config.business.maxFlatsPerBuilding,
  
  // Check if a flat number is valid
  isValidFlatNumber: (unitNumber: string): boolean => {
    if (!unitNumber || unitNumber.trim().length === 0) return false
    if (unitNumber.length > config.business.maxFlatNumberLength) return false
    return /^[A-Za-z0-9]+$/.test(unitNumber.trim())
  },
  
  // Check if building name is valid
  isValidBuildingName: (name: string): boolean => {
    if (!name || name.trim().length === 0) return false
    return name.trim().length <= config.business.maxBuildingNameLength
  },
  
  // Get cache key for consistent caching
  getCacheKey: (type: keyof typeof APP_CONSTANTS.CACHE_KEYS, id: string): string => {
    return `${APP_CONSTANTS.CACHE_KEYS[type]}${id}`
  },
}

// Re-export important types and constants for backward compatibility
export { APP_CONSTANTS }

// Import and re-export types from config to avoid conflicts
export type { UserRole, AddressStatus, RequestStatus } from '@/config'