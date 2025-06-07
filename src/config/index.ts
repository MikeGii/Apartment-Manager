// src/config/index.ts - Centralized Configuration System
"use client"

// Main application configuration
interface AppConfig {
  // Database settings
  database: {
    maxRetries: number
    timeoutMs: number
  }
  
  // Business rules and limits
  business: {
    maxFlatsPerBuilding: number
    maxFlatNumberLength: number
    maxBuildingNameLength: number
    allowBulkOperations: boolean
    maxBulkFlats: number
  }
  
  // UI settings
  ui: {
    itemsPerPage: number
    debounceDelayMs: number
    toastDurationMs: number
    cacheExpiryMs: number
    enableAnimations: boolean
  }
  
  // Security settings
  security: {
    sessionTimeoutMs: number
    maxLoginAttempts: number
    requireEmailVerification: boolean
  }
  
  // Feature flags
  features: {
    enableNotifications: boolean
    enableAnalytics: boolean
    enableMaintenanceMode: boolean
    enableAdvancedSearch: boolean
  }
  
  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    enableConsole: boolean
    enableRemote: boolean
  }
}

// Configuration with environment variable support
const config: AppConfig = {
  database: {
    maxRetries: parseInt(process.env.NEXT_PUBLIC_DB_MAX_RETRIES || '3'),
    timeoutMs: parseInt(process.env.NEXT_PUBLIC_DB_TIMEOUT_MS || '30000'),
  },
  
  business: {
    maxFlatsPerBuilding: parseInt(process.env.NEXT_PUBLIC_MAX_FLATS_PER_BUILDING || '200'),
    maxFlatNumberLength: parseInt(process.env.NEXT_PUBLIC_MAX_FLAT_NUMBER_LENGTH || '10'),
    maxBuildingNameLength: parseInt(process.env.NEXT_PUBLIC_MAX_BUILDING_NAME_LENGTH || '100'),
    allowBulkOperations: process.env.NEXT_PUBLIC_ALLOW_BULK_OPERATIONS !== 'false',
    maxBulkFlats: parseInt(process.env.NEXT_PUBLIC_MAX_BULK_FLATS || '200'),
  },
  
  ui: {
    itemsPerPage: parseInt(process.env.NEXT_PUBLIC_ITEMS_PER_PAGE || '20'),
    debounceDelayMs: parseInt(process.env.NEXT_PUBLIC_DEBOUNCE_DELAY_MS || '300'),
    toastDurationMs: parseInt(process.env.NEXT_PUBLIC_TOAST_DURATION_MS || '5000'),
    cacheExpiryMs: parseInt(process.env.NEXT_PUBLIC_CACHE_EXPIRY_MS || '300000'),
    enableAnimations: process.env.NEXT_PUBLIC_ENABLE_ANIMATIONS !== 'false',
  },
  
  security: {
    sessionTimeoutMs: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS || '86400000'), // 24h
    maxLoginAttempts: parseInt(process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || '5'),
    requireEmailVerification: process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === 'true',
  },
  
  features: {
    enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableMaintenanceMode: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true',
    enableAdvancedSearch: process.env.NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH === 'true',
  },
  
  logging: {
    level: (process.env.NEXT_PUBLIC_LOG_LEVEL as AppConfig['logging']['level']) || 'info',
    enableConsole: process.env.NODE_ENV === 'development',
    enableRemote: process.env.NEXT_PUBLIC_ENABLE_REMOTE_LOGGING === 'true',
  },
}

export default config

// Feature flags helper functions
export const featureFlags = {
  // Check if a feature is enabled
  isEnabled: (feature: keyof AppConfig['features']): boolean => {
    return config.features[feature]
  },
  
  // Get business limits
  getMaxFlatsPerBuilding: (): number => config.business.maxFlatsPerBuilding,
  getMaxBulkFlats: (): number => config.business.maxBulkFlats,
  
  // Check if bulk operations are allowed
  canPerformBulkOperations: (): boolean => config.business.allowBulkOperations,
  
  // Get UI settings
  getItemsPerPage: (): number => config.ui.itemsPerPage,
  getDebounceDelay: (): number => config.ui.debounceDelayMs,
  getCacheExpiry: (): number => config.ui.cacheExpiryMs,
}

// Environment helpers
export const environment = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  // Get external service URLs
  getSupabaseUrl: (): string => process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  getSupabaseAnonKey: (): string => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
}

// Constants that were scattered throughout your code
export const APP_CONSTANTS = {
  // User roles
  ROLES: {
    USER: 'user',
    BUILDING_MANAGER: 'building_manager', 
    ADMIN: 'admin',
    ACCOUNTANT: 'accountant',
  } as const,
  
  // Status values
  STATUSES: {
    ADDRESS: {
      PENDING: 'pending',
      APPROVED: 'approved', 
      REJECTED: 'rejected',
    },
    REQUEST: {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected', 
    },
  } as const,
  
  // Database table and column names (from your constants.ts)
  DATABASE: {
    TABLES: {
      PROFILES: 'profiles',
      ADDRESSES: 'addresses', 
      BUILDINGS: 'buildings',
      FLATS: 'flats',
      REQUESTS: 'flat_registration_requests',
    },
    COLUMNS: {
      BUILDING_ADDRESS: 'address', // Consistent with Step 1
    },
  } as const,
  
  // Cache keys for consistent caching
  CACHE_KEYS: {
    USER_FLATS: 'user_flats_',
    BUILDING_STATS: 'building_stats_',
    BUILDING_FLATS: 'building_flats_',
    ADDRESS_HIERARCHY: 'address_hierarchy_',
    FLAT_REQUESTS: 'flat_requests_',
  } as const,
  
  // Routes
  ROUTES: {
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    MY_FLATS: '/my-flats',
    ADDRESS_MANAGEMENT: '/address-management',
    BUILDING_MANAGEMENT: '/building-management',
    FLAT_MANAGEMENT: '/flat-management',
    ADMIN: '/admin',
  } as const,
} as const

// Type-safe exports
export type UserRole = typeof APP_CONSTANTS.ROLES[keyof typeof APP_CONSTANTS.ROLES]
export type AddressStatus = typeof APP_CONSTANTS.STATUSES.ADDRESS[keyof typeof APP_CONSTANTS.STATUSES.ADDRESS]
export type RequestStatus = typeof APP_CONSTANTS.STATUSES.REQUEST[keyof typeof APP_CONSTANTS.STATUSES.REQUEST]

// Validation helpers
export const validation = {
  // Validate flat number format and length
  isValidFlatNumber: (unitNumber: string): boolean => {
    if (!unitNumber || unitNumber.trim().length === 0) return false
    if (unitNumber.length > config.business.maxFlatNumberLength) return false
    return /^[A-Za-z0-9]+$/.test(unitNumber.trim())
  },
  
  // Validate building name
  isValidBuildingName: (name: string): boolean => {
    if (!name || name.trim().length === 0) return false
    return name.trim().length <= config.business.maxBuildingNameLength
  },
  
  // Validate email format
  isValidEmail: (email: string): boolean => {
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)
  },
  
  // Validate phone number
  isValidPhone: (phone: string): boolean => {
    return /^[\+]?[0-9\s\-\(\)]{8,}$/.test(phone)
  },
}