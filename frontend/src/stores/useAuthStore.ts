import { create } from "zustand";
import { toast } from "sonner";
import type { User } from "@/types/User";
import type { AuthState } from "@/types/store";
import { authService } from "@/services/authService";
import { persist } from "zustand/middleware";
import { useChatStore } from "./useChatStore";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,
      setAccessToken: (accessToken) => {
        set({ accessToken });
      },
      clearState: () => {
        set({ accessToken: null, user: null, loading: false });
        useChatStore.getState().reset();
        localStorage.clear();
        sessionStorage.clear()
      },
      signUp: async (username, password, email, firstName, lastName) => {
        try {
          set({ loading: true });
          // goi api
          await authService.signUp(
            username,
            password,
            email,
            firstName,
            lastName,
          );
          toast.success(
            "Dang ky thanh cong ! Ban se chuyen sang trang dang nhap",
          );
        } catch (error) {
          console.log(error);
          toast.error("dky k thanh cong");
        } finally {
          set({ loading: false });
        }
      },
      signIn: async (username, password) => {
        try {

          get().clearState()
          set({ loading: true });
          // localStorage.clear();
          // useChatStore.getState().reset();
          // goi api
          const res = await authService.signIn(username, password);
          // backend returns `accessToken` (lowercase)
          const accessToken = res?.accessToken ?? null;
          // set({ accessToken });
          get().setAccessToken(accessToken);

          await get().fetchMe();

          useChatStore.getState().fetchConversation()
          console.log("useAuthStore: set accessToken", accessToken);
          toast.success("Dang nhap thanh cong ! Ban se chuyen sang trang chat");
        } catch (error) {
          console.log(error);
          toast.error("dnhap k thanh cong");
        } finally {
          set({ loading: false });
        }
      },

      signOut: async () => {
        try {
          get().clearState();
          await authService.signOut();
          toast.success("Dang xuat thanh cong !");
        } catch (error) {
          console.log(error);
          toast.error("Loi xay ra khi logout hay thu lai");
        }
      },

      fetchMe: async () => {
        try {
          set({ loading: true });
          const user = await authService.fetchMe();
          set({ user });
        } catch (error) {
          console.log(error);
          set({ user: null, accessToken: null });
          toast.error("Loi xay ra khi lay du lieu nguoi dung");
        } finally {
          set({ loading: false });
        }
      },
      refreshToken: async () => {
        try {
          set({ loading: true });

          const { user, fetchMe, setAccessToken } = get();
          const accessToken = await authService.refreshToken();
          // set({ accessToken });
          setAccessToken(accessToken);

          if (!user) {
            await fetchMe();
          }
        } catch (error) {
          console.log(error);
          toast.error("Phien dang nhap da het han ,vui long dang nhap lai");

          get().clearState();
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
      // partialize la chỉ định lưu user thay vì theme k có partialize
      // nó lưu hết luôn
    },
  ),
);
