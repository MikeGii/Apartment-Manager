// src/utils/logger.ts
"use client"

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  
  private log(level: LogLevel, context: string, message: string, data?: any) {
    if (!this.isDevelopment && level === 'debug') return
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    const logMessage = `[${timestamp}] [${context}] ${message}`
    
    switch (level) {
      case 'debug':
        console.log(`🔍 ${logMessage}`, data || '')
        break
      case 'info':
        console.info(`ℹ️ ${logMessage}`, data || '')
        break
      case 'warn':
        console.warn(`⚠️ ${logMessage}`, data || '')
        break
      case 'error':
        console.error(`❌ ${logMessage}`, data || '')
        break
    }
  }
  
  debug(context: string, message: string, data?: any) {
    this.log('debug', context, message, data)
  }
  
  info(context: string, message: string, data?: any) {
    this.log('info', context, message, data)
  }
  
  warn(context: string, message: string, data?: any) {
    this.log('warn', context, message, data)
  }
  
  error(context: string, message: string, data?: any) {
    this.log('error', context, message, data)
  }
}

export const logger = new Logger()

// Utility function for creating context-specific loggers
export const createLogger = (context: string) => ({
  debug: (message: string, data?: any) => logger.debug(context, message, data),
  info: (message: string, data?: any) => logger.info(context, message, data),
  warn: (message: string, data?: any) => logger.warn(context, message, data),
  error: (message: string, data?: any) => logger.error(context, message, data)
})

// Example usage in hooks:
// const log = createLogger('useAddresses')
// log.debug('Fetching addresses for user:', userId)
// log.error('Failed to fetch addresses:', error)