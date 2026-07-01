import { useChatStore } from '@/stores/useChatStore'
import { useEffect, useState } from 'react'
import ChatWelcomeScreen from './ChatWelcomeScreen'
import ChatWindowSkeleton from './ChatWindowSkeleton'
import { SidebarInset } from '../ui/sidebar'
import ChatWindowHeader from './ChatWindowHeader'
import ChatWindowBody from './ChatWindowBody'
import MessageInput from './MessageInput'
import PinnedMessagesBar from './PinnedMessagesBar'
import SharedMediaGallery from './SharedMediaGallery'

const ChatWindowLayout = () => {
  const { activeConversationId, conversations, messasgeLoading: loading, markAsSeen } = useChatStore()
  const [showMediaGallery, setShowMediaGallery] = useState(false)

  const selectedConvo =
    conversations.find((c) => c._id === activeConversationId) ?? null;

  useEffect(() => {
    setShowMediaGallery(false)
  }, [activeConversationId])
  
  useEffect(() => {
    if (!selectedConvo) {
      return
    }
    const markSeen = async () => {
      try {
        await markAsSeen();
      } catch (error) {
        console.log("Loi khi markSeen");
        
      }
    }
    markSeen()
  },[markAsSeen,selectedConvo])

  if (!selectedConvo) return <ChatWelcomeScreen />

  if (loading) {
    return <ChatWindowSkeleton />
  }

  return (
    <SidebarInset className='flex flex-col h-full flex-1 overflow-hidden rounded-sm shadow-md'>
      {/* header */}
      <ChatWindowHeader 
        chat={selectedConvo} 
        onToggleMedia={() => setShowMediaGallery(!showMediaGallery)}
      />

      {/* pinned messages bar */}
      <PinnedMessagesBar />

      {/* main content: chat + media gallery */}
      <div className="flex-1 flex overflow-hidden">
        {/* chat messages + input */}
        <div className="flex-1 flex flex-col min-w-0 h-full max-md:pb-[76px]">
          <div className="flex-1 overflow-y-auto bg-primary-foreground">
            <ChatWindowBody />
          </div>
          <MessageInput selectedConvo={selectedConvo}/>
        </div>

        {/* media gallery panel */}
        {showMediaGallery && (
          <SharedMediaGallery 
            convoId={selectedConvo._id} 
            onClose={() => setShowMediaGallery(false)}
          />
        )}
      </div>
    </SidebarInset>
  )
}

export default ChatWindowLayout