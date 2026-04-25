import type { ThemeStore } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
// persist này giúp lưu state xuống local storage

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
          isDarK: false,
          toggleTheme: () => {
              const newvalue = !get().isDarK
              
              set({isDarK:newvalue})
              if (newvalue) {
                  document.documentElement.classList.add("dark")
              } else {
                  document.documentElement.classList.remove("dark");
                  
              }
          },
          setTheme : (dark:boolean) =>{
              set({ isDarK: dark });
              if (dark) {
                document.documentElement.classList.add("dark");
              } else {
                document.documentElement.classList.remove("dark");
              }
          }
    }),
    {
      name: "theme-storage",
    },
  ),
);
