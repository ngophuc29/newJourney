import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { RotateCcw, SmilePlus } from "lucide-react";
import { useState } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";

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
    const { revokeMessage, toggleMessageReaction } = useChatStore();
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
    const reactionOptions = ["👍", "❤️", "😂", "😮", "😢", "😡"];
    const reactionCounts = (message.reactions ?? []).reduce<Record<string, number>>(
        (acc, reaction) => {
            acc[reaction.emoji] = (acc[reaction.emoji] ?? 0) + 1;
            return acc;
        },
        {},
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
                            "p-3 overflow-hidden",
                            message.isOwn ? "bg-chat-bubble-sent border-0" : "bg-chat-bubble-received"
                        )}
                    >
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
                    </Card>

                    {!message.isRevoked && (
                        <div
                            className={cn(
                                "absolute top-1 flex gap-1 opacity-0 transition-opacity group-hover/message:opacity-100",
                                message.isOwn ? "-left-16" : "-right-9",
                            )}
                        >
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
        </>
    );
};

export default MessageItem;
