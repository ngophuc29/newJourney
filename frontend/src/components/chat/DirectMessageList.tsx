import { useChatStore } from '@/stores/useChatStore'
import DirectMessageCard from './DirectMessageCard'

const DirectMessageList = () => {
  const { conversations } = useChatStore()

  if (!conversations) return
  console.log("Conversation : ", conversations);


  const directConversations = conversations.filter((convo) => convo.type === 'direct')
  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">

      {directConversations.map((convo) => (
        <DirectMessageCard
          key={convo._id}
          convo={convo}
        />
      ))}
    </div>
  )
  // 1:01:31
}

export default DirectMessageList