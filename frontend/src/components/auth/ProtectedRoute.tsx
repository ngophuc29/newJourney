import { useAuthStore } from '@/stores/useAuthStore'
import   { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = () => {
  const { accessToken, user, loading, refreshToken, fetchMe } = useAuthStore()
  const [starting, setStarting] = useState(true)

  const init = async () => {
    let finished = false
    const timeout = setTimeout(() => {
      if (!finished) setStarting(false)
    }, 8000)

    try {
      if (!accessToken) {
        // wrap refreshToken with a timeout so a hanging network request doesn't leave loading=true
        const refreshPromise = refreshToken()
        const timed = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("refresh-timeout")), 5000),
        )
        try {
          await Promise.race([refreshPromise, timed])
        } catch (e) {
          console.warn("refreshToken timed out or failed", e)
          // reset auth state to ensure loading is false
          useAuthStore.getState().clearState()
        }
      }

      // re-read from the store in case refreshToken updated the state
      const { accessToken: currentAccess, user: currentUser } = useAuthStore.getState()
      if (currentAccess && !currentUser) {
        // fetchMe can also hang; run with small timeout and reset on failure
        const fetchPromise = fetchMe()
        const fetchTimed = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("fetchMe-timeout")), 5000),
        )
        try {
          await Promise.race([fetchPromise, fetchTimed])
        } catch (e) {
          console.warn("fetchMe timed out or failed", e)
          useAuthStore.getState().clearState()
        }
      }
    } catch (err) {
      console.error("ProtectedRoute init error:", err)
      useAuthStore.getState().clearState()
    } finally {
      finished = true
      clearTimeout(timeout)
      setStarting(false)
    }
  }

  useEffect(() => {
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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