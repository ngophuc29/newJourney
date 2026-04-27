import type { Conversation } from '@/types/chat'
import React from 'react'
import ChatCard from './ChatCard'
import { useAuthStore } from '@/stores/useAuthStore'
import { useChatStore } from '@/stores/useChatStore'
import { cn } from '@/lib/utils'
import UserAvatar from './UserAvatar'
import StatusBadge from './StatusBadge'
import UnreadCountBadge from './UnreadCountBadge'
const DirectMessageCard = ({ convo }: { convo: Conversation }) => {

  const { user } = useAuthStore()
  const { activeConversationId, setActionConversation, messages,fetchMessages } = useChatStore()

  if (!user) return null

  const otherUser = convo.participants.find((p) => p._id !== user._id)

  if (!otherUser) return null

  const unreadCount = convo.unreadCounts[user._id]

  const lastMessage = convo.lastMessage?.content ?? "";


  const handleSelectionConversation = async (id: string)=>{
    setActionConversation(id)
    if (!messages[id]) {
      await fetchMessages();
    }

  }
  return (
    <ChatCard
      convoId={convo._id}
      name={otherUser.displayName ?? ""}
      timeStamp={convo.lastMessage?.createdAt ? new Date(convo.lastMessage.createdAt) : undefined}
      isActive={activeConversationId === convo._id}
      onSelect={handleSelectionConversation}
      unreadCount={unreadCount}
      leftSection={
        <>
          <UserAvatar type='sidebar' name={otherUser.displayName ?? ""}
          avatarURL={otherUser.avatarURL?? undefined}
          />

          <StatusBadge status='online' />
          
          { unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount}/>}
          
        </>
      }
      subtitle={
        <p className={cn("text-sm truncate" , unreadCount > 0 ?"font-medium text-foreground" :'text-muted-foreground ')}>

          { lastMessage}
        </p>
      }
    />
  )
}

export default DirectMessageCard