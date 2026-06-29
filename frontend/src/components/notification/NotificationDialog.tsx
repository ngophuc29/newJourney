import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useChatStore } from "@/stores/useChatStore";
import UserAvatar from "../chat/UserAvatar";
import { Bell, Check, Trash2, MessageSquare, UserPlus, Users, Loader2, Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NotificationDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const NotificationDialog = ({ open, setOpen }: NotificationDialogProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { notifications, loading, fetchNotifications, markAsRead, deleteNotification } = useNotificationStore();
    const { conversations, setActionConversation } = useChatStore();

    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open]);

    const handleNotificationClick = async (notification: any) => {
        // Mark as read first
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }

        // Navigate based on type
        if (notification.type === "mention" || notification.type === "group_invite") {
            if (notification.relatedId) {
                // relatedId could be conversationId (new) or messageId (old)
                let convo = conversations.find(c => c._id === notification.relatedId);
                
                // Fallback for old notifications: search through loaded messages in store
                if (!convo) {
                    const allMessages = useChatStore.getState().messages;
                    for (const convoId in allMessages) {
                        const hasMsg = allMessages[convoId]?.items?.some(m => m._id === notification.relatedId);
                        if (hasMsg) {
                            convo = conversations.find(c => c._id === convoId);
                            break;
                        }
                    }
                }

                if (convo) {
                    setActionConversation(convo._id);
                    setOpen(false);
                } else {
                    // Try to fetch conversations again and select
                    useChatStore.getState().fetchConversation();
                    toast.info("Đang chuyển đến cuộc trò chuyện...");
                    setTimeout(() => {
                        const updatedConvos = useChatStore.getState().conversations;
                        const target = updatedConvos.find(c => c._id === notification.relatedId);
                        if (target) {
                            setActionConversation(target._id);
                            setOpen(false);
                        }
                    }, 500);
                }
            }
        } else if (notification.type === "friend_request") {
            toast.info("Vui lòng kiểm tra tab 'Bạn bè' hoặc 'Lời mời kết bạn' trong menu.");
        } else if (notification.type === "follow") {
            if (notification.senderId?.username) {
                navigate(`/profile/${notification.senderId.username}`);
                setOpen(false);
            }
        } else if (notification.type === "post_like" || notification.type === "post_comment") {
            if (notification.relatedId) {
                if (location.pathname === `/post/${notification.relatedId}`) {
                    window.dispatchEvent(new CustomEvent("refresh-post", { detail: { postId: notification.relatedId } }));
                } else {
                    navigate(`/post/${notification.relatedId}`);
                }
                setOpen(false);
            }
        }
    };

    const getNotificationContent = (notification: any) => {
        const name = notification.senderId?.displayName || "Ai đó";
        switch (notification.type) {
            case "friend_request":
                return {
                    text: `${name} đã gửi cho bạn lời mời kết bạn.`,
                    icon: <UserPlus className="size-4 text-blue-500" />,
                };
            case "mention":
                return {
                    text: `${name} đã nhắc đến bạn trong cuộc trò chuyện.`,
                    icon: <MessageSquare className="size-4 text-purple-500" />,
                };
            case "group_invite":
                return {
                    text: `${name} đã thêm bạn vào nhóm chat mới.`,
                    icon: <Users className="size-4 text-green-500" />,
                };
            case "follow":
                return {
                    text: `${name} đã bắt đầu theo dõi bạn.`,
                    icon: <UserPlus className="size-4 text-blue-500" />,
                };
            case "post_like":
                return {
                    text: `${name} đã thích bài viết của bạn.`,
                    icon: <Heart className="size-4 text-rose-500 fill-rose-500" />,
                };
            case "post_comment":
                return {
                    text: `${name} đã bình luận về bài viết của bạn.`,
                    icon: <MessageCircle className="size-4 text-emerald-500" />,
                };
            default:
                return {
                    text: `${name} đã gửi một thông báo.`,
                    icon: <Bell className="size-4 text-gray-500" />,
                };
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 600);
        
        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${Math.floor(diffMins / 60)} giờ trước`;
        return date.toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-lg flex flex-col max-h-[85vh]">
                <DialogHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-3">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Bell className="size-5 text-primary" />
                        Thông báo
                        {unreadCount > 0 && (
                            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium">
                                {unreadCount} mới
                            </span>
                        )}
                    </DialogTitle>
                    {unreadCount > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => markAsRead("all")}
                            className="text-xs text-primary hover:text-primary-hover h-8 px-2"
                        >
                            Đọc tất cả
                        </Button>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-2 -mx-6 px-6 space-y-2 min-h-[300px] max-h-[60vh] no-scrollbar">
                    {loading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-2">
                            <Loader2 className="size-8 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Đang tải thông báo...</span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-sm gap-2">
                            <Bell className="size-12 opacity-30" />
                            <span>Không có thông báo nào</span>
                        </div>
                    ) : (
                        notifications.map((notif) => {
                            const content = getNotificationContent(notif);
                            return (
                                <div 
                                    key={notif._id}
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-xl border border-border/20 transition-all cursor-pointer hover:bg-muted/30 relative group",
                                        !notif.isRead ? "bg-primary/5 border-primary/10" : "bg-background"
                                    )}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className="relative shrink-0">
                                        <UserAvatar
                                            type="chat"
                                            name={notif.senderId?.displayName || "User"}
                                            avatarURL={notif.senderId?.avatarURL ?? undefined}
                                        />
                                        <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full border border-border/20">
                                            {content.icon}
                                        </div>
                                    </div>
                                    <div className="flex-1 text-left min-w-0 pr-6">
                                        <p className={cn(
                                            "text-sm leading-snug",
                                            !notif.isRead ? "font-medium text-foreground" : "text-muted-foreground"
                                        )}>
                                            {content.text}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground block mt-1">
                                            {formatTimeAgo(notif.createdAt)}
                                        </span>
                                    </div>

                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notif.isRead && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="size-7 rounded-full hover:bg-primary/10 hover:text-primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notif._id);
                                                }}
                                                title="Đánh dấu đã đọc"
                                            >
                                                <Check className="size-3.5" />
                                            </Button>
                                        )}
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="size-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notif._id);
                                            }}
                                            title="Xóa thông báo"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NotificationDialog;
