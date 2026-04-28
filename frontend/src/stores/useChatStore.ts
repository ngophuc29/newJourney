import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { set } from "zod";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      convoLoading: false, // convo loading ,
      messasgeLoading: false, //loading cho message
      setActionConversation: (id) => set({ activeConversationId: id }),
      reset() {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          convoLoading: false,
          messasgeLoading: false,
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
        imgURL,
        // conversationId,
      ) => {
        try {
          const { activeConversationId } = get();

          await chatService.sendDirectMessage(
            recipientId,
            content,
            imgURL,
            activeConversationId || undefined,
          );

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId ? { ...c, seenBy: [] } : c,
            ),
          }));
        } catch (error) {
          console.log("Loi xay ra khi gui tin nhan truc tiep", error);
        }
      },
      sendGroupMessage: async (conversationId, content, imgURL) => {
        try {
          await chatService.sendGroupMessage(conversationId, content, imgURL);
          set((state) => ({
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
                  hasMore: state.messages[convoId].hasMore,
                  nextCursor: state.messages[convoId].nextCursor || undefined,
                },
              },
            };
          });
        } catch (error) {
          console.log("Loi xay ra khi add message");
        }
      },
      updateConversation: (conversation) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversation._id ? { ...c, ...conversation } : c,
          ),
        }));
      },
      markAsSeen: async () =>{
          try {
            const { user } = useAuthStore.getState()
                      
            const { activeConversationId, conversations } = get();
            
            if (!user || !activeConversationId) {
              return
            }

            const convo = conversations.find((c) => c._id === activeConversationId)
            if (!convo) return
            if ((convo.unreadCounts?.[user._id] ?? 0) === 0) {
              return 
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
            console.log("loi xay ra khi goi mark as seen" ,error);
            
          }
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    },
  ),
);
