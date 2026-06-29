import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Eye, Send } from "lucide-react";
import { useStoryStore } from "@/stores/useStoryStore";
import { useAuthStore } from "@/stores/useAuthStore";
import UserAvatar from "../chat/UserAvatar";
import { toast } from "sonner";

const STORY_DURATION = 5000; // 5s

const StoryViewer = () => {
  const { user } = useAuthStore();
  const token = useAuthStore.getState().accessToken;
  const baseUrl = import.meta.env.VITE_API_URL;
  const { stories, activeUserIndex, activeStoryIndex, viewerOpen, setViewerState, viewStory } = useStoryStore();

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Lấy dữ liệu hiện tại
  const currentUserStories = activeUserIndex !== null ? stories[activeUserIndex] : null;
  const activeStory = currentUserStories ? currentUserStories.stories[activeStoryIndex] : null;

  useEffect(() => {
    if (viewerOpen && activeStory) {
      // Mark as seen
      viewStory(activeStory._id);
      
      // Reset progress UI
      setProgress(0);

      const intervalSteps = 50; // Update every 50ms
      const stepValue = (intervalSteps / STORY_DURATION) * 100;

      const progressInterval = setInterval(() => {
        if (!isPaused) {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              handleNext();
              return 100;
            }
            return prev + stepValue;
          });
        }
      }, intervalSteps);

      return () => {
        clearInterval(progressInterval);
      };
    }
  }, [viewerOpen, activeUserIndex, activeStoryIndex, isPaused]);

  const handleClose = () => {
    setViewerState(false, null);
    setProgress(0);
    setIsPaused(false);
    setReplyText("");
  };

  const handleNext = () => {
    if (!currentUserStories) return;

    if (activeStoryIndex < currentUserStories.stories.length - 1) {
      // Go to next story of same user
      useStoryStore.setState({ activeStoryIndex: activeStoryIndex + 1 });
    } else {
      // Go to next user
      if (activeUserIndex !== null && activeUserIndex < stories.length - 1) {
        useStoryStore.setState({ activeUserIndex: activeUserIndex + 1, activeStoryIndex: 0 });
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
      useStoryStore.setState({ activeStoryIndex: activeStoryIndex - 1 });
    } else {
      // Go to previous user
      if (activeUserIndex !== null && activeUserIndex > 0) {
        const prevUserStories = stories[activeUserIndex - 1];
        useStoryStore.setState({ 
          activeUserIndex: activeUserIndex - 1, 
          activeStoryIndex: prevUserStories.stories.length - 1 
        });
      } else {
        // Start of first story, reset progress
        setProgress(0);
      }
    }
  };

  const handleSendReply = async (textToSend: string) => {
    if (!currentUserStories || !activeStory || !textToSend.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`${baseUrl}/message/direct`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recipientId: currentUserStories.user._id,
          content: `💬 Đã phản hồi tin của bạn: "${textToSend}"`
        })
      });

      if (res.ok) {
        toast.success("Đã gửi phản hồi vào tin nhắn");
        setReplyText("");
        setIsPaused(false);
      } else {
        toast.error("Không thể gửi phản hồi");
      }
    } catch (error) {
      console.error("Error replying to story:", error);
      toast.error("Đã xảy ra lỗi");
    } finally {
      setSendingReply(false);
    }
  };

  if (!viewerOpen || !currentUserStories || !activeStory) return null;

  const isOwnStory = user && currentUserStories.user._id === user._id;
  const quickReactions = ["❤️", "🙌", "🔥", "👏", "😂", "😢"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 animate-in fade-in duration-200">
      {/* Wrapper chính để định vị các nút điều hướng bên ngoài */}
      <div className="relative w-full max-w-[420px] h-full md:h-[85vh] flex items-center justify-center">
        
        {/* Nút chuyển về Story trước (Nằm bên ngoài vùng overflow-hidden) */}
        <button
          type="button"
          onClick={handlePrev}
          className="hidden md:flex absolute left-[-64px] top-1/2 -translate-y-1/2 bg-zinc-800/80 text-white size-11 items-center justify-center rounded-full hover:bg-zinc-700 active:scale-95 transition-all border border-zinc-700 shadow-lg z-30"
          title="Story trước"
        >
          <ChevronLeft className="size-5" />
        </button>

        {/* Nút chuyển sang Story tiếp theo (Nằm bên ngoài vùng overflow-hidden) */}
        <button
          type="button"
          onClick={handleNext}
          className="hidden md:flex absolute right-[-64px] top-1/2 -translate-y-1/2 bg-zinc-800/80 text-white size-11 items-center justify-center rounded-full hover:bg-zinc-700 active:scale-95 transition-all border border-zinc-700 shadow-lg z-30"
          title="Story tiếp theo"
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Container hiển thị nội dung chính (giữ nguyên overflow-hidden) */}
        <div className="relative w-full h-full md:rounded-2xl overflow-hidden flex flex-col justify-between bg-zinc-900 shadow-2xl">
          
          {/* Lớp phủ click trái/phải để chuyển story trên điện thoại */}
          <div className="absolute inset-x-0 top-20 bottom-24 flex z-10">
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
          {isOwnStory ? (
            <div className="absolute bottom-4 inset-x-4 flex justify-center z-20">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/10">
                <Eye className="size-3.5" />
                <span>{activeStory.viewers.length} người xem</span>
              </div>
            </div>
          ) : (
            /* Quick Reply & Reactions (Desktop & Mobile) */
            <div className="absolute bottom-4 inset-x-4 z-20 flex flex-col gap-3">
              {/* Quick Reactions Bar */}
              <div className="flex justify-around items-center bg-black/40 backdrop-blur-md py-1.5 px-2 rounded-full border border-white/10">
                {quickReactions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSendReply(emoji)}
                    className="text-xl hover:scale-125 transition-transform active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Reply Input Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendReply(replyText);
                }}
                className="flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/15"
              >
                <input
                  type="text"
                  placeholder="Gửi tin nhắn..."
                  value={replyText}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => {
                    // Short timeout to allow clicking submit button before resuming
                    setTimeout(() => setIsPaused(false), 200);
                  }}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:outline-none text-white text-sm px-3 placeholder:text-zinc-400"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="size-8 rounded-full bg-white text-black flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
