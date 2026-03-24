import { useAuthStore } from '@/stores/useAuthStore'
import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = () => {
    const { accessToken, user, loading } = useAuthStore()
    
  if (!accessToken) return <Navigate to="/signin" />
  return (
    <Outlet></Outlet>
  )
}

export default ProtectedRoute