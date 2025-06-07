// src/components/admin/AddressApproval/AdminAddressApproval.tsx
"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type PendingAddress = {
  id: string
  street_and_number: string
  status: string
  created_at: string
  full_address: string
  created_by: string
  creator_email?: string
  creator_name?: string
}

interface AdminAddressApprovalProps {
  adminId: string
  onAddressProcessed: () => void
}

export const AdminAddressApproval = ({ adminId, onAddressProcessed }: AdminAddressApprovalProps) => {
  const [pendingAddresses, setPendingAddresses] = useState<PendingAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [processingAddress, setProcessingAddress] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingAddresses()
  }, [])

  const fetchPendingAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select(`
          id,
          street_and_number,
          status,
          created_at,
          created_by,
          settlements (
            name,
            settlement_type,
            municipalities (
              name,
              counties (
                name
              )
            )
          ),
          profiles!addresses_created_by_fkey (
            email,
            full_name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      const transformedData = (data || []).map((address: any) => {
        const settlement = Array.isArray(address.settlements) ? address.settlements[0] : address.settlements
        const municipality = Array.isArray(settlement?.municipalities) ? settlement.municipalities[0] : settlement?.municipalities
        const county = Array.isArray(municipality?.counties) ? municipality.counties[0] : municipality?.counties
        const creator = Array.isArray(address.profiles) ? address.profiles[0] : address.profiles

        return {
          id: address.id,
          street_and_number: address.street_and_number,
          status: address.status,
          created_at: address.created_at,
          created_by: address.created_by,
          creator_email: creator?.email,
          creator_name: creator?.full_name,
          full_address: settlement 
            ? `${address.street_and_number}, ${settlement.name} ${settlement.settlement_type}, ${municipality.name}, ${county.name}`
            : address.street_and_number
        }
      })

      setPendingAddresses(transformedData)
    } catch (error) {
      console.error('Error fetching pending addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAddressStatus = async (addressId: string, newStatus: 'approved' | 'rejected') => {
    setProcessingAddress(addressId)
    try {
      // Update the address status
      const { error: updateError } = await supabase
        .from('addresses')
        .update({ 
          status: newStatus, 
          approved_by: adminId,
          updated_at: new Date().toISOString() 
        })
        .eq('id', addressId)

      if (updateError) throw updateError

      // If approved, create the building
      if (newStatus === 'approved') {
        const currentAddress = pendingAddresses.find(addr => addr.id === addressId)
        if (currentAddress) {
          const { error: buildingError } = await supabase
            .from('buildings')
            .insert({
              address: addressId,
              name: currentAddress.full_address,
              manager_id: currentAddress.created_by,
              created_at: new Date().toISOString()
            })

          if (buildingError) {
            console.error('Error creating building:', buildingError)
            alert(`Address approved successfully, but there was an issue creating the building: ${buildingError.message}`)
          }
        }
      }

      // Remove from pending list
      setPendingAddresses(prev => prev.filter(addr => addr.id !== addressId))
      
      const message = newStatus === 'approved' 
        ? 'Address approved successfully! Building has been created and the manager can now add flats.'
        : 'Address rejected successfully!'
      
      alert(message)
      onAddressProcessed()
    } catch (error: any) {
      console.error('Error updating address status:', error)
      alert(`Error updating address status: ${error.message || 'Unknown error'}`)
    } finally {
      setProcessingAddress(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading pending addresses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg mb-8">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Pending Address Approvals ({pendingAddresses.length})
        </h3>
        
        {pendingAddresses.length === 0 ? (
          <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No pending address approvals</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested by
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingAddresses.map((address) => (
                  <tr key={address.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {address.full_address}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {address.creator_name || 'No name provided'}
                        </div>
                        <div className="text-sm text-gray-500">{address.creator_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(address.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => updateAddressStatus(address.id, 'approved')}
                        disabled={processingAddress === address.id}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50 font-medium"
                      >
                        {processingAddress === address.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => updateAddressStatus(address.id, 'rejected')}
                        disabled={processingAddress === address.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 font-medium"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}