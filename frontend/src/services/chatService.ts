import api from "@/lib/axios";
import type { ConversationResponse, Message } from "@/types/chat";

export const chatService = {
  async fetchConversation(): Promise<ConversationResponse> {
    const res = await api.get("/conversation");
    // backend returns { conversation: [...] } (singular) while frontend
    // expects { conversations: [...] } — normalize here
    if (res.data && res.data.conversation) {
      return { conversations: res.data.conversation };
    }
    return res.data;
  },
};
