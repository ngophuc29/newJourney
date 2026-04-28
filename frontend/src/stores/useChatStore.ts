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

          await chatService.sendDirectMessage(recipientId, content, imgURL, activeConversationId || undefined);

          set((state) => ({
            conversations: state.conversations.map((c) => c._id === activeConversationId ? { ...c, seenBy: [] } : c)
            
          }))
        } catch (error) {
          console.log("Loi xay ra khi gui tin nhan truc tiep",error);
          
        }
      },
      sendGroupMessage: async (conversationId, content, imgURL) => {
        try {
          await chatService.sendGroupMessage(
          conversationId,  
            content,
            imgURL,
          );
           set((state) => ({
             conversations: state.conversations.map(
               (c) => (c._id === conversationId ? { ...c, seenBy: [] } : c),
             ),
           }));
        } catch (error) {
          console.log("Loi xay ra khi gui tin nhan nhom ", error);
          
        }
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    },
  ),
);
// 2:01:47