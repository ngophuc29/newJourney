import { create } from "zustand";
import api from "@/lib/axios";

export interface NotificationItem {
  _id: string;
  userId: string;
  type: "friend_request" | "mention" | "group_invite" | "follow" | "post_like" | "post_comment" | "post_mention" | "comment_mention";
  senderId: {
    _id: string;
    displayName: string;
    avatarURL?: string | null;
    username: string;
  };
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: NotificationItem) => void;
  markAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  loading: false,

  fetchNotifications: async () => {
    try {
      set({ loading: true });
      const res = await api.get("/notifications");
      set({ notifications: res.data.notifications, loading: false });
    } catch (error) {
      console.error("Lỗi khi lấy thông báo:", error);
      set({ loading: false });
    }
  },

  addNotification: (notification: NotificationItem) => {
    set((state) => {
      // Tránh trùng lặp
      if (state.notifications.some((n) => n._id === notification._id)) {
        return state;
      }
      return { notifications: [notification, ...state.notifications] };
    });
  },

  markAsRead: async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => {
        if (id === "all") {
          return {
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          };
        }
        return {
          notifications: state.notifications.map((n) =>
            n._id === id ? { ...n, isRead: true } : n
          ),
        };
      });
    } catch (error) {
      console.error("Lỗi khi đánh dấu đọc thông báo:", error);
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      set((state) => ({
        notifications: state.notifications.filter((n) => n._id !== id),
      }));
    } catch (error) {
      console.error("Lỗi khi xóa thông báo:", error);
    }
  },
}));
