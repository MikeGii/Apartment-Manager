// Clean AuthForm.tsx - Completely removed all status logic
"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type FormData = {
  email: string
  password: string
  fullName?: string
  phone?: string
  role?: string
}

type AuthFormProps = {
  onSuccess?: () => void
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    defaultValues: {
      role: 'user' // Set default role to 'user' (Flat Owner)
    }
  })

  const handleAuth = async (data: FormData) => {
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        // Login - Simple and clean
        console.log('Attempting login for:', data.email)
        
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })

        if (error) {
          console.error('Login error:', error)
          throw error
        }

        console.log('Login successful, user:', authData.user?.email)
        setMessage('Login successful! Redirecting...')
        
        // Use Next.js router for proper navigation
        setTimeout(() => {
          if (onSuccess) {
            onSuccess()
          } else {
            router.push('/dashboard')
          }
        }, 500)

      } else {
        // Register - Simple and clean
        console.log('Attempting registration for:', data.email)
        
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName || '',
              phone: data.phone || '',
              role: data.role || 'user'
            }
          }
        })

        if (signUpError) {
          console.error('Registration error:', signUpError)
          throw signUpError
        }

        console.log('Registration successful for:', authData.user?.email)
        setMessage('Registration successful! Please check your email to confirm your account, then you can login.')
        
        // Reset form after successful registration
        reset({
          role: 'user'
        })
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      setMessage(error.message || 'An error occurred during authentication')
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
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800">
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
                className="mt-1 appearance-none relative block w-full px-3 py-3 border-2 border-gray-300 placeholder-gray-600 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-medium bg-white"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800">
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
                className="mt-1 appearance-none relative block w-full px-3 py-3 border-2 border-gray-300 placeholder-gray-600 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-medium bg-white"
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Registration Only Fields */}
            {!isLogin && (
              <>
                {/* Full Name Field */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-800">
                    Full Name
                  </label>
                  <input
                    {...register('fullName', {
                      required: 'Full name is required'
                    })}
                    type="text"
                    className="mt-1 appearance-none relative block w-full px-3 py-3 border-2 border-gray-300 placeholder-gray-600 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-medium bg-white"
                    placeholder="Your full name"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600 font-medium">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Phone Number Field */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-800">
                    Phone Number
                  </label>
                  <input
                    {...register('phone', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[\+]?[0-9\s\-\(\)]{8,}$/,
                        message: 'Please enter a valid phone number'
                      }
                    })}
                    type="tel"
                    className="mt-1 appearance-none relative block w-full px-3 py-3 border-2 border-gray-300 placeholder-gray-600 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-medium bg-white"
                    placeholder="Your phone number"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 font-medium">{errors.phone.message}</p>
                  )}
                </div>

                {/* Role Selection */}
                <div>
                  <label htmlFor="role" className="block text-sm font-semibold text-gray-800">
                    Role
                  </label>
                  <select
                    {...register('role', { required: 'Please select a role' })}
                    className="mt-1 block w-full px-3 py-3 border-2 border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-medium text-gray-900"
                  >
                    <option value="user">Flat Owner</option>
                    <option value="accountant">Accountant</option>
                    <option value="building_manager">Building Manager</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600 font-medium">{errors.role.message}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Message Display */}
          {message && (
            <div className={`rounded-md p-4 border-2 ${
              message.includes('successful') 
                ? 'bg-green-50 text-green-800 border-green-200' 
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                reset({
                  role: 'user'
                })
              }}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}