import { useChatStore } from "@/stores/useChatStore";
import { useEffect, useState } from "react";
import { Pin, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "../ui/button";
import type { PinnedMessage } from "@/types/chat";

const PinnedMessagesBar = () => {
  const { activeConversationId, conversations, unpinMessage } = useChatStore();
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

  return (
    <div className="border-b border-border bg-muted/30 px-3 py-1.5">
      {!expanded ? (
        /* Collapsed view — single pinned message */
        <div className="flex items-center gap-2">
          <Pin className="size-3.5 shrink-0 text-primary" />
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => pinnedMessages.length > 1 ? setExpanded(true) : undefined}
          >
            <p className="truncate text-xs text-foreground">{displayContent}</p>
          </button>
          {pinnedMessages.length > 1 && (
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] text-muted-foreground">
                {currentIndex + 1}/{pinnedMessages.length}
              </span>
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => navigatePin("prev")}>
                <ChevronUp className="size-3" />
              </Button>
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => navigatePin("next")}>
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
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">
              <Pin className="mr-1 inline size-3" />
              Tin nhắn đã ghim ({pinnedMessages.length})
            </span>
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => setExpanded(false)}>
              <ChevronUp className="size-3.5" />
            </Button>
          </div>
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {pinnedMessages.map((pin) => (
              <div
                key={pin.messageId}
                className="flex items-center gap-2 rounded-md bg-background px-2 py-1"
              >
                <p className="min-w-0 flex-1 truncate text-xs text-foreground">
                  {pin.message?.content || "Tin nhắn"}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleUnpin(pin.messageId)}
                  title="Bỏ ghim"
                >
                  <X className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PinnedMessagesBar;
