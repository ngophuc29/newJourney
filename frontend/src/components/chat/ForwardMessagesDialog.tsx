import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useState } from "react";
import { Search, Loader2, Share2 } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import UserAvatar from "./UserAvatar";
import GroupChatAvatar from "./GroupChatAvatar";
import { toast } from "sonner";

interface ForwardMessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
}

const ForwardMessagesDialog = ({ open, onOpenChange, messageId }: ForwardMessagesDialogProps) => {
  const { conversations, forwardMessage } = useChatStore();
  const { user } = useAuthStore();
  const [query, setQuery] = useState("");
  const [sentStatus, setSentStatus] = useState<Record<string, "idle" | "sending" | "sent">>({});

  const handleForward = async (conversationId: string) => {
    setSentStatus((prev) => ({ ...prev, [conversationId]: "sending" }));
    try {
      await forwardMessage(messageId, [conversationId]);
      setSentStatus((prev) => ({ ...prev, [conversationId]: "sent" }));
      toast.success("Đã chuyển tiếp tin nhắn thành công!");
    } catch (error) {
      console.error("Lỗi khi chuyển tiếp", error);
      setSentStatus((prev) => ({ ...prev, [conversationId]: "idle" }));
      toast.error("Lỗi khi chuyển tiếp tin nhắn");
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((convo) => {
    if (convo.type === "direct") {
      const otherUser = convo.participants.find((p) => p._id !== user?._id);
      return otherUser?.displayName.toLowerCase().includes(query.toLowerCase());
    } else {
      return convo.group?.name.toLowerCase().includes(query.toLowerCase());
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="size-4 text-primary" />
            Chuyển tiếp tin nhắn
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm người dùng hoặc nhóm..."
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Conversations List */}
          <div className="max-h-80 overflow-y-auto space-y-1 pr-1 beautiful-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Không tìm thấy cuộc trò chuyện nào
              </div>
            ) : (
              filteredConversations.map((convo) => {
                const status = sentStatus[convo._id] || "idle";
                let name = "";
                let avatar = null;

                if (convo.type === "direct") {
                  const otherUser = convo.participants.find((p) => p._id !== user?._id);
                  name = otherUser?.displayName || "Người dùng";
                  avatar = (
                    <UserAvatar
                      type="sidebar"
                      name={name}
                      avatarURL={otherUser?.avatarURL || undefined}
                    />
                  );
                } else {
                  name = convo.group?.name || "Nhóm";
                  avatar = (
                    <GroupChatAvatar
                      participants={convo.participants}
                      type="sidebar"
                    />
                  );
                }

                return (
                  <div
                    key={convo._id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {avatar}
                      <span className="text-sm font-medium truncate text-foreground">
                        {name}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant={status === "sent" ? "outline" : "default"}
                      className="ml-3 shrink-0"
                      disabled={status !== "idle"}
                      onClick={() => handleForward(convo._id)}
                    >
                      {status === "sending" && (
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      )}
                      {status === "idle" && "Gửi"}
                      {status === "sending" && "Đang gửi"}
                      {status === "sent" && "Đã gửi"}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessagesDialog;
