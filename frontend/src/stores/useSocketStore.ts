import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";
import { useFriendStore } from "./useFriendStore";
import type { SocketState } from "@/types/store";
import type { Conversation, Message, MessageReaction } from "@/types/chat";
import type { Friend, FriendRequest } from "@/types/User";
import { toast } from "sonner";

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

type MessageReactionUpdatedPayload = {
  messageId: string;
  conversationId: string;
  reactions: MessageReaction[];
};

type MessageRevokedPayload = {
  messageId: string;
  conversationId: string;
  revokedAt?: string | null;
};

type MessageEditedPayload = {
  messageId: string;
  conversationId: string;
  content: string;
  isEdited: boolean;
  editedAt: string;
};

type MessagePinnedPayload = {
  conversationId: string;
  messageId: string;
  pinnedBy: string;
  pinnedAt: string;
  message?: Message;
};

type MessageUnpinnedPayload = {
  conversationId: string;
  messageId: string;
};

type UserTypingPayload = {
  conversationId: string;
  userId: string;
  displayName: string;
};

type UserStopTypingPayload = {
  conversationId: string;
  userId: string;
};

type FriendRequestPayload = {
  request: FriendRequest;
};

type FriendRequestAcceptedPayload = {
  requestId: string;
  friend: Friend;
};

type FriendRequestDeclinedPayload = {
  requestId: string;
  userId: string;
};

type FriendRemovedPayload = {
  friendId: string;
};

type GroupRemovedPayload = {
  conversationId: string;
};

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],

  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    if (existingSocket) return;

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("online-users", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });

    socket.on("new-message", (data: NewMessagePayload) => {
      const { message, conversation, unreadCounts } = data;

      useChatStore.getState().addMessage(message);

      const updatedConversation: Conversation = {
        ...conversation,
        unreadCounts,
      };

      socket.emit("join-conversation", conversation._id);

      if (
        useChatStore.getState().activeConversationId === message.conversationId
      ) {
        useChatStore.getState().markAsSeen();
      }

      useChatStore.getState().updateConversation(updatedConversation);
    });

    socket.on("read-message", (data: ReadMessagePayload) => {
      const { conversation, lastMessage } = data;

      const updated: Conversation = {
        ...conversation,
        lastMessage,
      };

      useChatStore.getState().updateConversation(updated);
    });

    socket.on(
      "message-reaction-updated",
      ({ conversationId, messageId, reactions }: MessageReactionUpdatedPayload) => {
        useChatStore
          .getState()
          .updateMessageReactions(conversationId, messageId, reactions);
      },
    );

    socket.on(
      "message-revoked",
      ({ conversationId, messageId, revokedAt }: MessageRevokedPayload) => {
        useChatStore
          .getState()
          .markMessageRevoked(conversationId, messageId, revokedAt);
      },
    );

    // ==================== NEW: Message Edited ====================
    socket.on(
      "message-edited",
      ({ conversationId, messageId, content, editedAt }: MessageEditedPayload) => {
        useChatStore
          .getState()
          .updateEditedMessage(conversationId, messageId, content, editedAt);
      },
    );

    // ==================== NEW: Pin/Unpin Messages ====================
    socket.on(
      "message-pinned",
      ({ conversationId, messageId, pinnedBy, pinnedAt, message }: MessagePinnedPayload) => {
        useChatStore
          .getState()
          .addPinnedMessage(conversationId, { messageId, pinnedBy, pinnedAt, message });
      },
    );

    socket.on(
      "message-unpinned",
      ({ conversationId, messageId }: MessageUnpinnedPayload) => {
        useChatStore
          .getState()
          .removePinnedMessage(conversationId, messageId);
      },
    );

    // ==================== NEW: Typing Indicator ====================
    socket.on(
      "user-typing",
      ({ conversationId, userId, displayName }: UserTypingPayload) => {
        useChatStore
          .getState()
          .setTypingUser(conversationId, { userId, displayName });
      },
    );

    socket.on(
      "user-stop-typing",
      ({ conversationId, userId }: UserStopTypingPayload) => {
        useChatStore
          .getState()
          .removeTypingUser(conversationId, userId);
      },
    );

    socket.on("new-group", (conversation: Conversation) => {
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
      toast.info(`Ban da duoc them vao nhom ${conversation.group?.name ?? ""}`);
    });

    socket.on("group-updated", (conversation: Conversation) => {
      const existed = useChatStore
        .getState()
        .conversations.some((c) => c._id === conversation._id);

      useChatStore.getState().updateConversation(conversation);
      socket.emit("join-conversation", conversation._id);

      if (!existed) {
        toast.info(
          `Ban da duoc them vao nhom ${conversation.group?.name ?? ""}`,
        );
      }
    });

    socket.on("group-removed", ({ conversationId }: GroupRemovedPayload) => {
      socket.emit("leave-conversation", conversationId);
      useChatStore.getState().removeConversation(conversationId);
    });

    socket.on("friend-request-received", ({ request }: FriendRequestPayload) => {
      useFriendStore.getState().addReceivedRequest(request);
      toast.info(
        `${request.from?.displayName || request.from?.username || "Ai do"} da gui loi moi ket ban`,
      );
    });

    socket.on("friend-request-sent", ({ request }: FriendRequestPayload) => {
      useFriendStore.getState().addSentRequest(request);
    });

    socket.on(
      "friend-request-accepted",
      ({ requestId, friend }: FriendRequestAcceptedPayload) => {
        const friendStore = useFriendStore.getState();

        friendStore.removeRequest(requestId);
        friendStore.addFriendToList(friend);
        friendStore.removeSuggestedUser(friend._id);
        toast.success(
          `${friend.displayName || friend.username} da chap nhan loi moi ket ban`,
        );
      },
    );

    socket.on(
      "friend-request-accepted-self",
      ({ requestId, friend }: FriendRequestAcceptedPayload) => {
        const friendStore = useFriendStore.getState();

        friendStore.removeRequest(requestId);
        friendStore.addFriendToList(friend);
        friendStore.removeSuggestedUser(friend._id);
      },
    );

    socket.on(
      "friend-request-declined",
      ({ requestId, userId }: FriendRequestDeclinedPayload) => {
        const friendStore = useFriendStore.getState();

        friendStore.removeRequest(requestId);
        friendStore.updateSuggestionStatus(userId, null);
      },
    );

    socket.on(
      "friend-request-declined-self",
      ({ requestId, userId }: FriendRequestDeclinedPayload) => {
        const friendStore = useFriendStore.getState();

        friendStore.removeRequest(requestId);
        friendStore.updateSuggestionStatus(userId, null);
      },
    );

    socket.on("friend-removed", ({ friendId }: FriendRemovedPayload) => {
      useFriendStore.getState().removeFriendFromList(friendId);
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
