import React, { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useStoryStore } from "@/stores/useStoryStore";
import { useAuthStore } from "@/stores/useAuthStore";
import UserAvatar from "../chat/UserAvatar";
import { cn } from "@/lib/utils";

const STORY_DURATION = 5000; // 5s

const StoryViewer = () => {
  const { user } = useAuthStore();
  const { stories, activeUserIndex, viewerOpen, setViewerState, viewStory } = useStoryStore();

  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lấy dữ liệu hiện tại
  const currentUserStories = activeUserIndex !== null ? stories[activeUserIndex] : null;
  const activeStory = currentUserStories ? currentUserStories.stories[activeStoryIndex] : null;

  useEffect(() => {
    if (viewerOpen && activeStory) {
      // Mark as seen
      viewStory(activeStory._id);
      
      // Start progress timer
      setProgress(0);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

      const intervalSteps = 50; // Update every 50ms
      const stepValue = (intervalSteps / STORY_DURATION) * 100;

      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNext();
            return 100;
          }
          return prev + stepValue;
        });
      }, intervalSteps);
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [viewerOpen, activeUserIndex, activeStoryIndex]);

  const handleClose = () => {
    setViewerState(false, null);
    setActiveStoryIndex(0);
    setProgress(0);
  };

  const handleNext = () => {
    if (!currentUserStories) return;

    if (activeStoryIndex < currentUserStories.stories.length - 1) {
      // Go to next story of same user
      setActiveStoryIndex((prev) => prev + 1);
    } else {
      // Go to next user
      if (activeUserIndex !== null && activeUserIndex < stories.length - 1) {
        useStoryStore.setState({ activeUserIndex: activeUserIndex + 1 });
        setActiveStoryIndex(0);
      } else {
        // End of all stories
        handleClose();
      }
    }
  };

  const handlePrev = () => {
    if (!currentUserStories) return;

    if (activeStoryIndex > 0) {
      // Go to previous story of same user
      setActiveStoryIndex((prev) => prev - 1);
    } else {
      // Go to previous user
      if (activeUserIndex !== null && activeUserIndex > 0) {
        useStoryStore.setState({ activeUserIndex: activeUserIndex - 1 });
        // Set to the last story of the previous user
        const prevUserStories = stories[activeUserIndex - 1];
        setActiveStoryIndex(prevUserStories.stories.length - 1);
      } else {
        // Start of first story, reset progress
        setProgress(0);
      }
    }
  };

  if (!viewerOpen || !currentUserStories || !activeStory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 animate-in fade-in duration-200">
      {/* Container chính */}
      <div className="relative w-full max-w-[420px] h-full md:h-[80vh] md:rounded-2xl overflow-hidden flex flex-col justify-between bg-zinc-900 shadow-2xl">
        
        {/* Lớp phủ click trái/phải để chuyển story */}
        <div className="absolute inset-x-0 top-20 bottom-16 flex z-10">
          <div className="w-1/3 h-full cursor-w-resize" onClick={handlePrev} />
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full cursor-e-resize" onClick={handleNext} />
        </div>

        {/* Thanh tiến trình Progress Bars ở trên cùng */}
        <div className="absolute top-3 inset-x-4 flex gap-1 z-20">
          {currentUserStories.stories.map((story, idx) => (
            <div key={story._id} className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden">
              <div
                style={{
                  width:
                    idx < activeStoryIndex
                      ? "100%"
                      : idx === activeStoryIndex
                      ? `${progress}%`
                      : "0%",
                }}
                className="h-full bg-white rounded-full transition-all duration-75"
              />
            </div>
          ))}
        </div>

        {/* Header thông tin User */}
        <div className="absolute top-6 inset-x-4 flex items-center justify-between z-20 text-white">
          <div className="flex items-center gap-2">
            <UserAvatar
              type="chat"
              name={currentUserStories.user.displayName}
              avatarURL={currentUserStories.user.avatarURL ?? undefined}
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{currentUserStories.user.displayName}</span>
              <span className="text-[10px] opacity-75">
                {new Date(activeStory.createdAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content hiển thị Media */}
        <div className="flex-1 w-full h-full flex items-center justify-center bg-black">
          {activeStory.mediaType === "video" ? (
            <video
              src={activeStory.mediaUrl}
              autoPlay
              playsInline
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <img
              src={activeStory.mediaUrl}
              alt="Story content"
              className="max-h-full max-w-full object-contain"
            />
          )}
        </div>

        {/* Footer hiển thị số người xem (chỉ hiển thị nếu là story của chính mình) */}
        {user && currentUserStories.user._id === user._id && (
          <div className="absolute bottom-4 inset-x-4 flex justify-center z-20">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/10">
              <Eye className="size-3.5" />
              <span>{activeStory.viewers.length} người xem</span>
            </div>
          </div>
        )}

        {/* Nút điều hướng Desktop trái/phải */}
        <div className="hidden md:block">
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-[-60px] top-1/2 -translate-y-1/2 bg-white/10 text-white p-2.5 rounded-full hover:bg-white/20 transition-all border border-white/10"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-[-60px] top-1/2 -translate-y-1/2 bg-white/10 text-white p-2.5 rounded-full hover:bg-white/20 transition-all border border-white/10"
          >
            <ChevronRight className="size-6" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default StoryViewer;
