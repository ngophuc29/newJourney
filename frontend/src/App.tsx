import { BrowserRouter,Routes,Route } from "react-router-dom"
import SignInpage from "./pages/SignInpage"
import SignUpPage from "./pages/SignUpPage"
import ChatApp from "./pages/ChatApp"
import { Toaster }from 'sonner'
import ProtectedRoute from "./components/auth/ProtectedRoute"
import { useThemeStore } from "./stores/useThemeStore"
import { useEffect, useState } from "react"
import { useAuthStore } from "./stores/useAuthStore"
import { useSocketStore } from "./stores/useSocketStore"
const HEALTH_CHECK_INTERVAL = 3000

function App() { 
    const { isDarK, setTheme }= useThemeStore()
  
  const { accessToken } = useAuthStore()
  const {connectSocket,disconnectSocket} = useSocketStore()
  const [serverReady, setServerReady] = useState(false)
  
  useEffect(() => {
    setTheme(isDarK)
  }, [isDarK])

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined

    const pingServer = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL
        const response = await fetch(`${baseUrl}/health`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error(`health-check failed with status ${response.status}`)
        }

        if (!cancelled) {
          setServerReady(true)
        }
      } catch (error) {
        console.warn("Server is sleeping or unreachable, retrying...", error)
        if (!cancelled) {
          setServerReady(false)
          timer = window.setTimeout(pingServer, HEALTH_CHECK_INTERVAL)
        }
      }
    }

    pingServer()

    return () => {
      cancelled = true
      if (timer) {
        window.clearTimeout(timer)
      }
    }
  }, [])
  

  useEffect(() => {
    if (accessToken) {
      connectSocket()
    }
    return ()=> disconnectSocket()
  },[accessToken])

  if (!serverReady) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column"
      }}>
        <h2>Đang khởi động server...</h2>
        <p>Vui lòng đợi vài giây ⏳</p>
      </div>
    );
  }

  return (
    <>
      <Toaster richColors/>
      <BrowserRouter>
        <Routes>
          
          {/* public route */}
          <Route element={<SignInpage />} path="/signin" />
          <Route element={<SignUpPage />} path="/signup" />
          {/* protected route */}
          <Route path="/" element={<ProtectedRoute/>}>
            <Route index element={<ChatApp/>} />
          </Route>

      </Routes>
      
      </BrowserRouter>
    </>
  )
}

export default App
