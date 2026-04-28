import { useAuthStore } from '@/stores/useAuthStore'
import type { Conversation } from '@/types/chat'
import React, { useState } from 'react'
import { Button } from '../ui/button'
import { ImagePlus, Send } from 'lucide-react'
import { Input } from '../ui/input'
import EmojiPicker from './EmojiPicker'
import { useChatStore } from '@/stores/useChatStore'
import { toast } from 'sonner'

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore()
  const [value, setValue] = useState("")

  const { sendDirectMessage ,sendGroupMessage} = useChatStore()
  if (!user) return;
  const [open, setOpen] = useState(false);
  const sendMessage = async () => {
    if (!value.trim()) return
    const currentValue = value
setValue("")
    try {
      if (selectedConvo.type == 'direct') {
        const participants = selectedConvo.participants;

        const otherUser = participants.filter((p) => p._id !== user._id)[0]
        
        await sendDirectMessage(otherUser._id, currentValue)
      } else {
        await sendGroupMessage(selectedConvo._id, currentValue)
      }
    } catch (error) {
      console.log("Loi xay khi gui tin nhan", error);
      toast.error("Loi xay ra khi gui tin nhan , ban hay thu lai !!")
      
    }
    finally {
      
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    
    if (e.key === "Enter") {
      e.preventDefault()
      sendMessage()
    }
    
  }
  return (
    <div className='flex items-center gap-2 p-3 min-h-[56px] bg-background'>
      <Button variant="ghost" size='icon' className="hover:bg-gradient/10 transition-smooth">
        <ImagePlus />
      </Button>

      <div className="flex-1 relative">
        <Input
          onKeyPress={handleKeyPress}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
          }}
          placeholder='Soan tin nhan'

          className='pr-20 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none'

        >

        </Input>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
          >
            😊
          </Button>

          {open && (
            <div className="absolute bottom-12">
              <EmojiPicker
                onChange={(emoji: string) =>
                  setValue((prev) => prev + emoji)
                }
              />
            </div>
          )}


       
        </div>
      </div>
      <Button className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-150 "
        disabled={!value.trim()}
        onClick={sendMessage}
      >
        <Send
          className='size-4 text-white'
        />
      </Button>
    </div>
  )
}

export default MessageInput