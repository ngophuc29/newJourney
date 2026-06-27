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
  async sendDirectMessage(recipientId: string, content: string = "", mediaFile?: File, conversationId?: string) {
    if (mediaFile) {
      const formData = new FormData();
      formData.append("recipientId", recipientId);
      formData.append("content", content);
      formData.append("file", mediaFile);
      if (conversationId) formData.append("conversationId", conversationId);

      const res = await api.post("/message/direct", formData);
      return res.data.message;
    }

    const res = await api.post('/message/direct', {
      recipientId,content,conversationId
    })
    return res.data.message
  },
  async sendGroupMessage(conversationId?: string, content: string = "", mediaFile?: File) {
    if (mediaFile) {
      const formData = new FormData();
      if (conversationId) formData.append("conversationId", conversationId);
      formData.append("content", content);
      formData.append("file", mediaFile);

      const res = await api.post("/message/group", formData);
      return res.data.message;
    }

    const res = await api.post("/message/group", {
       
      conversationId,
      content
    });
    return res.data.message;
  },
  async markAsSeen(conversationId: string) {
    const res = await api.patch(`/conversation/${conversationId}/seen`);
    return res.data
  },
  async createConversation(type: 'direct' | 'group', name: string, memberIds: string[]) {
    const res = await api.post('/conversation', { type, name, memberIds })
    return res.data.conversation
  
  },
  async renameGroup(conversationId: string, name: string) {
    const res = await api.patch(`/conversation/${conversationId}/group/name`, {
      name,
    });
    return res.data.conversation;
  },
  async addGroupMembers(conversationId: string, memberIds: string[]) {
    const res = await api.post(`/conversation/${conversationId}/group/members`, {
      memberIds,
    });
    return res.data.conversation;
  },
  async removeGroupMember(conversationId: string, memberId: string) {
    const res = await api.delete(
      `/conversation/${conversationId}/group/members/${memberId}`,
    );
    return res.data.conversation;
  },
  async transferGroupOwner(conversationId: string, newOwnerId: string) {
    const res = await api.patch(`/conversation/${conversationId}/group/owner`, {
      newOwnerId,
    });
    return res.data.conversation;
  },
  async leaveGroup(conversationId: string, newOwnerId?: string) {
    const res = await api.post(`/conversation/${conversationId}/group/leave`, {
      newOwnerId,
    });
    return res.data;
  },
  async toggleMessageReaction(messageId: string, emoji: string) {
    const res = await api.patch(`/message/${messageId}/reactions`, { emoji });
    return res.data;
  },
  async revokeMessage(messageId: string) {
    const res = await api.patch(`/message/${messageId}/revoke`);
    return res.data;
  }
};
