import ChatWindowLayout from '@/components/chat/ChatWindowLayout'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/useAuthStore'
import SEO from '@/components/common/SEO'
 

const ChatApp = () => {
  const user = useAuthStore(s => s.user)
  // ở đây sẽ lấy thẳng user từ store ra luôn
  // khi nó thay đổi sẽ k ảnh hưởng (bị render lại) 
  // đến các biến khác trong store 
  // và ngược lại
  console.log(user)
  return (
    <>
    <SEO title="Hộp thư" description="Trò chuyện thời gian thực, trao đổi tin nhắn, hình ảnh và tệp với bạn bè của bạn trên NewJourney." noIndex noFollow />
    <SidebarProvider>
      <AppSidebar />
        {/* <div className='block'>
          ten nguoi dung
          {user?.username}



          <Logout />
        </div> */}
      <div className="flex h-screen w-full p-2">
        <ChatWindowLayout />
      </div>
    </SidebarProvider>
    </>
  )
}
// 1:05:45

export default ChatApp
