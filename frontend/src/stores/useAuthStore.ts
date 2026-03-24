import { create } from "zustand";
import { toast } from "sonner";
import type { User } from "@/types/User";
import type { AuthState } from "@/types/store";
import { authService } from "@/services/authService";

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  loading: false,
  clearState: () => {
    set({ accessToken: null, user: null, loading: false });
  },
  signUp: async (username, password, email, firstName, lastName) => {
    try {
      set({ loading: true });
      // goi api
      await authService.signUp(username, password, email, firstName, lastName);
      toast.success("Dang ky thanh cong ! Ban se chuyen sang trang dang nhap");
    } catch (error) {
      console.log(error);
      toast.error("dky k thanh cong");
    } finally {
      set({ loading: false });
    }
  },
  signIn: async (username, password) => {
    try {
      set({ loading: true });
      // goi api
      const { accessToken } = await authService.signIn(username, password);
      set({ accessToken: accessToken });
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
          await authService.signOut()
      toast.success("Dang xuat thanh cong !");
          
      } catch (error) {
          console.log(error);
          toast.error("Loi xay ra khi logout hay thu lai");
    }
  },
}));
