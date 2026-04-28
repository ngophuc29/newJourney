import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
    connectSocket: () => {
      
        const accessToken = useAuthStore.getState().accessToken
        const existingSocket = get().socket


        if (existingSocket) return  // return som de tranh tao nhieu socket trung nhau
        
        const socket: Socket =io(baseURL, {
            auth: { token: accessToken },
            transports :["websocket"]
        })

        set({ socket })
        
        socket.on("connect", () => {
            console.log("Da ket noi voi socket");
            
        })
  },
    disconnectSocket: () => {
        const socket = get().socket
        if (socket) {
            socket.disconnect()
            set({socket:null})
        }
  },
}));
