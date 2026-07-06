import { BrowserRouter,Routes,Route } from "react-router-dom"
import SignInpage from "./pages/SignInpage"
import SignUpPage from "./pages/SignUpPage"
import ChatApp from "./pages/ChatApp"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import ResetPasswordPage from "./pages/ResetPasswordPage"
import { Toaster }from 'sonner'
import ProtectedRoute from "./components/auth/ProtectedRoute"
import MainLayout from "./components/layout/MainLayout"
import FeedPage from "./pages/FeedPage"
import ExplorePage from "./pages/ExplorePage"
import ProfilePage from "./pages/ProfilePage"
import PostDetailPage from "./pages/PostDetailPage"
import { useThemeStore } from "./stores/useThemeStore"
import { useEffect, useState } from "react"
import { useAuthStore } from "./stores/useAuthStore"
import { useSocketStore } from "./stores/useSocketStore"
import StoryViewer from "./components/story/StoryViewer"
import PwaInstallPrompt from "./components/ui/PwaInstallPrompt"
import WelcomeTourDialog from "./components/ui/WelcomeTourDialog"
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
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "radial-gradient(125% 125% at 50% 10%, hsla(0,0%,100%,1) 40%, hsla(262,83%,58%,0.5) 100%)",
        padding: "1.5rem",
        gap: "0",
      }}>
        <style>{`
          @keyframes njFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
          }
          @keyframes njPulseRing {
            0% { transform: scale(0.8); opacity: 0.8; }
            100% { transform: scale(1.6); opacity: 0; }
          }
          @keyframes njDot {
            0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; }
            40% { transform: scale(1); opacity: 1; }
          }
          @keyframes njFadeSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes njShimmer {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
          }
          .nj-float { animation: njFloat 3s ease-in-out infinite; }
          .nj-fade-1 { animation: njFadeSlideUp 0.6s ease forwards; }
          .nj-fade-2 { animation: njFadeSlideUp 0.6s ease 0.15s forwards; opacity: 0; }
          .nj-fade-3 { animation: njFadeSlideUp 0.6s ease 0.3s forwards; opacity: 0; }
          .nj-dot-1 { animation: njDot 1.4s ease-in-out 0s infinite; }
          .nj-dot-2 { animation: njDot 1.4s ease-in-out 0.2s infinite; }
          .nj-dot-3 { animation: njDot 1.4s ease-in-out 0.4s infinite; }
          .nj-shimmer-text {
            background: linear-gradient(90deg, #7c3aed, #ec4899, #7c3aed);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: njShimmer 2.5s linear infinite;
          }
        `}</style>

        {/* GIF with float + pulse ring */}
        <div className="nj-fade-1" style={{ position: "relative", marginBottom: "2rem" }}>
          <div style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "hsl(271,79%,47%,0.3)",
            animation: "njPulseRing 2s ease-out infinite",
          }} />
          <div className="nj-float" style={{
            width: "clamp(140px, 35vw, 220px)",
            height: "clamp(140px, 35vw, 220px)",
            borderRadius: "50%",
            overflow: "hidden",
            border: "3px solid hsl(271,79%,47%,0.4)",
            boxShadow: "0 20px 60px hsl(271,79%,47%,0.25), 0 0 0 8px hsl(271,79%,47%,0.08)",
          }}>
            <img
              src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMHBrYjBteDAybzh6ZW41MTZhZzdycGliZXFnMDlqdWx3bDhtNnQwcCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/2IudUHdI075HL02Pkk/giphy.gif"
              alt="Loading..."
              style={{ width: "100%", height: "100%", objectFit: "revert-layer" }}
            />
          </div>
        </div>

        {/* App name shimmer */}
        <div className="nj-fade-2" style={{ marginBottom: "0.5rem" }}>
          <h1 className="nj-shimmer-text" style={{
            fontSize: "clamp(1.6rem, 5vw, 2.4rem)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: 0,
          }}>NewJourney</h1>
        </div>

        {/* Status message */}
        <div className="nj-fade-3" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p style={{
            color: "hsl(271,79%,47%)",
            fontWeight: 600,
            fontSize: "clamp(0.9rem, 3vw, 1rem)",
            margin: "0 0 0.25rem 0",
          }}>Đang khởi động server...</p>
          <p style={{
            color: "hsl(240,15%,55%)",
            fontSize: "clamp(0.75rem, 2.5vw, 0.875rem)",
            margin: 0,
          }}>Server đang thức dậy, vui lòng đợi vài giây ☕</p>
        </div>

        {/* Animated dots */}
        <div className="nj-fade-3" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {["nj-dot-1", "nj-dot-2", "nj-dot-3"].map((cls, i) => (
            <span key={i} className={cls} style={{
              display: "block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "linear-gradient(135deg, hsl(271,79%,47%), hsl(320,100%,70%))",
            }} />
          ))}
        </div>
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
          <Route element={<ForgotPasswordPage />} path="/forgot-password" />
          <Route element={<ResetPasswordPage />} path="/reset-password" />
          {/* protected route */}
          <Route path="/" element={<ProtectedRoute/>}>
            <Route element={<MainLayout/>}>
              <Route index element={<FeedPage />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="profile/:username" element={<ProfilePage />} />
              <Route path="post/:postId" element={<PostDetailPage />} />
            </Route>
            <Route path="chat" element={<ChatApp />} />
          </Route>

      </Routes>
      
      </BrowserRouter>
      <WelcomeTourDialog />
      <StoryViewer />
      <PwaInstallPrompt />
    </>
  )
}

export default App
