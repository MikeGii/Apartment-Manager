"use client"

import { useRouter } from 'next/navigation'
import AuthForm from '../components/auth/AuthForm'

export default function LoginPage() {
  const router = useRouter()

  const handleSuccess = () => {
    // Redirect to dashboard after successful login
    router.push('/dashboard')
  }

  return <AuthForm onSuccess={handleSuccess} />
}