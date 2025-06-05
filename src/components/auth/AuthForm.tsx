"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'

type FormData = {
  email: string
  password: string
  fullName?: string
  role?: string
  county_id?: string
  municipality_id?: string
  settlement_id?: string
  address_id?: string
  flat_number?: string
}

type AuthFormProps = {
  onSuccess?: () => void
}

type County = {
  id: string
  name: string
}

type Municipality = {
  id: string
  name: string
}

type Settlement = {
  id: string
  name: string
  settlement_type: string
}

type Address = {
  id: string
  street_and_number: string
  full_address: string
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // Address hierarchy state
  const [counties, setCounties] = useState<County[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>()
  
  const watchedRole = watch('role')
  const watchedCounty = watch('county_id')
  const watchedMunicipality = watch('municipality_id')
  const watchedSettlement = watch('settlement_id')

  // Load counties on component mount
  useEffect(() => {
    loadCounties()
  }, [])

  // Load municipalities when county changes
  useEffect(() => {
    if (watchedCounty) {
      loadMunicipalities(watchedCounty)
      setSettlements([])
      setAddresses([])
    }
  }, [watchedCounty])

  // Load settlements when municipality changes
  useEffect(() => {
    if (watchedMunicipality) {
      loadSettlements(watchedMunicipality)
      setAddresses([])
    }
  }, [watchedMunicipality])

  // Load addresses when settlement changes
  useEffect(() => {
    if (watchedSettlement) {
      loadAddresses(watchedSettlement)
    }
  }, [watchedSettlement])

  const loadCounties = async () => {
    try {
      const { data, error } = await supabase
        .from('counties')
        .select('*')
        .order('name')
      
      if (error) throw error
      setCounties(data || [])
    } catch (error) {
      console.error('Error loading counties:', error)
    }
  }

  const loadMunicipalities = async (countyId: string) => {
    try {
      const { data, error } = await supabase
        .from('municipalities')
        .select('*')
        .eq('county_id', countyId)
        .order('name')
      
      if (error) throw error
      setMunicipalities(data || [])
    } catch (error) {
      console.error('Error loading municipalities:', error)
    }
  }

  const loadSettlements = async (municipalityId: string) => {
    try {
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('municipality_id', municipalityId)
        .order('name')
      
      if (error) throw error
      setSettlements(data || [])
    } catch (error) {
      console.error('Error loading settlements:', error)
    }
  }

  const loadAddresses = async (settlementId: string) => {
    try {
      const { data, error } = await supabase
        .from('full_addresses')
        .select('*')
        .eq('settlement_id', settlementId)
        .eq('status', 'approved')
        .order('street_and_number')
      
      if (error) throw error
      setAddresses(data || [])
    } catch (error) {
      console.error('Error loading addresses:', error)
    }
  }

  const handleAuth = async (data: FormData) => {
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        // Login
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })

        if (error) throw error

        setMessage('Login successful!')
        if (onSuccess) onSuccess()

              } else {
        // Register
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName || '',
              role: data.role || 'user',
              address_id: data.address_id || null,
              flat_number: data.flat_number || null
            }
          }
        })

        if (signUpError) throw signUpError

        setMessage('Registration successful! Please check your email to confirm your account.')
        reset()
      }
    } catch (error: any) {
      setMessage(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Apartment Management System
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(handleAuth)}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                type="password"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Registration Only Fields */}
            {!isLogin && (
              <>
                {/* Full Name Field */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    {...register('fullName')}
                    type="text"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Your full name"
                  />
                </div>

                {/* Role Selection */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    {...register('role', { required: 'Please select a role' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select your role</option>
                    <option value="user">Flat Owner</option>
                    <option value="accountant">Accountant</option>
                    <option value="building_manager">Building Manager</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>

                {/* Address Selection for Flat Owners */}
                {watchedRole === 'user' && (
                  <>
                    <div className="space-y-4 p-4 bg-blue-50 rounded-md">
                      <h4 className="text-sm font-medium text-blue-900">Address Information</h4>
                      
                      {/* County Selection */}
                      <div>
                        <label htmlFor="county_id" className="block text-sm font-medium text-gray-700">
                          Maakond (County)
                        </label>
                        <select
                          {...register('county_id', { required: 'Please select a county' })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="">Select county</option>
                          {counties.map((county) => (
                            <option key={county.id} value={county.id}>
                              {county.name}
                            </option>
                          ))}
                        </select>
                        {errors.county_id && (
                          <p className="mt-1 text-sm text-red-600">{errors.county_id.message}</p>
                        )}
                      </div>

                      {/* Municipality Selection */}
                      {watchedCounty && (
                        <div>
                          <label htmlFor="municipality_id" className="block text-sm font-medium text-gray-700">
                            Vald/Linn (Municipality)
                          </label>
                          <select
                            {...register('municipality_id', { required: 'Please select a municipality' })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="">Select municipality</option>
                            {municipalities.map((municipality) => (
                              <option key={municipality.id} value={municipality.id}>
                                {municipality.name}
                              </option>
                            ))}
                          </select>
                          {errors.municipality_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.municipality_id.message}</p>
                          )}
                        </div>
                      )}

                      {/* Settlement Selection */}
                      {watchedMunicipality && (
                        <div>
                          <label htmlFor="settlement_id" className="block text-sm font-medium text-gray-700">
                            Asula (Settlement)
                          </label>
                          <select
                            {...register('settlement_id', { required: 'Please select a settlement' })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="">Select settlement</option>
                            {settlements.map((settlement) => (
                              <option key={settlement.id} value={settlement.id}>
                                {settlement.name} ({settlement.settlement_type})
                              </option>
                            ))}
                          </select>
                          {errors.settlement_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.settlement_id.message}</p>
                          )}
                        </div>
                      )}

                      {/* Address Selection */}
                      {watchedSettlement && (
                        <div>
                          <label htmlFor="address_id" className="block text-sm font-medium text-gray-700">
                            Tänav ja maja number (Street and Building Number)
                          </label>
                          <select
                            {...register('address_id', { required: 'Please select an address' })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="">Select address</option>
                            {addresses.map((address) => (
                              <option key={address.id} value={address.id}>
                                {address.street_and_number}
                              </option>
                            ))}
                          </select>
                          {addresses.length === 0 && (
                            <p className="mt-1 text-sm text-amber-600">
                              No approved addresses found for this settlement. Contact a building manager to add your address.
                            </p>
                          )}
                          {errors.address_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.address_id.message}</p>
                          )}
                        </div>
                      )}

                      {/* Flat Number */}
                      {watchedSettlement && (
                        <div>
                          <label htmlFor="flat_number" className="block text-sm font-medium text-gray-700">
                            Korter (Flat Number)
                          </label>
                          <input
                            {...register('flat_number', { required: 'Please enter your flat number' })}
                            type="text"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="e.g., 12, 3A, 101"
                          />
                          {errors.flat_number && (
                            <p className="mt-1 text-sm text-red-600">{errors.flat_number.message}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Message Display */}
          {message && (
            <div className={`rounded-md p-4 ${
              message.includes('successful') 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>

          {/* Toggle Login/Register */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setMessage('')
                reset()
              }}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}