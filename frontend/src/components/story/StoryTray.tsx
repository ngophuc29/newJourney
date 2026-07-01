import React, { useEffect, useRef } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useStoryStore } from "@/stores/useStoryStore";
import { useAuthStore } from "@/stores/useAuthStore";
import UserAvatar from "../chat/UserAvatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StoryTrayProps {
  variant?: "feed" | "sidebar";
  className?: string;
}

const StoryTray = ({ variant = "sidebar", className }: StoryTrayProps) => {
  const { user } = useAuthStore();
  const { stories, loading, fetchStories, uploadStory, setViewerState } = useStoryStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Chỉ hỗ trợ đăng ảnh hoặc video lên Story");
      return;
    }

    try {
      await uploadStory(file);
      toast.success("Đăng Story thành công!");
      fetchStories(); // Reload stories
    } catch (err) {
      toast.error("Đăng Story thất bại");
    }
  };

  if (!user) return null;

  // Tìm story của chính mình
  const myStories = stories.find((us) => us.user._id === user._id);
  const otherStories = stories.filter((us) => us.user._id !== user._id);

  // Kiểm tra xem nhóm stories của một user đã được đọc hết chưa
  const hasUnreadStories = (userStories: typeof stories[0]) => {
    return userStories.stories.some((s) => !s.viewers.includes(user._id));
  };


  return (
    <div
      className={cn(
        "flex items-center gap-4 overflow-x-auto no-scrollbar bg-background",
        variant === "feed"
          ? "h-[118px] px-4 py-4 rounded-2xl border border-border/40 shadow-sm"
          : "h-[110px] px-4 py-12 border-b border-border/50",
        className
      )}
    >
      {/* Nút đăng story của bản thân */}
      <div className="flex flex-col items-center shrink-0 gap-1 cursor-pointer group">
        <div className="relative">
          <div 
            onClick={() => {
              if (myStories && myStories.stories.length > 0) {
                const index = stories.findIndex((us) => us.user._id === user._id);
                setViewerState(true, index);
              } else {
                fileInputRef.current?.click();
              }
            }}
            className={cn(
              "size-14 rounded-full p-[2px] transition-transform group-hover:scale-105",
              myStories && myStories.stories.length > 0
                ? "bg-gradient-to-tr from-yellow-500 to-purple-600" // Luôn giữ viền màu cho bản thân khi có story
                : "border-2 border-dashed border-muted-foreground/30" // Viền nét đứt khi chưa đăng gì
            )}
          >
            <div className="size-full rounded-full bg-background p-[2px] relative">
              <UserAvatar
                type="chat"
                name={user.displayName}
                avatarURL={user.avatarURL ?? undefined}
                className="!size-full"
              />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                  <Loader2 className="size-4 animate-spin text-white" />
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 border-2 border-background hover:bg-primary-hover shadow-md transition-all group-hover:scale-110"
          >
            <Plus className="size-3" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <span className="text-[11px] font-medium text-muted-foreground max-w-[64px] truncate">
          Tin của bạn
        </span>
      </div>

      {/* Loading indicator */}
      {loading && stories.length === 0 && (
        <div className="flex items-center justify-center py-2 h-14 w-14">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      )}

      {/* Danh sách story của bạn bè */}
      {otherStories.map((us) => {
        const index = stories.findIndex((item) => item.user._id === us.user._id);
        const unread = hasUnreadStories(us);

        return (
          <div
            key={us.user._id}
            onClick={() => setViewerState(true, index)}
            className="flex flex-col items-center shrink-0 gap-1 cursor-pointer group"
          >
            <div
              className={cn(
                "size-14 rounded-full p-[2px] transition-transform group-hover:scale-105",
                unread
                  ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
                  : "bg-muted-foreground/30" // Hiện viền xám nhạt nhẹ nhàng khi đã xem xong tin của người khác
              )}
            >
              <div className="size-full rounded-full bg-background p-[2px]">
                <UserAvatar
                  type="chat"
                  name={us.user.displayName}
                  avatarURL={us.user.avatarURL ?? undefined}
                  className="!size-full"
                />
              </div>
            </div>
            <span className="text-[11px] font-medium text-foreground max-w-[64px] truncate">
              {us.user.displayName}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default StoryTray;
