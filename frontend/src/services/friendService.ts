import api from "@/lib/axios";

export const friendService = {
  async searchByUsername(username: string) {
    const res = await api.get(`/friend/search?username=${username}`);
    return res.data.user;
  },
  async sendFriendRequest(to: string, message?: string) {
    const res = await api.post("/friend/requests", { to, message });
    return res.data.message;
  },
  async getAllFriendRequests() {
    const res = await api.get("/friend/requests");
    const { sent, received } = res.data;
    return { sent, received };
  },
  async acceptRequest(requestId: String) {
    try {
      const res = await api.post(`/friend/requests/${requestId}/accept`);
      return res.data.requestAcceptedBy;
    } catch (error) {
      console.log("Loi khi gui accept request");
    }
  },
  async declineRequest(requestId: String) {
    try {
        await api.post(`/friend/requests/${requestId}/decline`);
    } catch (error) {
      console.log("Loi khi gui decline request");
    }
  },
  async getFriendList() {
    const res = await api.get('/friend/friends')
    return res.data.friends
  }
};

