// src/components/buildings/FlatRequestsManagement.tsx
"use client"

import { useState } from 'react'
import { useFlatRequests, FlatRequest } from '@/hooks/useFlatRequests'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface FlatRequestsManagementProps {
  userId: string
  userRole: string
}

export const FlatRequestsManagement = ({ userId, userRole }: FlatRequestsManagementProps) => {
  const { requests, loading, approveRequest, rejectRequest } = useFlatRequests(userId, userRole)
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState<Record<string, string>>({})

  const pendingRequests = requests.filter(req => req.status === 'pending')
  const reviewedRequests = requests.filter(req => req.status !== 'pending')

  const handleApprove = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId))
    try {
      const result = await approveRequest(requestId, notes[requestId])
      if (result.success) {
        alert(result.message)
        setNotes(prev => ({ ...prev, [requestId]: '' }))
      } else {
        alert(result.message)
      }
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
    }
  }

  const handleReject = async (requestId: string) => {
    if (!notes[requestId]?.trim()) {
      alert('Please provide a reason for rejection in the notes field.')
      return
    }
    
    setProcessingRequests(prev => new Set(prev).add(requestId))
    try {
      const result = await rejectRequest(requestId, notes[requestId])
      if (result.success) {
        alert(result.message)
        setNotes(prev => ({ ...prev, [requestId]: '' }))
      } else {
        alert(result.message)
      }
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
    }
  }

  const updateNotes = (requestId: string, value: string) => {
    setNotes(prev => ({ ...prev, [requestId]: value }))
  }

  if (loading) {
    return <LoadingSpinner message="Loading flat requests..." />
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
          Flat Registration Requests
        </h3>

        {/* Pending Requests */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">
              Pending Requests ({pendingRequests.length})
            </h4>
            {pendingRequests.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Action Required
              </span>
            )}
          </div>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No pending registration requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <PendingRequestCard
                  key={request.id}
                  request={request}
                  notes={notes[request.id] || ''}
                  onNotesChange={(value) => updateNotes(request.id, value)}
                  onApprove={() => handleApprove(request.id)}
                  onReject={() => handleReject(request.id)}
                  isProcessing={processingRequests.has(request.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Reviewed Requests */}
        {reviewedRequests.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Recently Reviewed ({reviewedRequests.length})
            </h4>
            <div className="space-y-3">
              {reviewedRequests.slice(0, 5).map((request) => (
                <ReviewedRequestCard key={request.id} request={request} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const PendingRequestCard = ({ 
  request, 
  notes, 
  onNotesChange, 
  onApprove, 
  onReject, 
  isProcessing 
}: {
  request: FlatRequest
  notes: string
  onNotesChange: (value: string) => void
  onApprove: () => void
  onReject: () => void
  isProcessing: boolean
}) => {
  return (
    <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h5 className="font-semibold text-gray-900">
              Flat {request.unit_number} Registration Request
            </h5>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
              Pending Review
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-700">
            <p><span className="font-medium">Building:</span> {request.building_name}</p>
            <p><span className="font-medium">Address:</span> {request.address_full}</p>
            <p><span className="font-medium">Applicant:</span> {request.user_name || 'Name not provided'}</p>
            <p><span className="font-medium">Email:</span> {request.user_email}</p>
            <p><span className="font-medium">Requested:</span> {new Date(request.requested_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (optional for approval, required for rejection)
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Add notes about this request..."
          disabled={isProcessing}
        />
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={onApprove}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Approve'}
        </button>
        <button
          onClick={onReject}
          disabled={isProcessing}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Reject'}
        </button>
      </div>
    </div>
  )
}

const ReviewedRequestCard = ({ request }: { request: FlatRequest }) => {
  const statusColors = {
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800'
  }

  return (
    <div className="border border-gray-200 bg-gray-50 rounded-lg p-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-1">
            <h6 className="font-medium text-gray-900">Flat {request.unit_number}</h6>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[request.status]}`}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <p>{request.user_name || request.user_email}</p>
            <p>Reviewed: {request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString() : 'N/A'}</p>
            {request.notes && <p className="italic mt-1">"{request.notes}"</p>}
          </div>
        </div>
      </div>
    </div>
  )
}