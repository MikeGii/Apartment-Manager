// src/components/flats/UserRequestStatus.tsx
"use client"

import { useFlatRequests } from '@/hooks/useFlatRequests'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface UserRequestStatusProps {
  userId: string
}

export const UserRequestStatus = ({ userId }: UserRequestStatusProps) => {
  const { requests, loading } = useFlatRequests(userId, 'user')

  if (loading) {
    return <LoadingSpinner size="sm" message="Loading your requests..." />
  }

  // Only show pending and rejected requests (approved ones are shown as registered flats)
  const pendingRequests = requests.filter(req => req.status === 'pending')
  const rejectedRequests = requests.filter(req => req.status === 'rejected')

  // Don't show the component if there are no pending or rejected requests
  if (pendingRequests.length === 0 && rejectedRequests.length === 0) {
    return null
  }

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Your Registration Requests
        </h3>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Awaiting Approval ({pendingRequests.length})
            </h4>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h5 className="font-medium text-gray-900">
                          Flat {request.unit_number}
                        </h5>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span>Awaiting Approval</span>
                          </div>
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium text-gray-700">Address:</p>
                        <p>{request.address_full}</p>
                        <p className="mt-1">Submitted: {new Date(request.requested_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">⏳ Under Review:</span> Your request is being reviewed by the building manager. You'll be notified once a decision is made.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Requests */}
        {rejectedRequests.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Rejected Requests ({rejectedRequests.length})
            </h4>
            <div className="space-y-3">
              {rejectedRequests.map((request) => (
                <div key={request.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h5 className="font-medium text-gray-900">
                          Flat {request.unit_number}
                        </h5>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span>Rejected</span>
                          </div>
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium text-gray-700">Address:</p>
                        <p>{request.address_full}</p>
                        <p className="mt-1">Rejected: {request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString() : 'Recently'}</p>
                        {request.notes && (
                          <p className="mt-1 font-medium text-red-700">Reason: "{request.notes}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                      <span className="font-medium">❌ Request Rejected:</span> Please contact the building manager for more information or to discuss alternative options.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}