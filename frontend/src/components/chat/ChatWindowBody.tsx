 
import { useChatStore } from '@/stores/useChatStore'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ChatWelcomeScreen from './ChatWelcomeScreen'
import MessageItem from './MessageItem'
import InfiniteScroll from 'react-infinite-scroll-component'
const ChatWindowBody = () => {
    const { activeConversationId, conversations, messages: allMessages ,fetchMessages} = useChatStore()

    const [lastMessageStatus, setLastMessageStatus] = useState<'delivered' | 'seen'>("delivered")
    const messages = allMessages[activeConversationId!]?.items ?? []
    const hasMore = allMessages[activeConversationId!]?.hasMore ?? false

    const selectedConvo = conversations.find((c) => c._id === activeConversationId)

    const reversedMessages = [...messages].reverse()

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const lastMessage = selectedConvo?.lastMessage
        if (!lastMessage) return

        const seenBy = selectedConvo?.seenBy ?? []

        setLastMessageStatus(seenBy.length > 0 ? 'seen' : 'delivered')
    }, [selectedConvo])


    useLayoutEffect(() => {
        if (!messagesEndRef.current) return

        messagesEndRef.current.scrollIntoView({
            behavior: 'smooth',
            block:'end'
        })
    }, [activeConversationId])


    const fetchMoreMessage = async () => {
        if (!activeConversationId) return 
        try {
            await fetchMessages(activeConversationId)
        } catch (error) {
            console.log("Loi xay ra khi fetch them tin");
            
        }
    }
    const key = `chat-scroll-${activeConversationId}`

    const handleScrollSave = () => {
        const container = containerRef.current
        if (!container || !activeConversationId) return 
        
        sessionStorage.setItem(key, JSON.stringify({
            scrollTop: container.scrollTop,
            scrollHeight : container.scrollHeight
        }))
    }

    useLayoutEffect(() => {
        const container = containerRef.current
        if (!container || !activeConversationId) return 

        const item = sessionStorage.getItem(key)
        if (item) {
            const { scrollTop } = JSON.parse(item)
            requestAnimationFrame(() => {
                container.scrollTop =scrollTop
            })
            
        }
    },[messages.length])
    if (!selectedConvo) {
        return <ChatWelcomeScreen />
    }

    if (!messages?.length) {
        return <div className='flex h-full items-center justify-center text-muted-foreground'
        > Chua co tin nhan nao trong cuoc tro chuyen nay</div>
    }
    console.log("tin nhan day : ", messages);

    return (
        <div
            className='p-4 bg-sidebar-primary-foreground h-full flex flex-col overflow-hidden'
        >

            <div
                id='scrollableDiv'
                ref={containerRef}
                onScroll={handleScrollSave}
                className="flex flex-col-reverse overflow-y-auto overflow-x-hidden beautiful-scrollbar">
                <div ref={messagesEndRef}
                ></div>
                <InfiniteScroll
                    inverse={true}
                    dataLength={messages.length}
                    next={fetchMoreMessage}
                    hasMore={hasMore}
                    scrollableTarget='scrollableDiv'
                    loader={<p>Dang taii ... </p>}
                    style={{ display: "flex", flexDirection: "column-reverse",overflow:'visible' }}
                >

                {reversedMessages.map((message, index) => (
                    <MessageItem
                        key={message._id ?? index}
                        index={index}
                        message={message}
                        messages={reversedMessages}
                        selectedConvo={selectedConvo}
                        lastMessageStatus={lastMessageStatus}
                    />
                ))}
                </InfiniteScroll>
               
            </div>


        </div>
    )
}

export default ChatWindowBody

// 30:08