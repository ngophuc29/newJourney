import { friendService } from "@/services/friendService";
import type { FriendState } from "@/types/store";
import { create } from "zustand";

export const useFriendStore = create<FriendState>((set) => ({
  loading: false,
  friends: [],
  receivedList: [],
  sentList: [],
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

      const resultMessage = await friendService.sendFriendRequest(to, message);
      return resultMessage;
    } catch (error) {
      console.log("Loi xay ra khi add Friend", error);
      return "Loi xay ra khi gui ket ban hay thu lai";
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
      await friendService.acceptRequest(requestId);

      set((state) => ({
        receivedList: state.receivedList.filter((r) => r._id !== requestId),
      }));
    } catch (error) {
      console.log("Loi xay ra khi accept request", error);
    } finally {
      set({ loading: false });
    }
  },
  declineFriendRequest: async (requestId) => {
    try {
      set({ loading: true });
      await friendService.acceptRequest(requestId);

      set((state) => ({
        receivedList: state.receivedList.filter((r) => r._id !== requestId),
      }));
    } catch (error) {
      console.log("Loi xay ra khi decline request", error);
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
}));
