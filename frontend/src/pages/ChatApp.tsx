import Logout from '@/components/auth/logout'
import { useAuthStore } from '@/stores/useAuthStore'
 

const ChatApp = () => {
  const user = useAuthStore(s => s.user)
  // ở đây sẽ lấy thẳng user từ store ra luôn
  // khi nó thay đổi sẽ k ảnh hưởng (bị render lại) 
  // đến các biến khác trong store 
  // và ngược lại
  console.log(user)
  return (
    <div>
      ten nguoi dung 
      {user?.username}

      

      <Logout/>
    </div>
  )
}

export default ChatApp