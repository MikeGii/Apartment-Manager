// src/utils/errors.ts - Enhanced Error Handling System
"use client"

import config from '@/config'
import { createLogger } from '@/utils/logger'

const log = createLogger('ErrorSystem')

// Enhanced Error Types
export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, any>
  public readonly timestamp: string

  constructor(
    message: string,
    code: string = 'GENERIC_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context
    this.timestamp = new Date().toISOString()

    // Maintain proper stack trace
    Error.captureStackTrace(this, AppError)
  }
}

// Specific Error Classes
export class ValidationError extends AppError {
  constructor(message: string, field?: string, value?: any) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      true,
      { field, value }
    )
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401, true)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403, true)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND_ERROR', 404, true, { resource })
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string, conflictField?: string) {
    super(message, 'CONFLICT_ERROR', 409, true, { conflictField })
    this.name = 'ConflictError'
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network connection failed') {
    super(message, 'NETWORK_ERROR', 0, true)
    this.name = 'NetworkError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: any) {
    super(
      message,
      'DATABASE_ERROR',
      500,
      true,
      { originalError: originalError?.message || originalError }
    )
    this.name = 'DatabaseError'
  }
}

// Enhanced Error Messages with Configuration
export const ENHANCED_ERROR_MESSAGES = {
  AUTH: {
    NOT_AUTHENTICATED: 'Please sign in to continue',
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_NOT_CONFIRMED: 'Please check your email and confirm your account',
    SESSION_EXPIRED: 'Your session has expired. Please sign in again',
    ACCOUNT_LOCKED: 'Account temporarily locked. Please try again later',
  },
  VALIDATION: {
    REQUIRED_FIELD: (field: string) => `${field} is required`,
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PHONE: 'Please enter a valid phone number',
    INVALID_FLAT_NUMBER: `Flat number must be 1-${config.business.maxFlatNumberLength} characters`,
    TOO_MANY_FLATS: `Cannot create more than ${config.business.maxBulkFlats} flats at once`,
    BUILDING_NAME_TOO_LONG: `Building name cannot exceed ${config.business.maxBuildingNameLength} characters`,
  },
  BUSINESS: {
    FLAT_ALREADY_OCCUPIED: 'This flat is already occupied',
    FLAT_NOT_FOUND: 'Flat not found in this building',
    BUILDING_NOT_FOUND: 'Building not found or not approved',
    DUPLICATE_REQUEST: 'You already have a pending request for this flat',
    BULK_OPERATIONS_DISABLED: 'Bulk operations are currently disabled',
    BUILDING_CAPACITY_EXCEEDED: `Building has reached maximum capacity of ${config.business.maxFlatsPerBuilding} flats`,
  },
  NETWORK: {
    CONNECTION_FAILED: 'Unable to connect. Please check your internet connection',
    TIMEOUT: `Request timed out after ${config.database.timeoutMs / 1000} seconds`,
    SERVER_UNAVAILABLE: 'Service temporarily unavailable. Please try again later',
  },
  SYSTEM: {
    UNEXPECTED_ERROR: 'Something went wrong. Please try again',
    MAINTENANCE_MODE: 'System is under maintenance. Please try again later',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again',
  }
} as const

// Error Handler Class
export class ErrorHandler {
  private static instance: ErrorHandler
  private logger = createLogger('ErrorHandler')

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  // Parse Supabase errors into user-friendly messages
  public parseSupabaseError(error: any): AppError {
    const { code, message, hint, details } = error

    this.logger.error('Supabase error occurred', { code, message, hint, details })

    // Map common Supabase error codes
    switch (code) {
      case 'PGRST116':
        return new NotFoundError('Resource')
      
      case '23505': // Unique violation
        const field = this.extractFieldFromUniqueViolation(message)
        return new ConflictError(
          `${field} already exists`,
          field
        )
      
      case '23503': // Foreign key violation
        return new ValidationError('Referenced item not found')
      
      case '42P17': // Row level security violation
        return new AuthorizationError('Access denied to this resource')
      
      case 'invalid_grant':
        return new AuthenticationError('Invalid credentials')
      
      default:
        // Generic database error
        return new DatabaseError(
          config.logging.level === 'debug' ? message : 'Database operation failed',
          error
        )
    }
  }

  // Parse network errors
  public parseNetworkError(error: any): AppError {
    if (error.name === 'AbortError') {
      return new NetworkError('Request was cancelled')
    }
    
    if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return new NetworkError(ENHANCED_ERROR_MESSAGES.NETWORK.CONNECTION_FAILED)
    }
    
    return new NetworkError('Network request failed')
  }

  // Extract field name from unique violation message
  private extractFieldFromUniqueViolation(message: string): string {
    const match = message.match(/Key \(([^)]+)\)/)
    return match ? match[1] : 'Item'
  }

  // Handle any error and convert to AppError
  public handleError(error: unknown, context?: string): AppError {
    this.logger.error(`Error in ${context || 'application'}`, error)

    // Already an AppError
    if (error instanceof AppError) {
      return error
    }

    // JavaScript Error
    if (error instanceof Error) {
      // Check if it's a Supabase error
      if ('code' in error) {
        return this.parseSupabaseError(error)
      }

      // Check if it's a network error
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return this.parseNetworkError(error)
      }

      // Generic error
      return new AppError(
        config.logging.level === 'debug' ? error.message : ENHANCED_ERROR_MESSAGES.SYSTEM.UNEXPECTED_ERROR,
        'GENERIC_ERROR',
        500,
        true,
        { originalMessage: error.message, context }
      )
    }

    // String error
    if (typeof error === 'string') {
      return new AppError(error, 'STRING_ERROR', 500, true, { context })
    }

    // Unknown error type
    return new AppError(
      ENHANCED_ERROR_MESSAGES.SYSTEM.UNEXPECTED_ERROR,
      'UNKNOWN_ERROR',
      500,
      false,
      { error: String(error), context }
    )
  }

  // Get user-friendly message
  public getUserMessage(error: AppError): string {
    // Return the error message if it's user-friendly
    if (error.isOperational) {
      return error.message
    }

    // For non-operational errors, return generic message
    return ENHANCED_ERROR_MESSAGES.SYSTEM.UNEXPECTED_ERROR
  }

  // Get developer message with context
  public getDeveloperMessage(error: AppError): string {
    return `[${error.code}] ${error.message}${error.context ? ` | Context: ${JSON.stringify(error.context)}` : ''}`
  }

  // Report error (for logging/monitoring)
  public reportError(error: AppError, userId?: string): void {
    const errorReport = {
      timestamp: error.timestamp,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      userId,
      context: error.context,
      stack: error.stack,
      isOperational: error.isOperational
    }

    // Log based on severity
    if (error.statusCode >= 500) {
      this.logger.error('Critical error occurred', errorReport)
    } else if (error.statusCode >= 400) {
      this.logger.warn('Client error occurred', errorReport)
    } else {
      this.logger.info('Error handled', errorReport)
    }

    // In production, you might want to send to external monitoring
    if (config.logging.enableRemote && error.statusCode >= 500) {
      this.sendToMonitoring(errorReport)
    }
  }

  private sendToMonitoring(errorReport: any): void {
    // Implement external error monitoring (Sentry, LogRocket, etc.)
    // This is a placeholder for your monitoring service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(errorReport)
    }
  }
}

// Singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Utility Functions
export const throwIfError = (condition: boolean, message: string, ErrorClass = AppError): void => {
  if (condition) {
    throw new ErrorClass(message)
  }
}

export const throwValidationError = (field: string, value?: any): never => {
  throw new ValidationError(ENHANCED_ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD(field), field, value)
}

export const throwNotFoundError = (resource: string): never => {
  throw new NotFoundError(resource)
}

export const throwConflictError = (message: string, field?: string): never => {
  throw new ConflictError(message, field)
}

// Error Boundary Hook Helper
export const useErrorHandler = () => {
  const handleError = (error: unknown, context?: string): string => {
    const appError = errorHandler.handleError(error, context)
    errorHandler.reportError(appError)
    return errorHandler.getUserMessage(appError)
  }

  const handleAsyncError = async <T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<{ data?: T; error?: string }> => {
    try {
      const data = await operation()
      return { data }
    } catch (error) {
      const errorMessage = handleError(error, context)
      return { error: errorMessage }
    }
  }

  return {
    handleError,
    handleAsyncError
  }
}

// Retry Logic with Exponential Backoff
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = config.database.maxRetries,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on client errors (4xx)
      if (error instanceof AppError && error.statusCode >= 400 && error.statusCode < 500) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      log.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`, error)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw errorHandler.handleError(lastError!, 'retry-operation')
}