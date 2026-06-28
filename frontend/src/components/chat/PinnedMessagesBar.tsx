import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { Pin, ChevronDown, ChevronUp, X, MessageSquare } from "lucide-react";
import { Button } from "../ui/button";
import type { PinnedMessage } from "@/types/chat";

const PinnedMessagesBar = () => {
  const { activeConversationId, conversations, unpinMessage } = useChatStore();
  const { user } = useAuthStore();
  const [expanded, setExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const convo = conversations.find((c) => c._id === activeConversationId);
  const pinnedMessages = convo?.pinnedMessages || [];

  useEffect(() => {
    setCurrentIndex(0);
    setExpanded(false);
  }, [activeConversationId]);

  if (pinnedMessages.length === 0) return null;

  const currentPin: PinnedMessage = pinnedMessages[currentIndex] || pinnedMessages[0];
  const displayContent = currentPin.message?.content
    ? currentPin.message.content.length > 100
      ? currentPin.message.content.substring(0, 100) + "..."
      : currentPin.message.content
    : currentPin.message?.mediaType === "image"
      ? "📷 Ảnh"
      : currentPin.message?.mediaType === "video"
        ? "🎥 Video"
        : "Tin nhắn";

  const handleUnpin = async (messageId: string) => {
    if (!activeConversationId) return;
    try {
      await unpinMessage(activeConversationId, messageId);
    } catch (error) {
      console.log("Loi khi bo ghim", error);
    }
  };

  const navigatePin = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentIndex((i) => (i > 0 ? i - 1 : pinnedMessages.length - 1));
    } else {
      setCurrentIndex((i) => (i < pinnedMessages.length - 1 ? i + 1 : 0));
    }
  };

  const getSenderName = (senderId: string) => {
    if (senderId === user?._id) return "Bạn";
    const participant = convo?.participants.find(
      (p) => p._id.toString() === senderId.toString()
    );
    return participant?.displayName || "Người dùng";
  };

  const handleScrollToMessage = (messageId: string) => {
    const targetEl = document.getElementById(`message-${messageId}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      const cardEl = targetEl.querySelector(".message-card") as HTMLElement;
      if (cardEl) {
        // Store original transition
        const originalTransition = cardEl.style.transition;
        
        // Apply highlight instantly
        cardEl.style.transition = "none";
        cardEl.style.transform = "scale(1.05)";
        cardEl.style.boxShadow = "0 0 0 4px #ef4444, 0 10px 20px rgba(239, 68, 68, 0.4)";

        // Start transition back after 1.5s
        setTimeout(() => {
          cardEl.style.transition = "all 1.0s ease-in-out";
          cardEl.style.transform = "";
          cardEl.style.boxShadow = "";
          
          // Restore original transition after the fade-out completes
          setTimeout(() => {
            cardEl.style.transition = originalTransition;
          }, 1000);
        }, 1500);
      }
    }
  };

  return (
    <div className="border-b border-border bg-muted/30 px-3 py-1.5">
      {!expanded ? (
        /* Collapsed view — single pinned message */
        <div className="flex items-center gap-2">
          <Pin className="size-3.5 shrink-0 text-primary" />
          <button
            type="button"
            className="min-w-0 flex-1 text-left hover:underline cursor-pointer"
            onClick={() => handleScrollToMessage(currentPin.messageId)}
          >
            <p className="truncate text-xs text-foreground font-medium">{displayContent}</p>
          </button>
          {pinnedMessages.length > 1 && (
            <div className="flex items-center gap-0.5">
              <button 
                type="button"
                className="text-[10px] text-muted-foreground cursor-pointer hover:text-primary hover:underline font-semibold px-1 flex items-center gap-0.5"
                onClick={() => setExpanded(true)}
                title="Xem tất cả tin nhắn đã ghim"
              >
                {currentIndex + 1}/{pinnedMessages.length}
                <ChevronDown className="size-2.5" />
              </button>
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => navigatePin("prev")} title="Tin nhắn trước">
                <ChevronUp className="size-3" />
              </Button>
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => navigatePin("next")} title="Tin nhắn sau">
                <ChevronDown className="size-3" />
              </Button>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => handleUnpin(currentPin.messageId)}
            title="Bỏ ghim"
          >
            <X className="size-3" />
          </Button>
        </div>
      ) : (
        /* Expanded view — all pinned messages */
        <div className="space-y-2 rounded-lg bg-card p-3 shadow-xs border border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Pin className="size-3.5 text-primary" />
              Danh sách ghim ({pinnedMessages.length})
            </span>
            <button 
              type="button" 
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
              onClick={() => setExpanded(false)}
            >
              Thu gọn
              <ChevronUp className="size-3.5" />
            </button>
          </div>
          <div className="max-h-60 space-y-1.5 overflow-y-auto beautiful-scrollbar pr-1">
            {pinnedMessages.map((pin) => {
              const senderName = pin.message ? getSenderName(pin.message.senderId) : "Người dùng";
              const contentText = pin.message?.content
                ? pin.message.content
                : pin.message?.mediaType === "image"
                  ? "📷 Ảnh"
                  : pin.message?.mediaType === "video"
                    ? "🎥 Video"
                    : "Tin nhắn";

              return (
                <div
                  key={pin.messageId}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 border border-transparent hover:border-border/40 cursor-pointer transition-all duration-150 group/pin-item"
                  onClick={() => handleScrollToMessage(pin.messageId)}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageSquare className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tin nhắn</p>
                    <p className="truncate text-xs text-foreground/90">
                      <span className="font-semibold text-foreground">{senderName}:</span> {contentText}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-0 group-hover/pin-item:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all duration-150"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnpin(pin.messageId);
                    }}
                    title="Bỏ ghim"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PinnedMessagesBar;
