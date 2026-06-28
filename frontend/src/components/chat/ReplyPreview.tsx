import { useChatStore } from "@/stores/useChatStore";
import { X } from "lucide-react";
import { Button } from "../ui/button";

const ReplyPreview = () => {
  const { replyingTo, setReplyingTo } = useChatStore();

  if (!replyingTo) return null;

  const displayContent = replyingTo.isRevoked
    ? "Tin nhắn đã bị thu hồi"
    : replyingTo.content
      ? replyingTo.content.length > 80
        ? replyingTo.content.substring(0, 80) + "..."
        : replyingTo.content
      : replyingTo.mediaType === "image"
        ? "📷 Ảnh"
        : replyingTo.mediaType === "video"
          ? "🎥 Video"
          : "Tin nhắn";

  return (
    <div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-border bg-muted/50 px-3 py-2 animate-in slide-in-from-bottom-2 duration-150">
      <div className="h-8 w-0.5 shrink-0 rounded-full bg-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-primary">
          Đang trả lời {replyingTo.isOwn ? "chính mình" : ""}
        </p>
        <p className="truncate text-xs text-muted-foreground">{displayContent}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => setReplyingTo(null)}
        className="shrink-0"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
};

export default ReplyPreview;
