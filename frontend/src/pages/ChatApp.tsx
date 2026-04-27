import Logout from '@/components/auth/Logout'
import ChatWindowLayout from '@/components/chat/ChatWindowLayout'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/useAuthStore'
import { Aperture } from 'lucide-react'
 

const ChatApp = () => {
  const user = useAuthStore(s => s.user)
  // ở đây sẽ lấy thẳng user từ store ra luôn
  // khi nó thay đổi sẽ k ảnh hưởng (bị render lại) 
  // đến các biến khác trong store 
  // và ngược lại
  console.log(user)
  return (
    <>
    
   
    <SidebarProvider>
      <AppSidebar />
        <div className='block'>
          ten nguoi dung
          {user?.username}



          <Logout />
        </div>
      <div className="flex h-screen w-full p-2">
        <ChatWindowLayout />
      </div>
    </SidebarProvider>
    </>
  )
}

export default ChatApp