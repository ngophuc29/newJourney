import { friendService } from "@/services/friendService";
import type { FriendState } from "@/types/store";
import { create } from "zustand";

export const useFriendStore = create<FriendState>((set) => ({
  loading: false,
  friends: [],
  receivedList: [],
  sentList: [],
  suggestedUsers: [],
  searchByUsername: async (username) => {
    try {
      set({ loading: true });

      const user = await friendService.searchByUsername(username);
      return user;
    } catch (error) {
      console.log("Loi xay ra khi tim user bang username", error);
    } finally {
      set({ loading: false });
    }
  },
  addFriend: async (to, message) => {
    try {
      set({ loading: true });

      const result = await friendService.sendFriendRequest(to, message);
      if (result?.request) {
        set((state) => {
          const exists = state.sentList.some((r) => r._id === result.request._id);

          return {
            sentList: exists
              ? state.sentList
              : [result.request, ...state.sentList],
            suggestedUsers: state.suggestedUsers.map((user) =>
              user._id === to
                ? { ...user, friendRequestStatus: "sent" as const }
                : user,
            ),
          };
        });
      }
      return result.message;
    } catch (error) {
      console.log("Loi xay ra khi add Friend", error);
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data
          ? String(error.response.data.message)
          : "Loi xay ra khi gui ket ban hay thu lai";
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },

  getAllFriendRequests: async () => {
    try {
      set({ loading: true });

      const result = await friendService.getAllFriendRequests();

      if (!result) return;
      const { received, sent } = result;

      set({ receivedList: received, sentList: sent });
    } catch (error) {
      console.log("Loi xay ra khi get all Friend request", error);
    } finally {
      set({ loading: false });
    }
  },
  acceptFriendRequest: async (requestId) => {
    try {
      set({ loading: true });
      const result = await friendService.acceptRequest(requestId);

      set((state) => ({
        receivedList: state.receivedList.filter((r) => r._id !== requestId),
        friends: result?.newFriend
          ? [result.newFriend, ...state.friends.filter((f) => f._id !== result.newFriend._id)]
          : state.friends,
        suggestedUsers: result?.newFriend
          ? state.suggestedUsers.filter((user) => user._id !== result.newFriend._id)
          : state.suggestedUsers,
      }));
    } catch (error) {
      console.log("Loi xay ra khi accept request", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  declineFriendRequest: async (requestId) => {
    try {
      set({ loading: true });
      await friendService.declineRequest(requestId);

      set((state) => ({
        receivedList: state.receivedList.filter((r) => r._id !== requestId),
      }));
    } catch (error) {
      console.log("Loi xay ra khi decline request", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  getFriends: async () => {
    try {
      set({ loading: true });

      const friends = await friendService.getFriendList();
      set({ friends: friends });
    } catch (error) {
      console.log("Loi xay ra khi lay danh sach ban be", error);
      set({ friends: [] });
    } finally {
      set({
        loading: false,
      });
    }
  },
  removeFriend: async (friendId) => {
    try {
      set({ loading: true });

      const message = await friendService.removeFriend(friendId);
      set((state) => ({
        friends: state.friends.filter((friend) => friend._id !== friendId),
      }));

      return message;
    } catch (error) {
      console.log("Loi xay ra khi xoa ban be", error);
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data
          ? String(error.response.data.message)
          : "Khong xoa duoc ban be luc nay";
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },
  getSuggestedFriends: async () => {
    try {
      set({ loading: true });

      const users = await friendService.getSuggestedFriends();
      set({ suggestedUsers: users });
    } catch (error) {
      console.log("Loi xay ra khi lay danh sach user chua ket ban", error);
      set({ suggestedUsers: [] });
    } finally {
      set({ loading: false });
    }
  },
  addReceivedRequest: (request) => {
    set((state) => {
      const exists = state.receivedList.some((r) => r._id === request._id);
      const fromId = request.from?._id;

      return {
        receivedList: exists
          ? state.receivedList
          : [request, ...state.receivedList],
        suggestedUsers: state.suggestedUsers.map((user) =>
          user._id === fromId
            ? { ...user, friendRequestStatus: "received" as const }
            : user,
        ),
      };
    });
  },
  addSentRequest: (request) => {
    set((state) => {
      const exists = state.sentList.some((r) => r._id === request._id);
      const toId = request.to?._id;

      return {
        sentList: exists ? state.sentList : [request, ...state.sentList],
        suggestedUsers: state.suggestedUsers.map((user) =>
          user._id === toId
            ? { ...user, friendRequestStatus: "sent" as const }
            : user,
        ),
      };
    });
  },
  removeRequest: (requestId) => {
    set((state) => ({
      receivedList: state.receivedList.filter((r) => r._id !== requestId),
      sentList: state.sentList.filter((r) => r._id !== requestId),
    }));
  },
  addFriendToList: (friend) => {
    set((state) => {
      const exists = state.friends.some((f) => f._id === friend._id);

      return {
        friends: exists ? state.friends : [friend, ...state.friends],
        suggestedUsers: state.suggestedUsers.filter(
          (user) => user._id !== friend._id,
        ),
      };
    });
  },
  updateSuggestionStatus: (userId, status) => {
    set((state) => ({
      suggestedUsers: state.suggestedUsers.map((user) =>
        user._id === userId ? { ...user, friendRequestStatus: status } : user,
      ),
    }));
  },
  removeSuggestedUser: (userId) => {
    set((state) => ({
      suggestedUsers: state.suggestedUsers.filter((user) => user._id !== userId),
    }));
  },
  removeFriendFromList: (friendId) => {
    set((state) => ({
      friends: state.friends.filter((friend) => friend._id !== friendId),
    }));
  },
}));
