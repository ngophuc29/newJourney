import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { set } from "zod";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      loading: false,
      setActionConversation: (id) => set({ activeConversationId: id }),
      reset() {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          loading: false,
        });
      },
      fetchConversation: async () => {
        try {
          set({ loading: true });
            const { conversations } = await chatService.fetchConversation();
            
            set({conversations,loading :false})
        } catch (error) {
            console.log("Loi xay ra khi fetch conversation")
            set({loading:false})
        }
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    },
  ),
);
