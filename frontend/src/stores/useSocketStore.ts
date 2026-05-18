import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";
import type { SocketState } from "@/types/store";
import type { Conversation, Message } from "@/types/chat";

const baseURL = import.meta.env.VITE_SOCKET_URL;

type NewMessagePayload = {
  message: Message;
  conversation: Conversation;
  unreadCounts: Record<string, number>;
};

type ReadMessagePayload = {
  conversation: Conversation;
  lastMessage: Conversation["lastMessage"];
};

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],

  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    // ✅ tránh tạo nhiều socket
    if (existingSocket) return;

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket });

    // =========================
    // ✅ CONNECT
    // =========================
    socket.on("connect", () => {
      console.log("✅ Socket connected");
    });

    // =========================
    // ✅ ONLINE USERS
    // =========================
    socket.on("online-users", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });

    // =========================
    // ✅ NEW MESSAGE
    // =========================
    socket.on("new-message", (data: NewMessagePayload) => {
      const { message, conversation, unreadCounts } = data;

      // thêm message vào store
      useChatStore.getState().addMessage(message);

      // ❗ KHÔNG build lại lastMessage → dùng từ backend
      const updatedConversation: Conversation = {
        ...conversation,
        unreadCounts,
      };

      // nếu đang mở convo thì mark seen
      if (
        useChatStore.getState().activeConversationId === message.conversationId
      ) {
        useChatStore.getState().markAsSeen();
      }

      useChatStore.getState().updateConversation(updatedConversation);
    });

    // =========================
    // ✅ READ MESSAGE
    // =========================
    socket.on("read-message", (data: ReadMessagePayload) => {
      const { conversation, lastMessage } = data;

      const updated: Conversation = {
        ...conversation,
        lastMessage, // backend đã đúng type
      };

      useChatStore.getState().updateConversation(updated);
    });

    // =========================
    // ✅ NEW GROUP
    // =========================
    socket.on("new-group", (conversation: Conversation) => {
      useChatStore.getState().addConvo(conversation);

      // join room ngay sau khi tạo
      socket.emit("join-conversation", conversation._id);
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;

    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
