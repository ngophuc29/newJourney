import api from "@/lib/axios";
import type { ConversationResponse, Message } from "@/types/chat";

interface FetchMessageProps {
  messages: Message[];
  cursor?: string;
}

const pageLimit =50
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

  async fetchMessages(
    id: string,
    cursor?: string,
  ): Promise<FetchMessageProps> {
    const res = await api.get(`/conversation/${id}/messages?limit=${pageLimit}&cursor=${cursor}`)
    return {messages:res.data.messages, cursor:res.data.nextCursor}

  },
  async sendDirectMessage(recipientId: string, content: string = "", imgURL?: string, conversationId?: string) {
    const res = await api.post('/message/direct', {
      recipientId,content,imgURL,conversationId
    })
    return res.data.message
  },
  async sendGroupMessage(conversationId?: string, content: string = "", imgURL?: string) {
    const res = await api.post("/message/group", {
       
      conversationId,
      content,
      imgURL
    });
    return res.data.message;
  }
};
