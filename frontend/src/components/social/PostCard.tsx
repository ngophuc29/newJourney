import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "../ui/dropdown-menu";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

interface MediaItem {
    url: string;
    type: "image" | "video";
    publicId?: string;
}

interface PostUser {
    _id: string;
    username: string;
    displayName: string;
    avatarURL?: string;
}

interface CommentUser {
    _id: string;
    username: string;
    displayName: string;
    avatarURL?: string;
}

interface CommentType {
    _id: string;
    postId: string;
    userId: CommentUser;
    content: string;
    parentId: string | null;
    createdAt: string;
    replies?: CommentType[];
}

interface PostCardProps {
    post: {
        _id: string;
        userId: PostUser;
        content?: string;
        media: MediaItem[];
        likes: string[];
        commentsCount: number;
        createdAt: string;
    };
    onDelete?: (postId: string) => void;
}

// Simple time formatter helper
const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Vừa xong";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    
    return date.toLocaleDateString("vi-VN", { day: "numeric", month: "long" });
};

export default function PostCard({ post, onDelete }: PostCardProps) {
    const { user } = useAuthStore();
    const token = useAuthStore.getState().accessToken;
    const baseUrl = import.meta.env.VITE_API_URL;

    const [isLiked, setIsLiked] = useState(post.likes.includes(user?._id || ""));
    const [likesCount, setLikesCount] = useState(post.likes.length);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<CommentType[]>([]);
    const [newComment, setNewComment] = useState("");
    const [replyToId, setReplyToId] = useState<string | null>(null);
    const [replyToUser, setReplyToUser] = useState<string | null>(null);
    
    // Media Carousel State
    const [currentMediaIdx, setCurrentMediaIdx] = useState(0);

    const handleLike = async () => {
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            const res = await fetch(`${baseUrl}/posts/${post._id}/like`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            if (!res.ok) {
                // Revert state on failure
                setIsLiked(isLiked);
                setLikesCount(likesCount);
            }
        } catch (error) {
            setIsLiked(isLiked);
            setLikesCount(likesCount);
            console.error(error);
        }
    };

    const fetchComments = async () => {
        try {
            const res = await fetch(`${baseUrl}/posts/${post._id}/comments`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    useEffect(() => {
        if (showComments) {
            fetchComments();
        }
    }, [showComments]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await fetch(`${baseUrl}/posts/${post._id}/comments`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    content: newComment,
                    parentId: replyToId
                })
            });

            if (res.ok) {
                setNewComment("");
                setReplyToId(null);
                setReplyToUser(null);
                fetchComments();
                toast.success("Đã gửi bình luận");
            }
        } catch (error) {
            console.error("Error adding comment:", error);
            toast.error("Không thể gửi bình luận");
        }
    };

    const handleDeletePost = async () => {
        if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;
        try {
            const res = await fetch(`${baseUrl}/posts/${post._id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Đã xóa bài viết");
                if (onDelete) onDelete(post._id);
            }
        } catch (error) {
            console.error("Error deleting post:", error);
            toast.error("Không thể xóa bài viết");
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
        toast.success("Đã sao chép liên kết bài viết!");
    };

    return (
        <article className="w-full max-w-[600px] bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <Link to={`/profile/${post.userId.username}`}>
                        <Avatar className="size-10 border border-border/30 hover:opacity-90 transition-opacity">
                            <AvatarImage src={post.userId.avatarURL} alt={post.userId.displayName} />
                            <AvatarFallback>{post.userId.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="flex flex-col">
                        <Link to={`/profile/${post.userId.username}`} className="font-semibold text-sm hover:underline">
                            {post.userId.displayName}
                        </Link>
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(post.createdAt)}</span>
                    </div>
                </div>

                {/* More Options / Delete */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-full hover:bg-accent/50 text-muted-foreground transition-colors">
                            <MoreHorizontal className="size-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border border-border/40 text-foreground">
                        {user?._id === post.userId._id ? (
                            <DropdownMenuItem onClick={handleDeletePost} className="text-red-500 hover:bg-red-500/10 cursor-pointer">
                                Xóa bài viết
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                                Sao chép liên kết
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Content Text */}
            {post.content && (
                <div className="px-4 pb-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {post.content}
                </div>
            )}

            {/* Media Carousel */}
            {post.media.length > 0 && (
                <div className="relative w-full aspect-square bg-black flex items-center justify-center overflow-hidden">
                    {/* Media render */}
                    {post.media[currentMediaIdx].type === "video" ? (
                        <video 
                            src={post.media[currentMediaIdx].url} 
                            controls 
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <img 
                            src={post.media[currentMediaIdx].url} 
                            alt={`Post media ${currentMediaIdx}`} 
                            className="w-full h-full object-cover"
                        />
                    )}

                    {/* Carousel Navigation */}
                    {post.media.length > 1 && (
                        <>
                            <button 
                                onClick={() => setCurrentMediaIdx(prev => Math.max(0, prev - 1))}
                                disabled={currentMediaIdx === 0}
                                className={`absolute left-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-opacity ${currentMediaIdx === 0 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                            >
                                <ChevronLeft className="size-5" />
                            </button>
                            <button 
                                onClick={() => setCurrentMediaIdx(prev => Math.min(post.media.length - 1, prev + 1))}
                                disabled={currentMediaIdx === post.media.length - 1}
                                className={`absolute right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-opacity ${currentMediaIdx === post.media.length - 1 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                            >
                                <ChevronRight className="size-5" />
                            </button>

                            {/* Dot Indicators */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                                {post.media.map((_, idx) => (
                                    <span 
                                        key={idx} 
                                        className={`size-1.5 rounded-full transition-all duration-250 ${idx === currentMediaIdx ? "bg-white w-3" : "bg-white/50"}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Action Bar */}
            <div className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleLike} 
                            className={`flex items-center gap-1.5 group transition-colors ${isLiked ? "text-rose-500" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Heart className={`size-6 transition-transform duration-200 group-active:scale-125 ${isLiked ? "fill-rose-500" : ""}`} />
                            <span className="text-sm font-semibold">{likesCount}</span>
                        </button>

                        <button 
                            onClick={() => setShowComments(!showComments)} 
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <MessageCircle className="size-6" />
                            <span className="text-sm font-semibold">{post.commentsCount}</span>
                        </button>
                    </div>

                    <button 
                        onClick={handleShare}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Share2 className="size-5" />
                    </button>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="border-t border-border/40 bg-accent/5 p-4 flex flex-col gap-4">
                    {/* Add Comment Input */}
                    <form onSubmit={handleAddComment} className="flex gap-3 items-center">
                        <Avatar className="size-8">
                            <AvatarImage src={user?.avatarURL} alt={user?.displayName} />
                            <AvatarFallback>{user?.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex items-center bg-card border border-border/40 rounded-full px-4 py-1.5">
                            <input 
                                type="text" 
                                placeholder={replyToUser ? `Phản hồi @${replyToUser}...` : "Viết bình luận..."}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="flex-1 bg-transparent text-sm border-none focus:outline-none placeholder:text-muted-foreground"
                            />
                            {replyToId && (
                                <button 
                                    type="button" 
                                    onClick={() => { setReplyToId(null); setReplyToUser(null); }}
                                    className="text-xs text-muted-foreground mr-2 hover:underline"
                                >
                                    Hủy
                                </button>
                            )}
                            <button type="submit" disabled={!newComment.trim()} className="text-primary hover:opacity-80 disabled:opacity-40 transition-opacity">
                                <Send className="size-4" />
                            </button>
                        </div>
                    </form>

                    {/* Comments List */}
                    <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto beautiful-scrollbar">
                        {comments.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-2">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment._id} className="flex flex-col gap-2">
                                    {/* Main Comment */}
                                    <div className="flex gap-3 items-start group">
                                        <Link to={`/profile/${comment.userId.username}`}>
                                            <Avatar className="size-8">
                                                <AvatarImage src={comment.userId.avatarURL} alt={comment.userId.displayName} />
                                                <AvatarFallback>{comment.userId.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </Link>
                                        <div className="flex-1 flex flex-col bg-card border border-border/30 rounded-2xl px-3 py-2">
                                            <div className="flex items-center justify-between">
                                                <Link to={`/profile/${comment.userId.username}`} className="font-semibold text-xs hover:underline">
                                                    {comment.userId.displayName}
                                                </Link>
                                                <span className="text-[10px] text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
                                            </div>
                                            <p className="text-sm mt-1">{comment.content}</p>
                                        </div>
                                        <button 
                                            onClick={() => { setReplyToId(comment._id); setReplyToUser(comment.userId.username); }}
                                            className="text-xs text-primary font-medium self-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:underline"
                                        >
                                            Phản hồi
                                        </button>
                                    </div>

                                    {/* Replies (Nested Comments) */}
                                    {comment.replies && comment.replies.map((reply) => (
                                        <div key={reply._id} className="flex gap-3 items-start pl-10">
                                            <Link to={`/profile/${reply.userId.username}`}>
                                                <Avatar className="size-6">
                                                    <AvatarImage src={reply.userId.avatarURL} alt={reply.userId.displayName} />
                                                    <AvatarFallback>{reply.userId.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </Link>
                                            <div className="flex-1 flex flex-col bg-card border border-border/30 rounded-2xl px-3 py-2">
                                                <div className="flex items-center justify-between">
                                                    <Link to={`/profile/${reply.userId.username}`} className="font-semibold text-xs hover:underline">
                                                        {reply.userId.displayName}
                                                    </Link>
                                                    <span className="text-[10px] text-muted-foreground">{formatTimeAgo(reply.createdAt)}</span>
                                                </div>
                                                <p className="text-sm mt-1">{reply.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </article>
    );
}
