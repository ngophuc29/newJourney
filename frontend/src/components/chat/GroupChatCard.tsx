import type { Conversation } from '@/types/chat'
import ChatCard from './ChatCard'
import { useAuthStore } from '@/stores/useAuthStore'
import { useChatStore } from '@/stores/useChatStore'
import { cn } from '@/lib/utils'
import GroupChatAvatar from './GroupChatAvatar'
import UnreadCountBadge from './UnreadCountBadge'
const GroupChatCard = ({ convo }: { convo: Conversation }) => {

    const { user } = useAuthStore()
    const { activeConversationId, setActionConversation, messages, fetchMessages } = useChatStore()

    if (!user) return null


    const unreadCount = convo.unreadCounts[user._id]
    const name = convo.group?.name ?? ''
    console.log("name cua group : ", name);

    const handleSelectionConversation = async (id: string) => {
        setActionConversation(id)
        if (!messages[id]) {
            await fetchMessages()
        }

    }
    return (
        <ChatCard
            convoId={convo._id}
            name={name}
            timeStamp={convo.lastMessage?.createdAt ? new Date(convo.lastMessage.createdAt) : undefined}
            isActive={activeConversationId === convo._id}
            onSelect={handleSelectionConversation}
            unreadCount={unreadCount}
            leftSection={
                <>
                    {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
                    <GroupChatAvatar
                        participants={convo.participants}
                        type="chat"
                    />
                </>
            }
            subtitle={
                <p className='text-sm truncate text-muted-foreground'>{convo.participants.length} thanh vien</p>
            }
        />
    )
}

export default GroupChatCard