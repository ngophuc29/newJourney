import { BrowserRouter,Routes,Route } from "react-router"
import SignInpage from "./pages/SignInpage"
import SignUpPage from "./pages/SignUpPage"
import ChatApp from "./pages/ChatApp"
import { Toaster }from 'sonner'
function App() { 
  return (
    <>
      <Toaster richColors/>
      <BrowserRouter>
        <Routes>
          
          {/* public route */}
          <Route element={<SignInpage />} path="/signin" />
          <Route element={<SignUpPage />} path="/signup" />
          {/* protected route */}
          <Route element={<ChatApp/>} path="/" />

      </Routes>
      
      </BrowserRouter>
    </>
  )
}

export default App
