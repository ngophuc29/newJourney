import { create } from "zustand";
import api from "@/lib/axios";
import { useAuthStore } from "./useAuthStore";

export interface StoryItem {
  _id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  viewers: string[];
  createdAt: string;
}

export interface UserStories {
  user: {
    _id: string;
    displayName: string;
    avatarURL?: string | null;
    username: string;
  };
  stories: StoryItem[];
}

interface StoryState {
  stories: UserStories[];
  loading: boolean;
  activeUserIndex: number | null; // For viewing
  activeStoryIndex: number; // Current story index being viewed
  viewerOpen: boolean;
  fetchStories: () => Promise<void>;
  uploadStory: (file: File) => Promise<void>;
  viewStory: (storyId: string) => Promise<void>;
  setViewerState: (open: boolean, userIndex: number | null) => void;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  stories: [],
  loading: false,
  activeUserIndex: null,
  activeStoryIndex: 0,
  viewerOpen: false,

  fetchStories: async () => {
    try {
      set({ loading: true });
      const res = await api.get("/stories");
      set({ stories: res.data.stories, loading: false });
    } catch (error) {
      console.error("Lỗi khi lấy stories:", error);
      set({ loading: false });
    }
  },

  uploadStory: async (file: File) => {
    try {
      set({ loading: true });
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/stories", formData);
      const newStory = res.data.story;

      // Cập nhật state local
      set((state) => {
        const currentUserId = newStory.userId._id || newStory.userId;
        const existingUserStoriesIndex = state.stories.findIndex(
          (us) => us.user._id === currentUserId
        );

        const updatedStories = [...state.stories];

        if (existingUserStoriesIndex > -1) {
          updatedStories[existingUserStoriesIndex] = {
            ...updatedStories[existingUserStoriesIndex],
            stories: [newStory, ...updatedStories[existingUserStoriesIndex].stories],
          };
        } else {
          // Lấy thông tin user từ story được populate
          updatedStories.unshift({
            user: newStory.userId,
            stories: [newStory],
          });
        }

        return { stories: updatedStories, loading: false };
      });
    } catch (error) {
      console.error("Lỗi khi đăng story:", error);
      set({ loading: false });
      throw error;
    }
  },

  viewStory: async (storyId: string) => {
    try {
      await api.patch(`/stories/${storyId}/view`);
      // Cập nhật viewers ở local state
      set((state) => {
        const currentUserId = useAuthStore.getState().user?._id;
        if (!currentUserId) return state;

        const updatedStories = state.stories.map((us) => ({
          ...us,
          stories: us.stories.map((story) => {
            if (story._id === storyId && !story.viewers.includes(currentUserId)) {
              return { ...story, viewers: [...story.viewers, currentUserId] };
            }
            return story;
          }),
        }));

        return { stories: updatedStories };
      });
    } catch (error) {
      console.error("Lỗi khi xem story:", error);
    }
  },

  setViewerState: (open: boolean, userIndex: number | null) => {
    set({ viewerOpen: open, activeUserIndex: userIndex, activeStoryIndex: 0 });
  },
}));
