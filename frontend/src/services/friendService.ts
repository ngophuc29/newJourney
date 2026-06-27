import api from "@/lib/axios";

export const friendService = {
  async searchByUsername(username: string) {
    const res = await api.get(
      `/friend/search?username=${encodeURIComponent(username)}`,
    );
    return res.data.user;
  },
  async sendFriendRequest(to: string, message?: string) {
    const res = await api.post("/friend/requests", { to, message });
    return res.data;
  },
  async getAllFriendRequests() {
    const res = await api.get("/friend/requests");
    const { sent, received } = res.data;
    return { sent, received };
  },
  async acceptRequest(requestId: String) {
    try {
      const res = await api.post(`/friend/requests/${requestId}/accept`);
      return res.data;
    } catch (error) {
      console.log("Loi khi gui accept request");
      throw error;
    }
  },
  async declineRequest(requestId: String) {
    try {
        const res = await api.post(`/friend/requests/${requestId}/decline`);
        return res.data;
    } catch (error) {
      console.log("Loi khi gui decline request");
      throw error;
    }
  },
  async getFriendList() {
    const res = await api.get('/friend/friends')
    return res.data.friends
  },
  async removeFriend(friendId: string) {
    const res = await api.delete(`/friend/friends/${friendId}`);
    return res.data.message;
  },
  async getSuggestedFriends() {
    const res = await api.get("/friend/suggestions");
    return res.data.users;
  }
};

