import { friendService } from "@/services/friendService";
import type { FriendState } from "@/types/store";
import { create } from "zustand";

export const useFriendStore = create<FriendState>((set, get) => ({
    loading: false,
    searchByUsername: async(username) =>{
        try {
            set({ loading: true })
            
            const user = await friendService.searchByUsername(username)
            return user
        } catch (error) {
            console.log("Loi xay ra khi tim user bang username",error);
            
        }
        finally {
            set({loading :false})
        }
    },
    addFriend:async (to, message) =>{
         try {
           set({ loading: true });

           const resultMessage = await friendService.sendFriendRequest(to,message);
             return resultMessage;
         } catch (error) {
             console.log("Loi xay ra khi add Friend", error);
             return "Loi xay ra khi gui ket ban hay thu lai"

         } finally {
           set({ loading: false });
         }
    },

}))