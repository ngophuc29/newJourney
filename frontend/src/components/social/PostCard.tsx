import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "../ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFriendStore } from "@/stores/useFriendStore";
import MentionDropdown from "../chat/MentionDropdown";
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
    mentions?: CommentUser[];
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
        mentions?: PostUser[];
        reactions?: { userId: string; type: string }[];
    };
    onDelete?: (postId: string) => void;
}

const REACTION_EMOJIS: Record<string, { emoji: string; label: string; color: string }> = {
    like: { emoji: "👍", label: "Thích", color: "text-blue-500 font-semibold" },
    love: { emoji: "❤️", label: "Yêu thích", color: "text-rose-500 font-semibold" },
    haha: { emoji: "😂", label: "Haha", color: "text-amber-500 font-semibold" },
    wow: { emoji: "😮", label: "Wow", color: "text-amber-500 font-semibold" },
    sad: { emoji: "😢", label: "Buồn", color: "text-amber-500 font-semibold" },
    angry: { emoji: "😡", label: "Phẫn nộ", color: "text-orange-600 font-bold" }
};

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

    // Initialize reactions state
    const initialReactions = post.reactions || [];
    const [reactions, setReactions] = useState<{ userId: string; type: string }[]>(initialReactions);
    
    // Check current user's reaction
    const currentUserReaction = reactions.find(r => r.userId === user?._id);
    const [userReaction, setUserReaction] = useState<string | null>(currentUserReaction ? currentUserReaction.type : null);
    
    const [likesCount, setLikesCount] = useState(post.likes.length);
    const [showComments, setShowComments] = useState(false);
    const [showReactionsMenu, setShowReactionsMenu] = useState(false);
    const hoverTimeoutRef = useRef<number | null>(null);
    
    // Dialog for viewing who reacted
    const [showReactionsDialog, setShowReactionsDialog] = useState(false);
    const [reactionsList, setReactionsList] = useState<any[]>([]);
    const [loadingReactions, setLoadingReactions] = useState(false);

    const handleOpenReactionsDialog = async () => {
        setShowReactionsDialog(true);
        setLoadingReactions(true);
        try {
            const res = await fetch(`${baseUrl}/posts/${post._id}/reactions`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setReactionsList(data);
            }
        } catch (error) {
            console.error("Error fetching reactions list:", error);
        } finally {
            setLoadingReactions(false);
        }
    };

    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        };
    }, []);

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setShowReactionsMenu(true);
    };

    const handleMouseLeave = () => {
        hoverTimeoutRef.current = window.setTimeout(() => {
            setShowReactionsMenu(false);
        }, 400);
    };

    const getTopReactions = () => {
        if (!reactions || reactions.length === 0) return null;
        const counts: Record<string, number> = {};
        reactions.forEach(r => {
            counts[r.type] = (counts[r.type] || 0) + 1;
        });
        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([type]) => REACTION_EMOJIS[type]?.emoji);
        return sorted;
    };
    const [comments, setComments] = useState<CommentType[]>([]);
    const [newComment, setNewComment] = useState("");
    const [replyToId, setReplyToId] = useState<string | null>(null);
    const [replyToUser, setReplyToUser] = useState<string | null>(null);
    
    // Media Carousel State
    const [currentMediaIdx, setCurrentMediaIdx] = useState(0);

    // Mention States for Comment Input
    const commentInputRef = useRef<HTMLInputElement>(null);
    const { friends, getFriends } = useFriendStore();
    const [mentionOpen, setMentionOpen] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionTriggerIndex, setMentionTriggerIndex] = useState(-1);
    const [mentionedIds, setMentionedIds] = useState<string[]>([]);

    const renderContentWithMentions = (content: string, mentions?: PostUser[]) => {
        if (!content) return null;
        if (!mentions || mentions.length === 0) return content;
        
        // Sort by display name length descending to avoid partial matches
        const sortedMentions = [...mentions].sort((a, b) => b.displayName.length - a.displayName.length);
        const escapedNames = sortedMentions.map(m => m.displayName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
        const regex = new RegExp(`@(${escapedNames.join('|')})\\b`, 'g');
        
        const parts = content.split(regex);
        if (parts.length === 1) return content;
        
        const result: React.ReactNode[] = [];
        let matchIndex = 0;
        for (let i = 0; i < parts.length; i++) {
            if (i % 2 === 1) {
                const matchedName = parts[i];
                const matchedUser = mentions.find(m => m.displayName === matchedName);
                if (matchedUser) {
                    result.push(
                        <Link
                            key={`mention-${matchIndex++}`}
                            to={`/profile/${matchedUser.username}`}
                            className="font-semibold text-primary hover:underline"
                        >
                            @{matchedName}
                        </Link>
                    );
                } else {
                    result.push(`@${matchedName}`);
                }
            } else {
                result.push(parts[i]);
            }
        }
        return result;
    };

    const handleReact = async (type: string) => {
        const isRemoving = userReaction === type;
        const oldReaction = userReaction;
        const oldReactionsList = reactions;
        
        // Optimistic UI updates
        if (isRemoving) {
            setUserReaction(null);
            setLikesCount(prev => Math.max(0, prev - 1));
            setReactions(prev => prev.filter(r => r.userId !== user?._id));
        } else {
            setUserReaction(type);
            if (!oldReaction) {
                setLikesCount(prev => prev + 1);
                setReactions(prev => [...prev, { userId: user?._id || "", type }]);
            } else {
                setReactions(prev => prev.map(r => r.userId === user?._id ? { ...r, type } : r));
            }
        }

        try {
            const res = await fetch(`${baseUrl}/posts/${post._id}/like`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ type })
            });
            if (res.ok) {
                const data = await res.json();
                setLikesCount(data.likesCount);
                setReactions(data.reactions || []);
                const myReaction = (data.reactions || []).find((r: any) => r.userId === user?._id);
                setUserReaction(myReaction ? myReaction.type : null);
            } else {
                setUserReaction(oldReaction);
                setLikesCount(oldReactionsList.length);
                setReactions(oldReactionsList);
            }
        } catch (error) {
            console.error("Error setting reaction:", error);
            setUserReaction(oldReaction);
            setLikesCount(oldReactionsList.length);
            setReactions(oldReactionsList);
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
            getFriends();
            setMentionedIds([]);
        }
    }, [showComments, getFriends]);

    const handleCommentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setNewComment(text);
        
        const selectionStart = e.target.selectionStart || 0;
        const textBeforeCursor = text.substring(0, selectionStart);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");
        
        if (lastAtIndex !== -1 && (lastAtIndex === 0 || textBeforeCursor[lastAtIndex - 1] === " ")) {
            const query = textBeforeCursor.substring(lastAtIndex + 1);
            if (!query.includes(" ")) {
                setMentionOpen(true);
                setMentionQuery(query);
                setMentionTriggerIndex(lastAtIndex);
                return;
            }
        }
        setMentionOpen(false);
    };

    const handleMentionSelect = (friend: any) => {
        if (mentionTriggerIndex === -1) return;
        const displayName = friend.displayName || friend.username;
        const beforeMention = newComment.substring(0, mentionTriggerIndex);
        const afterMention = newComment.substring(commentInputRef.current?.selectionStart || newComment.length);
        const newValue = `${beforeMention}@${displayName} ${afterMention}`;
        
        setNewComment(newValue);
        setMentionedIds(prev => {
            if (prev.includes(friend._id)) return prev;
            return [...prev, friend._id];
        });
        setMentionOpen(false);
        
        setTimeout(() => {
            if (commentInputRef.current) {
                commentInputRef.current.focus();
                const newCursorPos = beforeMention.length + displayName.length + 2;
                commentInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 50);
    };

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
                    parentId: replyToId,
                    mentions: mentionedIds
                })
            });

            if (res.ok) {
                setNewComment("");
                setReplyToId(null);
                setReplyToUser(null);
                setMentionedIds([]);
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
                    <DropdownMenuTrigger
                        render={
                            <button className="p-2 rounded-full hover:bg-accent/50 text-muted-foreground transition-colors" />
                        }
                    >
                        <MoreHorizontal className="size-5" />
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
                    {renderContentWithMentions(post.content, post.mentions)}
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

            {/* Reactions and Comments count summary */}
            {(likesCount > 0 || post.commentsCount > 0) && (
                <div className="px-4 py-2 border-b border-border/20 flex items-center justify-between text-xs text-muted-foreground bg-accent/5">
                    <div 
                        className="flex items-center gap-1 cursor-pointer hover:underline"
                        onClick={handleOpenReactionsDialog}
                    >
                        {likesCount > 0 && (
                            <>
                                {getTopReactions() && (
                                    <div className="flex items-center -space-x-1 mr-1">
                                        {getTopReactions()?.map((emoji, idx) => (
                                            <span key={idx} className="text-sm select-none animate-in zoom-in-50 duration-200">{emoji}</span>
                                        ))}
                                    </div>
                                )}
                                <span className="font-medium">
                                    {userReaction 
                                        ? (likesCount === 1 ? "Bạn" : `Bạn và ${likesCount - 1} người khác`) 
                                        : `${likesCount} người`}
                                </span>
                            </>
                        )}
                    </div>
                    {post.commentsCount > 0 && (
                        <span>{post.commentsCount} bình luận</span>
                    )}
                </div>
            )}

            {/* Action Bar */}
            <div className="p-2 px-4 flex flex-col gap-2 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div 
                            className="relative"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <button 
                                onClick={() => handleReact(userReaction ? userReaction : "like")} 
                                className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-accent/50 transition-colors duration-150 ${userReaction ? REACTION_EMOJIS[userReaction]?.color : "text-muted-foreground hover:text-foreground"}`}
                                type="button"
                            >
                                {userReaction ? (
                                    <span className="text-xl leading-none animate-in zoom-in duration-200">{REACTION_EMOJIS[userReaction]?.emoji}</span>
                                ) : (
                                    <Heart className="size-6 transition-transform duration-200 group-active:scale-125" />
                                )}
                                <span className="text-sm font-semibold">{userReaction ? REACTION_EMOJIS[userReaction]?.label : "Thích"}</span>
                            </button>

                            {/* Reactions Float Menu */}
                            {showReactionsMenu && (
                                <div 
                                    className="absolute bottom-11 left-0 flex items-center gap-2 bg-background/95 backdrop-blur-md border border-border/50 shadow-xl rounded-full px-3 py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {Object.entries(REACTION_EMOJIS).map(([type, { emoji, label }]) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                handleReact(type);
                                                setShowReactionsMenu(false);
                                            }}
                                            className="hover:scale-130 active:scale-95 transition-transform duration-150 text-2xl px-1 relative group/item"
                                            type="button"
                                        >
                                            <span>{emoji}</span>
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                {label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => setShowComments(!showComments)} 
                            className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors duration-150"
                        >
                            <MessageCircle className="size-6" />
                            <span className="text-sm font-semibold">Bình luận</span>
                        </button>
                    </div>

                    <button 
                        onClick={handleShare}
                        className="p-1.5 rounded-full hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
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
                        <div className="flex-1 flex items-center bg-card border border-border/40 rounded-full px-4 py-1.5 relative">
                            <input 
                                ref={commentInputRef}
                                type="text" 
                                placeholder={replyToUser ? `Phản hồi @${replyToUser}...` : "Viết bình luận..."}
                                value={newComment}
                                onChange={handleCommentInputChange}
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
                            <MentionDropdown 
                                participants={friends.map(f => ({
                                    _id: f._id,
                                    username: f.username,
                                    displayName: f.displayName || f.username,
                                    avatarURL: f.avatarURL
                                }))}
                                query={mentionQuery}
                                onSelect={handleMentionSelect}
                                onClose={() => setMentionOpen(false)}
                                visible={mentionOpen}
                            />
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
                                            <p className="text-sm mt-1">{renderContentWithMentions(comment.content, comment.mentions)}</p>
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
                                                <p className="text-sm mt-1">{renderContentWithMentions(reply.content, reply.mentions)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Dialog to view post reactions details */}
            <Dialog open={showReactionsDialog} onOpenChange={setShowReactionsDialog}>
                <DialogContent className="max-w-md bg-card text-foreground border border-border/40 p-5 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-center border-b border-border/20 pb-3">Cảm xúc bài viết</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[350px] overflow-y-auto beautiful-scrollbar mt-2 flex flex-col gap-4">
                        {loadingReactions ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="size-6 animate-spin text-primary" />
                            </div>
                        ) : reactionsList.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Chưa có cảm xúc nào.</p>
                        ) : (
                            reactionsList.map((item, idx) => {
                                const reactor = item.userId;
                                const reactionType = item.type;
                                if (!reactor) return null;
                                return (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Link 
                                                to={`/profile/${reactor.username}`}
                                                onClick={() => setShowReactionsDialog(false)}
                                            >
                                                <Avatar className="size-9 border border-border/30 hover:opacity-90">
                                                    <AvatarImage src={reactor.avatarURL} alt={reactor.displayName} />
                                                    <AvatarFallback>{reactor.displayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </Link>
                                            <div className="flex flex-col">
                                                <Link 
                                                    to={`/profile/${reactor.username}`}
                                                    onClick={() => setShowReactionsDialog(false)}
                                                    className="font-semibold text-sm hover:underline animate-in fade-in duration-200"
                                                >
                                                    {reactor.displayName}
                                                </Link>
                                                <span className="text-xs text-muted-foreground">@{reactor.username}</span>
                                            </div>
                                        </div>
                                        <span className="text-2xl select-none" title={REACTION_EMOJIS[reactionType]?.label}>
                                            {REACTION_EMOJIS[reactionType]?.emoji}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </article>
    );
}
