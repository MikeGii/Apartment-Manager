// src/app/api/flats/bulk-create/route.ts - Server-side compatible API route
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [BulkFlatAPI] API route called!')
    
    const { buildingId, flatNumbers } = await request.json()
    console.log('🔍 [BulkFlatAPI] Request data:', { buildingId, flatCount: flatNumbers?.length })

    // Validate input
    if (!buildingId || !flatNumbers || !Array.isArray(flatNumbers)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid input: buildingId and flatNumbers array are required'
      }, { status: 400 })
    }

    if (flatNumbers.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No flat numbers provided'
      }, { status: 400 })
    }

    if (flatNumbers.length > 200) {
      return NextResponse.json({
        success: false,
        message: 'Cannot create more than 200 flats at once'
      }, { status: 400 })
    }

    console.log(`ℹ️ [BulkFlatAPI] Creating ${flatNumbers.length} flats for building ${buildingId}`)

    // Verify building exists
    const { data: building, error: buildingError } = await supabase
      .from('buildings')
      .select('id, name')
      .eq('id', buildingId)
      .single()

    if (buildingError || !building) {
      console.error('❌ [BulkFlatAPI] Building not found:', buildingError)
      return NextResponse.json({
        success: false,
        message: 'Building not found'
      }, { status: 404 })
    }

    // Check for existing flats with the same unit numbers
    const { data: existingFlats, error: existingError } = await supabase
      .from('flats')
      .select('unit_number')
      .eq('building_id', buildingId)
      .in('unit_number', flatNumbers)

    if (existingError) {
      console.error('❌ [BulkFlatAPI] Error checking existing flats:', existingError)
      return NextResponse.json({
        success: false,
        message: 'Error checking existing flats'
      }, { status: 500 })
    }

    const existingUnitNumbers = new Set(existingFlats?.map(f => f.unit_number) || [])
    const newFlatNumbers = flatNumbers.filter(num => !existingUnitNumbers.has(num))
    const duplicateNumbers = flatNumbers.filter(num => existingUnitNumbers.has(num))

    if (newFlatNumbers.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'All flat numbers already exist in this building'
      }, { status: 400 })
    }

    // Prepare flats for insertion
    const flatsToCreate = newFlatNumbers.map(unitNumber => ({
      building_id: buildingId,
      unit_number: unitNumber.toString().trim(),
      created_at: new Date().toISOString()
    }))

    console.log(`🔍 [BulkFlatAPI] Preparing to create ${flatsToCreate.length} new flats`)

    // Batch insert flats
    const { data: createdFlats, error: insertError } = await supabase
      .from('flats')
      .insert(flatsToCreate)
      .select('id, unit_number')

    if (insertError) {
      console.error('❌ [BulkFlatAPI] Error creating flats:', insertError)
      return NextResponse.json({
        success: false,
        message: `Error creating flats: ${insertError.message}`
      }, { status: 500 })
    }

    const createdCount = createdFlats?.length || 0
    console.log(`✅ [BulkFlatAPI] Successfully created ${createdCount} flats for building ${buildingId}`)

    // Prepare response message
    let message = `Successfully created ${createdCount} flats`
    if (duplicateNumbers.length > 0) {
      message += `. Skipped ${duplicateNumbers.length} existing flats: ${duplicateNumbers.slice(0, 5).join(', ')}`
      if (duplicateNumbers.length > 5) {
        message += ` and ${duplicateNumbers.length - 5} more`
      }
    }

    return NextResponse.json({
      success: true,
      message,
      createdCount,
      skippedCount: duplicateNumbers.length,
      duplicates: duplicateNumbers
    })

  } catch (error) {
    console.error('❌ [BulkFlatAPI] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

// Also add GET method for testing
export async function GET() {
  console.log('✅ [BulkFlatAPI] GET request received')
  return NextResponse.json({
    success: true,
    message: 'Bulk flat creation API is running',
    methods: ['POST'],
    timestamp: new Date().toISOString()
  })
}