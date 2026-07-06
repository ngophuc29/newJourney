import { useState, useEffect } from "react";
import StoryTray from "@/components/story/StoryTray";
import PostCard from "@/components/social/PostCard";
import CreatePostDialog from "@/components/social/CreatePostDialog";
import FeedFriendsPanel from "@/components/social/FeedFriendsPanel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { Image, Video, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import SEO from "@/components/common/SEO";

interface SuggestedUser {
    _id: string;
    username: string;
    displayName: string;
    avatarURL?: string;
    bio?: string;
    friendRequestStatus?: "sent" | "received" | "none";
}

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

export default function FeedPage() {
    const { user } = useAuthStore();
    const token = useAuthStore.getState().accessToken;
    const baseUrl = import.meta.env.VITE_API_URL;

    const [posts, setPosts] = useState<PostType[]>([]);
    const { suggestedUsers, getSuggestedFriends, addFriend } = useFriendStore();
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchFeed = async (pageNum: number, append = false) => {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const res = await fetch(`${baseUrl}/posts/feed?page=${pageNum}&limit=10`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (append) {
                    setPosts(prev => [...prev, ...data.posts]);
                } else {
                    setPosts(data.posts);
                }
                setHasMore(data.hasMore);
            }
        } catch (error) {
            console.error("Error fetching feed:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchFeed(1);
        getSuggestedFriends();
    }, [getSuggestedFriends]);

    const handleLoadMore = () => {
        if (!hasMore || loadingMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchFeed(nextPage, true);
    };

    const handleAddFriend = async (userId: string) => {
        try {
            const msg = await addFriend(userId);
            toast.success(msg || "Đã gửi lời mời kết bạn");
        } catch (error: any) {
            toast.error(error.message || "Không thể gửi lời mời kết bạn");
        }
    };

    const handleDeletePostLocal = (postId: string) => {
        setPosts(prev => prev.filter(p => p._id !== postId));
    };

    return (
        <div className="flex-1 h-full w-full overflow-y-auto beautiful-scrollbar bg-background flex justify-center py-6 px-4 md:px-8">
            <SEO title="Bảng tin" description="Xem bảng tin, kết nối với bạn bè và chia sẻ những khoảnh khắc đẹp của cuộc sống trên NewJourney." />
            <div className="flex w-full max-w-[935px] gap-8">
                {/* LEFT: Feed Content */}
                <div className="flex-1 flex flex-col items-center min-w-0 max-w-[600px]">
                    {/* Story Tray */}
                    <div className="w-full mb-6">
                        <StoryTray variant="feed" />
                    </div>

                    <div className="w-full mb-6 lg:hidden">
                        <FeedFriendsPanel compact />
                    </div>

                    {/* Quick Post Creator */}
                    <div className="w-full bg-card border border-border/40 rounded-2xl p-4 mb-6 flex flex-col gap-4 shadow-sm">
                        <div className="flex gap-3 items-center">
                            <Avatar className="size-10">
                                <AvatarImage src={user?.avatarURL} alt={user?.displayName} />
                                <AvatarFallback>{user?.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <button 
                                onClick={() => setIsCreateOpen(true)}
                                className="flex-1 bg-accent/40 hover:bg-accent/70 transition-colors text-left text-muted-foreground text-sm py-2.5 px-4 rounded-full"
                            >
                                {user?.displayName ? `${user.displayName} ơi, bạn đang nghĩ gì thế?` : "Bạn đang nghĩ gì thế?"}
                            </button>
                        </div>
                        <div className="flex items-center justify-around border-t border-border/30 pt-3 text-xs text-muted-foreground">
                            <button 
                                onClick={() => setIsCreateOpen(true)}
                                className="flex items-center gap-2 hover:bg-accent/50 px-4 py-2 rounded-lg transition-colors"
                            >
                                <Image className="size-5 text-emerald-500" />
                                <span className="font-medium">Ảnh</span>
                            </button>
                            <button 
                                onClick={() => setIsCreateOpen(true)}
                                className="flex items-center gap-2 hover:bg-accent/50 px-4 py-2 rounded-lg transition-colors"
                            >
                                <Video className="size-5 text-rose-500" />
                                <span className="font-medium">Video</span>
                            </button>
                        </div>
                    </div>

                    {/* Feed Posts */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="size-8 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Đang tải bảng tin...</span>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-16 bg-card border border-border/40 rounded-2xl p-8 w-full">
                            <h3 className="text-lg font-bold">Bảng tin trống</h3>
                            <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                                Hãy kết bạn hoặc theo dõi thêm nhiều người dùng để cập nhật những hoạt động thú vị nhé!
                            </p>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col items-center">
                            {posts.map((post) => (
                                <PostCard 
                                    key={post._id} 
                                    post={post} 
                                    onDelete={handleDeletePostLocal}
                                />
                            ))}

                            {/* Load More Button */}
                            {hasMore && (
                                <Button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    variant="outline"
                                    className="w-full max-w-[600px] rounded-xl py-6 hover:bg-accent mt-2 mb-8"
                                >
                                    {loadingMore ? (
                                        <Loader2 className="size-5 animate-spin text-primary" />
                                    ) : (
                                        "Tải thêm bài viết"
                                    )}
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT: Sidebar Suggestions (Desktop Only) */}
                <div className="hidden lg:block w-80 shrink-0 self-start">
                    {/* Logged in User Profile Info */}
                    {user && (
                        <div className="flex items-center justify-between mb-6 px-1">
                            <div className="flex items-center gap-3">
                                <Link to={`/profile/${user.username}`}>
                                    <Avatar className="size-12 border border-border">
                                        <AvatarImage src={user.avatarURL} alt={user.displayName} />
                                        <AvatarFallback>{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div className="flex flex-col">
                                    <Link to={`/profile/${user.username}`} className="font-semibold text-sm hover:underline">
                                        {user.username}
                                    </Link>
                                    <span className="text-xs text-muted-foreground">{user.displayName}</span>
                                </div>
                            </div>
                            <Link to={`/profile/${user.username}`} className="text-xs font-bold text-primary hover:underline">
                                Xem hồ sơ
                            </Link>
                        </div>
                    )}

                    <div className="mb-6">
                        <FeedFriendsPanel />
                    </div>

                    {/* Suggestions Section */}
                    {suggestedUsers.length > 0 && (
                        <div className="flex flex-col bg-card border border-border/40 rounded-2xl p-4 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-muted-foreground uppercase">Gợi ý cho bạn</span>
                            </div>

                            <div className="flex flex-col gap-4">
                                {suggestedUsers.map((sug) => (
                                    <div key={sug._id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Link to={`/profile/${sug.username}`}>
                                                <Avatar className="size-9">
                                                    <AvatarImage src={sug.avatarURL} alt={sug.displayName} />
                                                    <AvatarFallback>{sug.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </Link>
                                            <div className="flex flex-col">
                                                <Link to={`/profile/${sug.username}`} className="font-semibold text-xs hover:underline">
                                                    {sug.username}
                                                </Link>
                                                <span className="text-[10px] text-muted-foreground max-w-[120px] truncate">
                                                    {sug.displayName}
                                                </span>
                                            </div>
                                        </div>
                                        {sug.friendRequestStatus === "sent" ? (
                                            <span className="text-xs text-muted-foreground font-semibold">Đã gửi</span>
                                        ) : sug.friendRequestStatus === "received" ? (
                                            <span className="text-xs text-muted-foreground font-semibold">Đã nhận</span>
                                        ) : (
                                            <button 
                                                onClick={() => handleAddFriend(sug._id)}
                                                className="text-xs font-bold text-primary hover:text-primary-hover transition-colors"
                                            >
                                                Kết bạn
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Local Create Post Dialog */}
            <CreatePostDialog 
                open={isCreateOpen} 
                onOpenChange={setIsCreateOpen} 
                onPostCreated={() => fetchFeed(1)}
            />
        </div>
    );
}
