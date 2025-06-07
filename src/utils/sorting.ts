// src/utils/sorting.ts
"use client"

/**
 * Utility functions for sorting apartment data
 */

/**
 * Sort unit numbers numerically instead of alphabetically
 * Handles mixed alphanumeric unit numbers (e.g., "1", "2A", "10", "A1")
 * 
 * Examples:
 * - Input: ["1", "10", "11", "12", "2", "3", "4", "5", "6", "7", "8", "9"]
 * - Output: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
 * 
 * - Input: ["1A", "1B", "2", "10", "2A"]
 * - Output: ["1A", "1B", "2", "2A", "10"]
 */
export const sortUnitNumbers = <T extends { unit_number: string }>(items: T[]): T[] => {
  return items.sort((a, b) => {
    const aNum = a.unit_number
    const bNum = b.unit_number
    
    // Extract numeric part from the beginning of the string
    const aNumeric = parseInt(aNum.match(/^\d+/)?.[0] || '0')
    const bNumeric = parseInt(bNum.match(/^\d+/)?.[0] || '0')
    
    // If numeric parts are different, sort by them
    if (aNumeric !== bNumeric) {
      return aNumeric - bNumeric
    }
    
    // If numeric parts are the same, sort alphabetically by the full string
    // Using localeCompare with numeric option for natural sorting
    return aNum.localeCompare(bNum, undefined, { 
      numeric: true, 
      sensitivity: 'base' 
    })
  })
}

/**
 * Sort building names alphabetically
 */
export const sortBuildingNames = <T extends { name: string }>(items: T[]): T[] => {
  return items.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Sort addresses by street name and number
 */
export const sortAddresses = <T extends { street_and_number: string }>(items: T[]): T[] => {
  return items.sort((a, b) => {
    return a.street_and_number.localeCompare(b.street_and_number, undefined, {
      numeric: true,
      sensitivity: 'base'
    })
  })
}

/**
 * Sort requests by date (newest first)
 */
export const sortRequestsByDate = <T extends { requested_at: string }>(items: T[]): T[] => {
  return items.sort((a, b) => {
    return new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
  })
}