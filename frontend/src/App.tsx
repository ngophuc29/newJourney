import { BrowserRouter,Routes,Route } from "react-router-dom"
import SignInpage from "./pages/SignInpage"
import SignUpPage from "./pages/SignUpPage"
import ChatApp from "./pages/ChatApp"
import { Toaster }from 'sonner'
import ProtectedRoute from "./components/auth/ProtectedRoute"
import { useThemeStore } from "./stores/useThemeStore"
import { useEffect } from "react"
import { useAuthStore } from "./stores/useAuthStore"
import { useSocketStore } from "./stores/useSocketStore"
function App() { 
    const { isDarK, setTheme }= useThemeStore()
  
  const { accessToken } = useAuthStore()
  const {connectSocket,disconnectSocket} = useSocketStore()
  
  useEffect(() => {
    setTheme(isDarK)
  }, [isDarK])
  

  useEffect(() => {
    if (accessToken) {
      connectSocket()
    }
    return ()=> disconnectSocket()
  },[accessToken])
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
