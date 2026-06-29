import { useChatStore } from '@/stores/useChatStore'
import type { Conversation } from '@/types/chat'
 
import { SidebarTrigger } from '../ui/sidebar'
import GroupChatAvatar from './GroupChatAvatar'
import StatusBadge from './StatusBadge'
import UserAvatar from './UserAvatar'
import { Separator } from '@base-ui/react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useSocketStore } from '@/stores/useSocketStore'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Settings, Search, Image } from 'lucide-react'
import GroupSettingsDialog from './GroupSettingsDialog'
import SearchMessagesDialog from './SearchMessagesDialog'
import UserCardDialog from './UserCardDialog'

const ChatWindowHeader = ({ chat, onToggleMedia }: { chat?: Conversation; onToggleMedia?: () => void }) => {
    
    const { conversations, activeConversationId } = useChatStore()
    const { onlineUsers } = useSocketStore()
    const { user } = useAuthStore();
    const [groupSettingsOpen, setGroupSettingsOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [userCardOpen, setUserCardOpen] = useState(false)

    chat = chat ?? conversations.find((c) => c._id === activeConversationId)
    let otherUser;

    if(!chat) {
        return (
            <header className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 w-full">
                <SidebarTrigger className="-ml-1 text-foreground" />
            </header>
        );
    }
    if (chat.type === "direct") {
        const otherUsers = chat.participants.filter((p) => p._id !== user?._id);
        otherUser = otherUsers.length > 0 ? otherUsers[0] : null;

        if (!user || !otherUser) return;
    }
  return (
      <header className="sticky top-0 z-10 px-4 py-2 flex items-center bg-background">
          <div className="flex items-center gap-2 w-full">
              <SidebarTrigger className="-ml-1 text-foreground" />
              <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
              />

              <div className="p-2 w-full flex items-center gap-3">
                  {/* avatar */}
                  <div className="relative">
                      {chat.type === "direct" ? (
                          <>
                              <div 
                                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                                  onClick={() => setUserCardOpen(true)}
                              >
                                  <UserAvatar
                                      type={"sidebar"}
                                      name={otherUser?.displayName || "Moji"}
                                      avatarURL={otherUser?.avatarURL || undefined}
                                  />
                              </div>
                              {/* todo: socket io */}
                              <StatusBadge
                                  status={
                                      onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"
                                  }
                              />
                          </>
                      ) : (
                          <GroupChatAvatar
                              participants={chat.participants}
                              type="sidebar"
                          />
                      )}
                  </div>

                  {/* name */}
                  <h2 className="font-semibold text-foreground flex-1">
                      {chat.type === "direct" ? otherUser?.displayName : chat.group?.name}
                  </h2>

                  {/* Search button */}
                  <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setSearchOpen(true)}
                      title="Tìm kiếm tin nhắn"
                  >
                      <Search className="size-4" />
                      <span className="sr-only">Tim kiem</span>
                  </Button>

                  {/* Media Gallery button */}
                  <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={onToggleMedia}
                      title="Kho lưu trữ phương tiện"
                  >
                      <Image className="size-4" />
                      <span className="sr-only">Thu vien phuong tien</span>
                  </Button>

                  <SearchMessagesDialog
                      open={searchOpen}
                      onOpenChange={setSearchOpen}
                  />

                  {chat.type === "group" && (
                      <>
                          <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => setGroupSettingsOpen(true)}
                          >
                              <Settings className="size-4" />
                              <span className="sr-only">Quan ly nhom</span>
                          </Button>
                          <GroupSettingsDialog
                              open={groupSettingsOpen}
                              onOpenChange={setGroupSettingsOpen}
                              conversation={chat}
                          />
                      </>
                  )}
              </div>
          </div>
          {chat.type === "direct" && otherUser && (
              <UserCardDialog
                  userId={otherUser._id}
                  open={userCardOpen}
                  onOpenChange={setUserCardOpen}
              />
          )}
      </header>
  )
}

export default ChatWindowHeader
