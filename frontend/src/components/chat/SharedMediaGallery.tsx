import { useChatStore } from "@/stores/useChatStore";
import { useEffect, useState } from "react";
import { X, ImageIcon, Film, Play, Loader2, Download } from "lucide-react";
import type { Message } from "@/types/chat";
import { Button } from "../ui/button";

interface SharedMediaGalleryProps {
  convoId: string;
  onClose: () => void;
}

const SharedMediaGallery = ({ convoId, onClose }: SharedMediaGalleryProps) => {
  const { getConversationMedia } = useChatStore();
  const [media, setMedia] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePreview, setActivePreview] = useState<{ url: string; type: "image" | "video" } | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      try {
        const items = await getConversationMedia(convoId);
        setMedia(items);
      } catch (error) {
        console.error("Lỗi khi tải thư viện phương tiện", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [convoId, getConversationMedia]);

  return (
    <div className="w-80 border-l border-border bg-background h-full flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <ImageIcon className="size-4 text-primary" />
          Kho lưu trữ phương tiện
        </h3>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 beautiful-scrollbar">
        {loading ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="ml-2 text-sm">Đang tải tệp...</span>
          </div>
        ) : media.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2 text-center p-4">
            <ImageIcon className="size-8 text-muted-foreground/50" />
            <p className="text-xs">Chưa có hình ảnh hoặc video nào được chia sẻ trong cuộc trò chuyện này</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {media.map((item) => {
              const url = item.mediaUrl || item.imageUrl || item.imgUrl;
              if (!url) return null;

              const isVideo = item.mediaType === "video";

              return (
                <div
                  key={item._id}
                  className="relative aspect-square group cursor-pointer overflow-hidden rounded-md border border-border/30 bg-muted/20 hover:border-primary/50 transition-all duration-200"
                  onClick={() => setActivePreview({ url, type: isVideo ? "video" : "image" })}
                >
                  {isVideo ? (
                    <>
                      <video
                        src={url}
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                        <Play className="size-5 text-white fill-white/80" />
                      </div>
                      <span className="absolute bottom-1 right-1 p-0.5 rounded bg-black/60 text-[8px] text-white font-medium flex items-center gap-0.5">
                        <Film className="size-2" />
                        Video
                      </span>
                    </>
                  ) : (
                    <img
                      src={url}
                      alt="Shared media"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-screen Light-box Preview */}
      {activePreview && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-white text-xs font-medium">
              Xem chi tiết phương tiện
            </span>
            <div className="flex items-center gap-2">
              <a
                href={activePreview.url}
                download
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                title="Tải xuống"
              >
                <Download className="size-5" />
              </a>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                onClick={() => setActivePreview(null)}
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Media Container */}
          <div className="w-full h-full max-w-4xl max-h-[80vh] px-4 flex items-center justify-center">
            {activePreview.type === "video" ? (
              <video
                src={activePreview.url}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <img
                src={activePreview.url}
                alt="Full preview"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedMediaGallery;
