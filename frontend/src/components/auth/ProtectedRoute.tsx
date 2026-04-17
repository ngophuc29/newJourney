import { useAuthStore } from '@/stores/useAuthStore'
import React, { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = () => {
  const { accessToken, user, loading, refreshToken, fetchMe } = useAuthStore()
  const [starting, setStarting] = useState(true)

  const init = async () => {

    if (!accessToken) {
      await refreshToken()
    }

    if (accessToken && !user) {
      await fetchMe()
    }
    setStarting(false)
  }
  useEffect(() => {

    init()
  }, [])


  if (starting || loading) {
    return <div className='flex h-screen items-center justify-center'>
      Dang tai trang
    </div>
  }
  if (!accessToken) return <Navigate to="/signin" />
  return (
    <Outlet></Outlet>
  )
}

export default ProtectedRoute