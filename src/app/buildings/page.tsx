// src/app/buildings/page.tsx - Redirect to building-management
"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BuildingsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Immediate redirect to building-management
    router.replace('/building-management')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting...</h2>
        <p className="text-gray-600">
          The Buildings page has been moved to Building Management.
        </p>
      </div>
    </div>
  )
}