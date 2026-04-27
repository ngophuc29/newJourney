import React from 'react'
import { useChatStore } from '@/stores/useChatStore'
import type { Conversation } from '@/types/chat'
import DirectMessageCard from './DirectMessageCard'

const DirectMessageList = () => {
  const { conversations } = useChatStore()

  if (!conversations) return
  console.log("Conversation : ", conversations);


  const directConversation = conversations.filter((convo) => convo.type === 'direct')
  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">

      {directConversation.map((convo) => (
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