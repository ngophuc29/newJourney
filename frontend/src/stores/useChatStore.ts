import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";
import type { Conversation } from "@/types/chat";

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      loading: false,
      conversations: [],
      messages: {},
      activeConversationId: null,
      convoLoading: false, // convo loading ,
      messasgeLoading: false, //loading cho message

      // Reply & Edit state
      replyingTo: null,
      editingMessage: null,

      // Typing indicator state
      typingUsers: {},

      setActionConversation: (id) => set({ activeConversationId: id }),
      reset() {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          convoLoading: false,
          messasgeLoading: false,
          replyingTo: null,
          editingMessage: null,
          typingUsers: {},
        });
      },
      fetchConversation: async () => {
        try {
          set({ convoLoading: true });
          const { conversations } = await chatService.fetchConversation();

          set({ conversations, convoLoading: false });
        } catch (error) {
          console.log("Loi xay ra khi fetch conversation");
          set({ convoLoading: false });
        }
      },
      fetchMessages: async (conversationId) => {
        try {
          const { activeConversationId, messages } = get();
          const { user } = useAuthStore.getState();

          const convoId = conversationId ?? activeConversationId;

          if (!convoId) return;

          const current = messages?.[convoId];
          const nextCursor =
            current?.nextCursor === undefined ? "" : current?.nextCursor;

          if (nextCursor === null) return;

          set({ messasgeLoading: true });

          const { messages: fetched, cursor } = await chatService.fetchMessages(
            convoId,
            nextCursor,
          );

          const processed = fetched.map((m) => ({
            ...m,
            isOwn: m.senderId === user?._id,
          }));

          set((state) => {
            const prev = state.messages[convoId]?.items ?? []; //lay tin cu
            const merged =
              prev.length > 0 ? [...processed, ...prev] : processed; // fetch them tin nhan moi ve

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: merged, // ds tin nhan sau khi merged
                  hasMore: !!cursor, // dua vao de bt co the con loading them tin nua k
                  nextCursor: cursor ?? null,
                },
              },
            };
          });
        } catch (error) {
          console.log("loi xay ra khi fetchMessages ", error);
        } finally {
          set({ messasgeLoading: false });
        }
      },
      sendDirectMessage: async (
        recipientId,
        content,
        mediaFile,
      ) => {
        try {
          const { activeConversationId, replyingTo } = get();

          await chatService.sendDirectMessage(
            recipientId,
            content,
            mediaFile,
            activeConversationId || undefined,
            replyingTo?._id || undefined,
          );

          set((state) => ({
            replyingTo: null,
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId ? { ...c, seenBy: [] } : c,
            ),
          }));
        } catch (error) {
          console.log("Loi xay ra khi gui tin nhan truc tiep", error);
        }
      },
      sendGroupMessage: async (conversationId, content, mediaFile) => {
        try {
          const { replyingTo } = get();

          await chatService.sendGroupMessage(
            conversationId,
            content,
            mediaFile,
            replyingTo?._id || undefined,
          );

          set((state) => ({
            replyingTo: null,
            conversations: state.conversations.map((c) =>
              c._id === conversationId ? { ...c, seenBy: [] } : c,
            ),
          }));
        } catch (error) {
          console.log("Loi xay ra khi gui tin nhan nhom ", error);
        }
      },
      addMessage: async (message) => {
        try {
          const { user } = useAuthStore.getState();
          const { fetchMessages } = get();

          message.isOwn = message.senderId === user?._id;

          const convoId = message.conversationId;

          let prevItems = get().messages[convoId]?.items ?? [];

          if (prevItems.length === 0) {
            await fetchMessages(message.conversationId);
            prevItems = get().messages[convoId]?.items ?? [];
          }

          set((state) => {
            if (prevItems.some((m) => m._id === message._id)) {
              return state;
            }
            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: [...prevItems, message],
                  hasMore: state.messages[convoId]?.hasMore ?? false,
                  nextCursor: state.messages[convoId]?.nextCursor || undefined,
                },
              },
            };
          });
        } catch (error) {
          console.log("Loi xay ra khi add message");
        }
      },
      toggleMessageReaction: async (messageId, emoji) => {
        try {
          await chatService.toggleMessageReaction(messageId, emoji);
        } catch (error) {
          console.log("Loi xay ra khi reaction tin nhan", error);
          throw error;
        }
      },
      revokeMessage: async (messageId) => {
        try {
          await chatService.revokeMessage(messageId);
        } catch (error) {
          console.log("Loi xay ra khi thu hoi tin nhan", error);
          throw error;
        }
      },
      markMessageRevoked: (conversationId, messageId, revokedAt) => {
        set((state) => {
          const bucket = state.messages[conversationId];

          const conversations = state.conversations.map((conversation) =>
            conversation._id === conversationId &&
            conversation.lastMessage?._id === messageId
              ? {
                  ...conversation,
                  lastMessage: {
                    ...conversation.lastMessage,
                    content: "Tin nhan da bi thu hoi",
                  },
                }
              : conversation,
          );

          if (!bucket) return { conversations };

          return {
            conversations,
            messages: {
              ...state.messages,
              [conversationId]: {
                ...bucket,
                items: bucket.items.map((message) =>
                  message._id === messageId
                    ? {
                        ...message,
                        content: "",
                        mediaUrl: null,
                        imageUrl: null,
                        imgUrl: null,
                        mediaType: null,
                        mediaPublicId: null,
                        reactions: [],
                        isRevoked: true,
                        revokedAt: revokedAt ?? null,
                      }
                    : message,
                ),
              },
            },
          };
        });
      },
      updateMessageReactions: (conversationId, messageId, reactions) => {
        set((state) => {
          const bucket = state.messages[conversationId];
          if (!bucket) return state;

          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...bucket,
                items: bucket.items.map((message) =>
                  message._id === messageId
                    ? { ...message, reactions }
                    : message,
                ),
              },
            },
          };
        });
      },
      updateConversation: (conversation: Conversation) => {
        set((state) => {
          const current = state.conversations.find(
            (c) => c._id === conversation._id,
          );
          const merged = current ? { ...current, ...conversation } : conversation;
          const rest = state.conversations.filter(
            (c) => c._id !== conversation._id,
          );

          return {
            conversations: [merged, ...rest],
          };
        });
      },
      removeConversation: (conversationId: string) => {
        set((state) => {
          const nextActiveId =
            state.activeConversationId === conversationId
              ? null
              : state.activeConversationId;
          const { [conversationId]: _removedMessages, ...restMessages } =
            state.messages;

          return {
            conversations: state.conversations.filter(
              (c) => c._id !== conversationId,
            ),
            messages: restMessages,
            activeConversationId: nextActiveId,
          };
        });
      },
      markAsSeen: async () => {
        try {
          const { user } = useAuthStore.getState();

          const { activeConversationId, conversations } = get();

          if (!user || !activeConversationId) {
            return;
          }

          const convo = conversations.find(
            (c) => c._id === activeConversationId,
          );
          if (!convo) return;
          if ((convo.unreadCounts?.[user._id] ?? 0) === 0) {
            return;
          }

          await chatService.markAsSeen(activeConversationId);

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId && c.lastMessage
                ? {
                    ...c,
                    unreadCounts: {
                      ...c.unreadCounts,
                      [user._id]: 0,
                    },
                  }
                : c,
            ),
          }));
        } catch (error) {
          console.log("loi xay ra khi goi mark as seen", error);
        }
      },
      addConvo: (convo) => {
        set((state) => {
          const current = state.conversations.find(
            (c) => c._id.toString() === convo._id.toString(),
          );
          const merged = current ? { ...current, ...convo } : convo;
          const rest = state.conversations.filter(
            (c) => c._id.toString() !== convo._id.toString(),
          );

          return {
            conversations: [merged, ...rest],
            activeConversationId: convo._id,
          };
        });
      },
      createConversation: async (type, name, memberIds) => {
        try {
          set({ loading: true });
          const conversation = await chatService.createConversation(
            type,
            name,
            memberIds,
          );
          get().addConvo(conversation);

          useSocketStore
            .getState()
            .socket?.emit("join-conversation", conversation._id);
        } catch (error) {
          console.log("Loi xay ra khi goi create conversation trong store");
        } finally {
          set({ loading: false });
        }
      },
      openDirectConversation: async (friendId) => {
        try {
          set({ loading: true });

          let conversation = get().conversations.find(
            (convo) =>
              convo.type === "direct" &&
              convo.participants.some((p) => p._id === friendId),
          );

          if (conversation) {
            get().addConvo(conversation);
          } else {
            conversation = await chatService.createConversation("direct", "", [
              friendId,
            ]);
            if (!conversation) return;

            get().addConvo(conversation);

            useSocketStore
              .getState()
              .socket?.emit("join-conversation", conversation._id);
          }

          if (!conversation) return;

          const messageState = get().messages[conversation._id];
          const shouldFetchMessages =
            !messageState ||
            (messageState.items.length === 0 && !!conversation.lastMessage);

          if (shouldFetchMessages) {
            if (messageState?.items.length === 0 && conversation.lastMessage) {
              set((state) => {
                const { [conversation._id]: _emptyCache, ...rest } =
                  state.messages;

                return { messages: rest };
              });
            }

            await get().fetchMessages(conversation._id);
          }
        } catch (error) {
          console.log("Loi xay ra khi mo direct conversation", error);
        } finally {
          set({ loading: false });
        }
      },
      renameGroup: async (conversationId, name) => {
        try {
          set({ loading: true });
          const conversation = await chatService.renameGroup(conversationId, name);
          get().updateConversation(conversation);
        } catch (error) {
          console.log("Loi xay ra khi doi ten nhom", error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      addGroupMembers: async (conversationId, memberIds) => {
        try {
          set({ loading: true });
          const conversation = await chatService.addGroupMembers(
            conversationId,
            memberIds,
          );
          get().updateConversation(conversation);
        } catch (error) {
          console.log("Loi xay ra khi them thanh vien nhom", error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      removeGroupMember: async (conversationId, memberId) => {
        try {
          set({ loading: true });
          const conversation = await chatService.removeGroupMember(
            conversationId,
            memberId,
          );
          get().updateConversation(conversation);
        } catch (error) {
          console.log("Loi xay ra khi xoa thanh vien nhom", error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      transferGroupOwner: async (conversationId, newOwnerId) => {
        try {
          set({ loading: true });
          const conversation = await chatService.transferGroupOwner(
            conversationId,
            newOwnerId,
          );
          get().updateConversation(conversation);
        } catch (error) {
          console.log("Loi xay ra khi chuyen truong nhom", error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      leaveGroup: async (conversationId, newOwnerId) => {
        try {
          set({ loading: true });
          const result = await chatService.leaveGroup(conversationId, newOwnerId);

          if (result?.conversation) {
            get().updateConversation(result.conversation);
          }
          get().removeConversation(conversationId);
        } catch (error) {
          console.log("Loi xay ra khi roi nhom", error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // ==================== Reply & Edit ====================
      setReplyingTo: (message) => set({ replyingTo: message, editingMessage: null }),
      setEditingMessage: (message) => set({ editingMessage: message, replyingTo: null }),

      editMessage: async (messageId, content) => {
        try {
          await chatService.editMessage(messageId, content);
          set({ editingMessage: null });
        } catch (error) {
          console.log("Loi xay ra khi chinh sua tin nhan", error);
          throw error;
        }
      },

      updateEditedMessage: (conversationId, messageId, content, editedAt) => {
        set((state) => {
          const bucket = state.messages[conversationId];

          const conversations = state.conversations.map((conversation) =>
            conversation._id === conversationId &&
            conversation.lastMessage?._id === messageId
              ? {
                  ...conversation,
                  lastMessage: {
                    ...conversation.lastMessage,
                    content,
                  },
                }
              : conversation,
          );

          if (!bucket) return { conversations };

          return {
            conversations,
            messages: {
              ...state.messages,
              [conversationId]: {
                ...bucket,
                items: bucket.items.map((message) =>
                  message._id === messageId
                    ? { ...message, content, isEdited: true, editedAt }
                    : message,
                ),
              },
            },
          };
        });
      },

      // ==================== Pin Messages ====================
      pinMessage: async (conversationId, messageId) => {
        try {
          await chatService.pinMessage(conversationId, messageId);
        } catch (error) {
          console.log("Loi xay ra khi ghim tin nhan", error);
          throw error;
        }
      },

      unpinMessage: async (conversationId, messageId) => {
        try {
          await chatService.unpinMessage(conversationId, messageId);
        } catch (error) {
          console.log("Loi xay ra khi bo ghim tin nhan", error);
          throw error;
        }
      },

      addPinnedMessage: (conversationId, pin) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversationId
              ? {
                  ...c,
                  pinnedMessages: [...(c.pinnedMessages || []), pin],
                }
              : c,
          ),
        }));
      },

      removePinnedMessage: (conversationId, messageId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversationId
              ? {
                  ...c,
                  pinnedMessages: (c.pinnedMessages || []).filter(
                    (p) => p.messageId !== messageId,
                  ),
                }
              : c,
          ),
        }));
      },

      // ==================== Search Messages ====================
      searchMessages: async (conversationId, query) => {
        try {
          return await chatService.searchMessages(conversationId, query);
        } catch (error) {
          console.log("Loi xay ra khi tim kiem tin nhan", error);
          return [];
        }
      },

      // ==================== Typing Indicator ====================
      setTypingUser: (conversationId, user) => {
        set((state) => {
          const current = state.typingUsers[conversationId] || [];
          // Don't add if already in list
          if (current.some((u) => u.userId === user.userId)) return state;
          return {
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: [...current, user],
            },
          };
        });
      },

      removeTypingUser: (conversationId, userId) => {
        set((state) => {
          const current = state.typingUsers[conversationId] || [];
          return {
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: current.filter((u) => u.userId !== userId),
            },
          };
        });
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    },
  ),
);
