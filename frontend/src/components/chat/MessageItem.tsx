import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { RotateCcw, SmilePlus, Reply, Pencil, Pin, Share2 } from "lucide-react";
import { useState } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import ForwardMessagesDialog from "./ForwardMessagesDialog";

interface MessageItemProps {
    message: Message;
    index: number;
    messages: Message[];
    selectedConvo: Conversation;
    lastMessageStatus: "delivered" | "seen";
}

const MessageItem = ({
    message,
    index,
    messages,
    selectedConvo,
    lastMessageStatus,
}: MessageItemProps) => {
    const [reactionOpen, setReactionOpen] = useState(false);
    const [forwardOpen, setForwardOpen] = useState(false);
    const { revokeMessage, toggleMessageReaction, setReplyingTo, setEditingMessage, pinMessage } = useChatStore();
    const { user } = useAuthStore();
    const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

    const isShowTime =
        index === 0 ||
        new Date(message.createdAt).getTime() -
        new Date(prev?.createdAt || 0).getTime() >
        300000; // 5 phút

    const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

    const participant = selectedConvo.participants.find(
        (p: Participant) => p._id.toString() === message.senderId.toString()
    );
    const mediaUrl = message.mediaUrl || message.imageUrl || message.imgUrl;
    const canRevoke = message.isOwn && !message.isRevoked && message.type !== "system";
    const canEdit = message.isOwn && !message.isRevoked && message.type !== "system" && !message.mediaUrl;
    const reactionOptions = ["👍", "❤️", "😂", "😮", "😢", "😡"];
    const reactionCounts = (message.reactions ?? []).reduce<Record<string, number>>(
        (acc, reaction) => {
            acc[reaction.emoji] = (acc[reaction.emoji] ?? 0) + 1;
            return acc;
        },
        {},
    );

    // Check if message is pinned
    const isPinned = selectedConvo.pinnedMessages?.some(
        (p) => p.messageId === message._id
    );

    const handleReaction = async (emoji: string) => {
        if (message.isRevoked) return;

        try {
            setReactionOpen(false);
            await toggleMessageReaction(message._id, emoji);
        } catch (error) {
            console.log("Loi khi reaction tin nhan", error);
        }
    };

    const handleRevoke = async () => {
        const ok = window.confirm("Thu hoi tin nhan nay?");
        if (!ok) return;

        try {
            await revokeMessage(message._id);
        } catch (error) {
            console.log("Loi khi thu hoi tin nhan", error);
        }
    };

    const handleReply = () => {
        setReplyingTo(message);
    };

    const handleEdit = () => {
        setEditingMessage(message);
    };

    const handlePin = async () => {
        try {
            await pinMessage(selectedConvo._id, message._id);
        } catch (error) {
            console.log("Loi khi ghim tin nhan", error);
        }
    };

    const handleScrollToReply = () => {
        if (!message.replyTo?._id) return;
        const targetEl = document.getElementById(`message-${message.replyTo._id}`);
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

    if (message.type === "system") {
        return (
            <div className="my-3 flex justify-center px-4">
                <span className="max-w-[80%] rounded-full bg-muted px-3 py-1 text-center text-xs text-muted-foreground">
                    {message.content}
                </span>
            </div>
        );
    }

    return (
        <>
           

            <div
                id={message._id ? `message-${message._id}` : undefined}
                className={cn(
                    "flex gap-2 message-bounce mt-1",
                    message.isOwn ? "justify-end" : "justify-start"
                )}
            >
                {/* avatar */}
                {!message.isOwn && (
                    <div className="w-8">
                        {isGroupBreak && (
                            <UserAvatar
                                type="chat"
                                name={participant?.displayName ?? "Moji"}
                                avatarURL={participant?.avatarURL ?? undefined}
                            />
                        )}
                    </div>
                )}

                {/* tin nhắn */}
                <div
                    className={cn(
                        "max-w-xs lg:max-w-md space-y-1 flex flex-col relative group/message",
                        message.isOwn ? "items-end" : "items-start"
                    )}
                >
                    <Card
                        className={cn(
                            "p-3 overflow-hidden message-card transition-all duration-300",
                            message.isOwn ? "bg-chat-bubble-sent border-0" : "bg-chat-bubble-received",
                            isPinned && "ring-1 ring-primary/30"
                        )}
                    >
                        {/* Forwarded indicator */}
                        {message.isForwarded && (
                            <div className="mb-1.5 flex items-center gap-1">
                                <span className={cn(
                                    "text-[10px] italic flex items-center gap-1 font-medium",
                                    message.isOwn ? "text-white/70" : "text-muted-foreground"
                                )}>
                                    <Share2 className="size-2.5" />
                                    Chuyển tiếp từ {message.forwardedFrom?.displayName || "Người dùng"}
                                </span>
                            </div>
                        )}

                        {/* Reply quote */}
                        {!message.isRevoked && message.replyTo && (
                            <div 
                                onClick={handleScrollToReply}
                                className={cn(
                                    "mb-2 rounded-md border-l-2 border-primary/50 pl-2 py-1 cursor-pointer transition-all duration-200",
                                    message.isOwn 
                                        ? "bg-white/10 hover:bg-white/20" 
                                        : "bg-muted/50 hover:bg-muted"
                                )}
                            >
                                <p className={cn(
                                    "text-[10px] font-semibold",
                                    message.isOwn ? "text-white/70" : "text-primary"
                                )}>
                                    {message.replyTo.senderName || "Người dùng"}
                                </p>
                                <p className={cn(
                                    "text-[11px] truncate max-w-[200px]",
                                    message.isOwn ? "text-white/60" : "text-muted-foreground"
                                )}>
                                    {message.replyTo.content
                                        ? message.replyTo.content
                                        : message.replyTo.mediaType === "image"
                                            ? "📷 Ảnh"
                                            : message.replyTo.mediaType === "video"
                                                ? "🎥 Video"
                                                : "Tin nhắn"}
                                </p>
                            </div>
                        )}

                        {/* Pinned indicator */}
                        {isPinned && (
                            <div className="mb-1 flex items-center gap-1">
                                <Pin className="size-2.5 text-primary/60" />
                                <span className={cn(
                                    "text-[10px]",
                                    message.isOwn ? "text-white/50" : "text-muted-foreground"
                                )}>
                                    Đã ghim
                                </span>
                            </div>
                        )}

                        {message.isRevoked && (
                            <p
                                className={cn(
                                    "text-sm italic",
                                    message.isOwn ? "text-white/80" : "text-foreground/70",
                                )}
                            >
                                Tin nhắn đã bị thu hồi
                            </p>
                        )}

                        {!message.isRevoked && mediaUrl && message.mediaType === "video" && (
                            <video
                                src={mediaUrl}
                                controls
                                className="mb-2 max-h-80 max-w-full rounded-md"
                            />
                        )}

                        {!message.isRevoked && mediaUrl && message.mediaType !== "video" && (
                            <img
                                src={mediaUrl}
                                alt="Message media"
                                className="mt-2 mb-2 max-h-80 max-w-full rounded-md object-cover"
                            />
                        )}

                        {!message.isRevoked && message.content && (
                            <p
                                className={cn(
                                    "text-sm leading-relaxed break-words",
                                    message.isOwn ? "text-white" : "text-foreground",
                                )}
                            >
                                {message.content}
                            </p>
                        )}

                        {/* Edited tag */}
                        {!message.isRevoked && message.isEdited && (
                            <span className={cn(
                                "text-[10px] italic",
                                message.isOwn ? "text-white/50" : "text-muted-foreground"
                            )}>
                                (đã chỉnh sửa)
                            </span>
                        )}
                    </Card>

                    {!message.isRevoked && (
                        <div
                            className={cn(
                                "absolute top-1 flex gap-0.5 opacity-0 transition-opacity z-20 group-hover/message:opacity-100",
                                message.isOwn ? "right-full mr-2" : "left-full ml-2",
                            )}
                        >
                            {/* Reply button */}
                            <Button
                                type="button"
                                size="icon-xs"
                                variant="outline"
                                className="bg-background"
                                title="Trả lời"
                                onClick={handleReply}
                            >
                                <Reply className="size-3" />
                            </Button>

                            {/* Forward button */}
                            <Button
                                type="button"
                                size="icon-xs"
                                variant="outline"
                                className="bg-background"
                                title="Chuyển tiếp"
                                onClick={() => setForwardOpen(true)}
                            >
                                <Share2 className="size-3" />
                            </Button>

                            {/* Edit button */}
                            {canEdit && (
                                <Button
                                    type="button"
                                    size="icon-xs"
                                    variant="outline"
                                    className="bg-background"
                                    title="Chỉnh sửa"
                                    onClick={handleEdit}
                                >
                                    <Pencil className="size-3" />
                                </Button>
                            )}

                            {/* Pin button */}
                            {!isPinned && (
                                <Button
                                    type="button"
                                    size="icon-xs"
                                    variant="outline"
                                    className="bg-background"
                                    title="Ghim"
                                    onClick={handlePin}
                                >
                                    <Pin className="size-3" />
                                </Button>
                            )}

                            {canRevoke && (
                                <Button
                                    type="button"
                                    size="icon-xs"
                                    variant="outline"
                                    className="bg-background"
                                    title="Thu hoi"
                                    onClick={handleRevoke}
                                >
                                    <RotateCcw className="size-3" />
                                </Button>
                            )}

                            <Button
                                type="button"
                                size="icon-xs"
                                variant="outline"
                                className="bg-background"
                                onClick={() => setReactionOpen((current) => !current)}
                            >
                                <SmilePlus className="size-3" />
                            </Button>

                            {reactionOpen && (
                                <div
                                    className={cn(
                                        "absolute top-7 z-20 flex gap-1 rounded-md border border-border bg-popover p-1 shadow-md",
                                        message.isOwn ? "right-0" : "left-0",
                                    )}
                                >
                                    {reactionOptions.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            className={cn(
                                                "rounded px-1.5 py-1 text-base hover:bg-muted",
                                                message.reactions?.some(
                                                    (reaction) =>
                                                        reaction.userId === user?._id &&
                                                        reaction.emoji === emoji,
                                                ) && "bg-muted",
                                            )}
                                            onClick={() => handleReaction(emoji)}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {!message.isRevoked && Object.keys(reactionCounts).length > 0 && (
                        <div className="flex flex-wrap gap-1 px-1">
                            {Object.entries(reactionCounts).map(([emoji, count]) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    className={cn(
                                        "rounded-full border border-border bg-background px-2 py-0.5 text-xs shadow-xs",
                                        message.reactions?.some(
                                            (reaction) =>
                                                reaction.userId === user?._id &&
                                                reaction.emoji === emoji,
                                        ) && "border-primary text-primary",
                                    )}
                                    onClick={() => handleReaction(emoji)}
                                >
                                    {emoji} {count}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* time */}
                    {isShowTime && (
                        <span className="flex justify-center text-xs text-muted-foreground px-1">
                            {formatMessageTime(new Date(message.createdAt))}
                        </span>
                    )}
                    {/* seen/ delivered */}
                    {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-xs px-1.5 py-0.5 h-4 border-0",
                                lastMessageStatus === "seen"
                                    ? "bg-primary/20 text-primary"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            {lastMessageStatus}
                        </Badge>
                    )}
                </div>
            </div>
            {forwardOpen && (
                <ForwardMessagesDialog
                    open={forwardOpen}
                    onOpenChange={setForwardOpen}
                    messageId={message._id}
                />
            )}
        </>
    );
};

export default MessageItem;
