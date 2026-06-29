import React, { useEffect, useState, useRef } from "react";
import { Bell, Trash2, UserPlus, MessageSquare, Users, Eye } from "lucide-react";
import { useNotificationStore, type NotificationItem } from "@/stores/useNotificationStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { useChatStore } from "@/stores/useChatStore";
import UserAvatar from "../chat/UserAvatar";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { notifications, fetchNotifications, markAsRead, deleteNotification } = useNotificationStore();
  const { acceptFriendRequest, declineFriendRequest } = useFriendStore();
  const { setActionConversation } = useChatStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (notification: NotificationItem) => {
    await markAsRead(notification._id);

    // Xử lý điều hướng khi bấm vào thông báo
    if (notification.type === "mention" && notification.relatedId) {
      // Mở tin nhắn tương ứng (nếu cần thiết, chuyển cuộc hội thoại)
      // Ở đây ta có thể để nguyên hoặc chuyển tới cuộc hội thoại
    } else if (notification.type === "group_invite" && notification.relatedId) {
      setActionConversation(notification.relatedId);
    }
    setOpen(false);
  };

  const handleAcceptRequest = async (e: React.MouseEvent, notification: NotificationItem) => {
    e.stopPropagation();
    if (!notification.relatedId) return;

    try {
      await acceptFriendRequest(notification.relatedId);
      toast.success("Đã đồng ý kết bạn!");
      await deleteNotification(notification._id);
    } catch (err) {
      toast.error("Lỗi khi đồng ý kết bạn");
    }
  };

  const handleDeclineRequest = async (e: React.MouseEvent, notification: NotificationItem) => {
    e.stopPropagation();
    if (!notification.relatedId) return;

    try {
      await declineFriendRequest(notification.relatedId);
      toast.info("Đã từ chối lời mời kết bạn.");
      await deleteNotification(notification._id);
    } catch (err) {
      toast.error("Lỗi khi từ chối kết bạn");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return <UserPlus className="size-4 text-blue-500" />;
      case "mention":
        return <MessageSquare className="size-4 text-purple-500" />;
      case "group_invite":
        return <Users className="size-4 text-green-500" />;
      default:
        return <Bell className="size-4 text-muted-foreground" />;
    }
  };

  const getNotificationText = (notification: NotificationItem) => {
    const sender = notification.senderId?.displayName || "Ai đó";
    switch (notification.type) {
      case "friend_request":
        return `${sender} đã gửi lời mời kết bạn.`;
      case "mention":
        return `${sender} đã nhắc đến bạn trong tin nhắn.`;
      case "group_invite":
        return `${sender} đã thêm bạn vào nhóm chat mới.`;
      default:
        return `Thông báo mới từ ${sender}`;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút quả chuông */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative hover:bg-muted"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-border bg-popover shadow-xl animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-foreground">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAsRead("all")}
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
              >
                <Eye className="size-3" />
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto beautiful-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="size-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">Không có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      "flex flex-col gap-2 p-3 transition-colors cursor-pointer hover:bg-muted/50",
                      !n.isRead && "bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="relative shrink-0">
                        <UserAvatar
                          type="chat"
                          name={n.senderId?.displayName || "User"}
                          avatarURL={n.senderId?.avatarURL ?? undefined}
                        />
                        <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5 shadow-sm border border-border">
                          {getNotificationIcon(n.type)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                        <p className="text-xs text-foreground leading-relaxed">
                          {getNotificationText(n)}
                        </p>
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(n.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n._id);
                        }}
                        className="text-muted-foreground hover:text-destructive shrink-0 self-start p-1 rounded-md hover:bg-muted transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    {/* Action buttons for Friend Request */}
                    {n.type === "friend_request" && (
                      <div className="flex gap-2 pl-11">
                        <Button
                          type="button"
                          size="xs"
                          onClick={(e) => handleAcceptRequest(e, n)}
                          className="bg-primary hover:bg-primary-hover text-white text-[10px] h-7 px-3"
                        >
                          Chấp nhận
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={(e) => handleDeclineRequest(e, n)}
                          className="text-[10px] h-7 px-3"
                        >
                          Từ chối
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
