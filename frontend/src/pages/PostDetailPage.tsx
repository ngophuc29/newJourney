import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import PostCard from "@/components/social/PostCard";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/common/SEO";

interface PostType {
    _id: string;
    userId: {
        _id: string;
        username: string;
        displayName: string;
        avatarURL?: string;
    };
    content?: string;
    media: { url: string; type: "image" | "video"; publicId?: string }[];
    likes: string[];
    commentsCount: number;
    createdAt: string;
}

export default function PostDetailPage() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const token = useAuthStore.getState().accessToken;
    const baseUrl = import.meta.env.VITE_API_URL;

    const [post, setPost] = useState<PostType | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPost = async (showSpinner = true) => {
        if (showSpinner) setLoading(true);
        try {
            const res = await fetch(`${baseUrl}/posts/${postId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPost(data);
            } else {
                if (showSpinner) setPost(null);
            }
        } catch (error) {
            console.error("Error fetching post detail:", error);
            if (showSpinner) setPost(null);
        } finally {
            if (showSpinner) setLoading(false);
        }
    };

    useEffect(() => {
        if (postId) {
            fetchPost(true);
        }
    }, [postId]);

    useEffect(() => {
        const handleRefresh = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.postId === postId) {
                fetchPost(false); // Silent refresh without showing the loading spinner
            }
        };

        window.addEventListener("refresh-post", handleRefresh);
        return () => {
            window.removeEventListener("refresh-post", handleRefresh);
        };
    }, [postId]);

    if (loading) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center gap-3 bg-background">
                <Loader2 className="size-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Đang tải chi tiết bài viết...</span>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center gap-2 bg-background p-4 text-center">
                <h2 className="text-xl font-bold">Bài viết không tồn tại</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                    Có thể bài viết này đã bị xóa bởi người đăng hoặc liên kết đã bị lỗi.
                </p>
                <Button className="mt-2 rounded-xl" onClick={() => navigate("/")}>
                    Quay lại Trang chủ
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full overflow-y-auto beautiful-scrollbar bg-background flex flex-col items-center py-8 px-4">
            <SEO 
                title={`Bài viết của ${post.userId.displayName}`} 
                description={post.content || `Xem chi tiết bài đăng của ${post.userId.displayName} trên NewJourney.`} 
                image={post.media?.[0]?.url || post.userId.avatarURL || "/logo.png"} 
                type="article"
            />
            <div className="w-full max-w-[600px] flex flex-col items-start gap-4">
                {/* Back Button */}
                <Button 
                    variant="ghost" 
                    onClick={() => navigate(-1)} 
                    className="text-sm text-muted-foreground hover:text-foreground pl-0"
                >
                    ← Quay lại
                </Button>

                {/* The Post Card */}
                <PostCard 
                    post={post} 
                    onDelete={() => navigate("/")}
                />
            </div>
        </div>
    );
}
