import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Camera, Loader2, MessageSquare, Heart, MessageCircle, Grid, Settings, UserPlus } from "lucide-react";
import PostCard from "@/components/social/PostCard";
import { toast } from "sonner";
import { chatService } from "@/services/chatService";
import { useChatStore } from "@/stores/useChatStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { useFriendStore } from "@/stores/useFriendStore";
import ProfileDialog from "@/components/profile/ProfileDialog";

interface SocialUser {
    _id: string;
    username: string;
    displayName: string;
    avatarURL?: string;
    coverPhotoURL?: string;
    bio?: string;
}

interface SocialStats {
    posts: number;
    followers: number;
    following: number;
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

interface FollowUser {
    _id: string;
    username: string;
    displayName: string;
    avatarURL?: string;
    bio?: string;
}

export default function ProfilePage() {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const token = useAuthStore.getState().accessToken;
    const baseUrl = import.meta.env.VITE_API_URL;
    const {
        friends,
        sentList,
        receivedList,
        loading: friendLoading,
        getFriends,
        getAllFriendRequests,
        addFriend,
    } = useFriendStore();

    const [profileUser, setProfileUser] = useState<SocialUser | null>(null);
    const [stats, setStats] = useState<SocialStats>({ posts: 0, followers: 0, following: 0 });
    const [isFollowing, setIsFollowing] = useState(false);
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [postsLoading, setPostsLoading] = useState(true);

    // Dialog States
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editDisplayName, setEditDisplayName] = useState("");
    const [editBio, setEditBio] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFollowersOpen, setIsFollowersOpen] = useState(false);
    const [isFollowingOpen, setIsFollowingOpen] = useState(false);
    const [followList, setFollowList] = useState<FollowUser[]>([]);
    const [followListLoading, setFollowListLoading] = useState(false);

    const [selectedPost, setSelectedPost] = useState<PostType | null>(null);

    // File Upload Refs
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

    const isOwnProfile = currentUser?.username === username;
    const isFriend = !!profileUser && friends.some((friend) => friend._id === profileUser._id);
    const sentRequest = profileUser
        ? sentList.find((request) => request.to?._id === profileUser._id)
        : null;
    const receivedRequest = profileUser
        ? receivedList.find((request) => request.from?._id === profileUser._id)
        : null;

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${baseUrl}/social/stats/${username}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfileUser(data.user);
                setStats(data.stats);
                setIsFollowing(data.isFollowing);
                
                // Set edit fields
                setEditDisplayName(data.user.displayName || "");
                setEditBio(data.user.bio || "");
                setEditPhone(data.user.phone || "");
            } else {
                toast.error("Không tìm thấy người dùng");
            }
        } catch (error) {
            console.error("Error fetching profile stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserPosts = async () => {
        setPostsLoading(true);
        try {
            const res = await fetch(`${baseUrl}/posts/user/${username}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            }
        } catch (error) {
            console.error("Error fetching user posts:", error);
        } finally {
            setPostsLoading(false);
        }
    };

    useEffect(() => {
        if (username) {
            fetchProfileData();
            fetchUserPosts();
        }
    }, [username]);

    useEffect(() => {
        if (!currentUser) return;

        getFriends();
        getAllFriendRequests();
    }, [currentUser?._id, username, getFriends, getAllFriendRequests]);

    const handleDeletePostLocal = (postId: string) => {
        setPosts(prev => prev.filter(p => p._id !== postId));
        setStats(prev => ({ ...prev, posts: Math.max(0, prev.posts - 1) }));
    };

    const handleFollowToggle = async () => {
        if (!profileUser) return;
        setIsFollowing(!isFollowing);
        setStats(prev => ({
            ...prev,
            followers: isFollowing ? prev.followers - 1 : prev.followers + 1
        }));

        try {
            const res = await fetch(`${baseUrl}/social/follow/${profileUser._id}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setIsFollowing(data.isFollowing);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
        }
    };

    const handleMessageClick = async () => {
        if (!profileUser) return;
        if (!isFriend) {
            toast.error("Chỉ có thể nhắn tin với bạn bè");
            return;
        }

        try {
            const conversation = await chatService.createConversation("direct", "", [profileUser._id]);

            if (!conversation) {
                toast.error("Không thể tạo cuộc trò chuyện");
                return;
            }

            useChatStore.getState().addConvo(conversation);
            useSocketStore.getState().socket?.emit("join-conversation", conversation._id);
            navigate("/chat");
        } catch (error) {
            console.error("Error starting chat:", error);
            const message =
                error &&
                typeof error === "object" &&
                "response" in error &&
                error.response &&
                typeof error.response === "object" &&
                "data" in error.response &&
                error.response.data &&
                typeof error.response.data === "object" &&
                "message" in error.response.data
                    ? String(error.response.data.message)
                    : "Không thể tạo cuộc trò chuyện";

            toast.error(message);
        }
    };

    const handleAddFriend = async () => {
        if (!profileUser || isFriend || sentRequest || receivedRequest) return;

        try {
            const message = await addFriend(profileUser._id);
            toast.success(message || "Đã gửi lời mời kết bạn");
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Không thể gửi lời mời kết bạn",
            );
        }
    };

    const getFriendButtonLabel = () => {
        if (sentRequest) return "Đã gửi lời mời";
        if (receivedRequest) return "Đã nhận lời mời";
        return "Kết bạn";
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`${baseUrl}/users/uploadAvatar`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setProfileUser(prev => prev ? { ...prev, avatarURL: data.avatarURL } : null);
                // Update local auth store
                useAuthStore.getState().fetchMe();
                toast.success("Đã cập nhật ảnh đại diện");
            } else {
                toast.error("Upload thất bại");
            }
        } catch (error) {
            console.error("Error uploading avatar:", error);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingCover(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`${baseUrl}/users/uploadCoverPhoto`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setProfileUser(prev => prev ? { ...prev, coverPhotoURL: data.coverPhotoURL } : null);
                toast.success("Đã cập nhật ảnh bìa");
            } else {
                toast.error("Upload thất bại");
            }
        } catch (error) {
            console.error("Error uploading cover photo:", error);
        } finally {
            setUploadingCover(false);
        }
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            const res = await fetch(`${baseUrl}/users/profile`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    displayName: editDisplayName,
                    bio: editBio,
                    phone: editPhone
                })
            });

            if (res.ok) {
                const data = await res.json();
                setProfileUser(prev => prev ? { 
                    ...prev, 
                    displayName: data.user.displayName,
                    bio: data.user.bio
                } : null);
                setIsEditOpen(false);
                toast.success("Đã lưu hồ sơ cá nhân");
            } else {
                toast.error("Cập nhật thất bại");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setSavingProfile(false);
        }
    };

    const fetchFollowList = async (type: "followers" | "following") => {
        if (!profileUser) return;
        setFollowListLoading(true);
        try {
            const res = await fetch(`${baseUrl}/social/${type}/${profileUser._id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFollowList(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setFollowListLoading(false);
        }
    };

    const openFollowers = () => {
        setIsFollowersOpen(true);
        fetchFollowList("followers");
    };

    const openFollowing = () => {
        setIsFollowingOpen(true);
        fetchFollowList("following");
    };

    if (loading) {
        return (
            <div className="flex-1 h-full flex items-center justify-center gap-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Đang tải hồ sơ...</span>
            </div>
        );
    }

    if (!profileUser) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center">
                <h2 className="text-xl font-bold">Người dùng không tồn tại</h2>
                <p className="text-muted-foreground text-sm mt-1">Liên kết có thể bị hỏng hoặc người dùng đã bị xóa.</p>
                <Button className="mt-4" onClick={() => navigate("/")}>Về trang chủ</Button>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full overflow-y-auto beautiful-scrollbar bg-background pb-12">
            {/* Cover Photo Container */}
            <div className="relative w-full h-[200px] md:h-[300px] bg-accent/40 overflow-hidden">
                {profileUser.coverPhotoURL ? (
                    <img 
                        src={profileUser.coverPhotoURL} 
                        alt="Cover banner" 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-violet-600/20 to-pink-500/20" />
                )}

                {isOwnProfile && (
                    <button 
                        onClick={() => coverInputRef.current?.click()}
                        className="absolute bottom-4 right-4 bg-black/60 text-white hover:bg-black/80 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs transition-colors"
                    >
                        {uploadingCover ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
                        Thay đổi ảnh bìa
                    </button>
                )}
                <input 
                    ref={coverInputRef} 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleCoverUpload} 
                />
            </div>

            {/* Profile Info Section */}
            <div className="max-w-[935px] mx-auto px-4 relative">
                {/* Avatar positioning (overlaps cover) */}
                <div className="absolute -top-16 md:-top-24 left-4 md:left-8 group">
                    <div className="relative size-32 md:size-40 rounded-full border-4 border-background overflow-hidden bg-card shadow-md">
                        <Avatar className="size-full">
                            <AvatarImage src={profileUser.avatarURL} alt={profileUser.displayName} />
                            <AvatarFallback className="text-3xl font-bold">
                                {profileUser.displayName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        {isOwnProfile && (
                            <button 
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                            >
                                {uploadingAvatar ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" />}
                            </button>
                        )}
                    </div>
                </div>
                <input 
                    ref={avatarInputRef} 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarUpload} 
                />

                {/* Profile Meta & Actions */}
                <div className="pt-20 md:pt-4 pl-0 md:pl-52 flex flex-col gap-4">
                    {/* Username & Action Buttons */}
                    <div className="flex flex-wrap items-center gap-4">
                        <h2 className="text-2xl font-light">{profileUser.username}</h2>
                        
                        <div className="flex items-center gap-2">
                            {isOwnProfile ? (
                                <>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setIsEditOpen(true)}
                                        className="rounded-lg text-xs font-semibold px-4 h-9"
                                    >
                                        Chỉnh sửa hồ sơ
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => setIsSettingsOpen(true)}
                                        className="h-9 w-9 rounded-full"
                                    >
                                        <Settings className="size-5" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button 
                                        onClick={handleFollowToggle}
                                        variant={isFollowing ? "outline" : "default"}
                                        className={`rounded-lg text-xs font-semibold px-6 h-9 ${!isFollowing ? "bg-primary text-white hover:bg-primary/95" : ""}`}
                                    >
                                        {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                                    </Button>
                                    {!isFriend && (
                                        <Button
                                            onClick={handleAddFriend}
                                            variant="outline"
                                            disabled={friendLoading || !!sentRequest || !!receivedRequest}
                                            className="rounded-lg text-xs font-semibold px-4 h-9 flex items-center gap-2"
                                        >
                                            <UserPlus className="size-4" />
                                            {getFriendButtonLabel()}
                                        </Button>
                                    )}
                                    <Button 
                                        onClick={handleMessageClick}
                                        variant="outline" 
                                        disabled={!isFriend}
                                        title={isFriend ? "Nhắn tin" : "Chỉ có thể nhắn tin với bạn bè"}
                                        className="rounded-lg text-xs font-semibold px-4 h-9 flex items-center gap-2"
                                    >
                                        <MessageSquare className="size-4" />
                                        Nhắn tin
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Followers / Posts / Following Stats */}
                    <div className="flex gap-8 text-sm border-t border-b border-border/20 md:border-none py-3 md:py-0">
                        <div><span className="font-semibold">{stats.posts}</span> bài viết</div>
                        <button onClick={openFollowers} className="hover:opacity-80 transition-opacity">
                            <span className="font-semibold">{stats.followers}</span> người theo dõi
                        </button>
                        <button onClick={openFollowing} className="hover:opacity-80 transition-opacity">
                            <span className="font-semibold">{stats.following}</span> đang theo dõi
                        </button>
                    </div>

                    {/* Bio */}
                    <div className="flex flex-col gap-1.5 mt-2">
                        <h1 className="font-bold text-base">{profileUser.displayName}</h1>
                        {profileUser.bio ? (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap max-w-lg">{profileUser.bio}</p>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">Chưa có tiểu sử</p>
                        )}
                    </div>
                </div>

                {/* Posts Gallery Tab */}
                <div className="border-t border-border/40 mt-12">
                    <div className="flex justify-center border-t-2 border-foreground -mt-0.5 w-max mx-auto px-4 py-3 gap-2">
                        <Grid className="size-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Bài viết</span>
                    </div>

                    {postsLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Grid className="size-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Chưa có bài đăng nào</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-1 md:gap-6">
                            {posts.map((post) => (
                                <div 
                                    key={post._id} 
                                    onClick={() => setSelectedPost(post)}
                                    className="relative aspect-square bg-black overflow-hidden group cursor-pointer border border-border/20 rounded-lg"
                                >
                                    {/* Thumbnail Image/Video */}
                                    {post.media.length > 0 ? (
                                        post.media[0].type === "video" ? (
                                            <video src={post.media[0].url} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={post.media[0].url} alt="Thumbnail" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                        )
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center p-4 text-xs text-white bg-neutral-900 text-center">
                                            {post.content}
                                        </div>
                                    )}

                                    {/* Overlay Stats on Hover */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6 text-white font-bold">
                                        <div className="flex items-center gap-2">
                                            <Heart className="size-5 fill-white" />
                                            <span>{post.likes.length}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MessageCircle className="size-5 fill-white" />
                                            <span>{post.commentsCount}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* EDIT PROFILE DIALOG */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card border border-border/40 text-foreground">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa trang cá nhân</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Tên hiển thị</label>
                            <Input 
                                value={editDisplayName} 
                                onChange={(e) => setEditDisplayName(e.target.value)}
                                className="bg-background border-border/45 rounded-xl"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Tiểu sử (Bio)</label>
                            <Textarea 
                                value={editBio} 
                                onChange={(e) => setEditBio(e.target.value)}
                                className="bg-background border-border/45 rounded-xl min-h-[100px]"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Số điện thoại</label>
                            <Input 
                                value={editPhone} 
                                onChange={(e) => setEditPhone(e.target.value)}
                                className="bg-background border-border/45 rounded-xl"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
                        <Button 
                            onClick={handleSaveProfile} 
                            disabled={savingProfile || !editDisplayName.trim()}
                            className="bg-primary text-white"
                        >
                            {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* FOLLOWERS LIST DIALOG */}
            <Dialog open={isFollowersOpen} onOpenChange={setIsFollowersOpen}>
                <DialogContent className="sm:max-w-[400px] bg-card border border-border/40 text-foreground max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-center">Người theo dõi</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto beautiful-scrollbar py-4 flex flex-col gap-4">
                        {followListLoading ? (
                            <div className="flex justify-center py-6"><Loader2 className="size-6 animate-spin" /></div>
                        ) : followList.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center">Chưa có người theo dõi nào.</p>
                        ) : (
                            followList.map((user) => (
                                <div key={user._id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Link to={`/profile/${user.username}`} onClick={() => setIsFollowersOpen(false)}>
                                            <Avatar className="size-9">
                                                <AvatarImage src={user.avatarURL} alt={user.displayName} />
                                                <AvatarFallback>{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </Link>
                                        <div className="flex flex-col">
                                            <Link to={`/profile/${user.username}`} onClick={() => setIsFollowersOpen(false)} className="font-semibold text-xs hover:underline">
                                                {user.username}
                                            </Link>
                                            <span className="text-[10px] text-muted-foreground max-w-[150px] truncate">{user.displayName}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* FOLLOWING LIST DIALOG */}
            <Dialog open={isFollowingOpen} onOpenChange={setIsFollowingOpen}>
                <DialogContent className="sm:max-w-[400px] bg-card border border-border/40 text-foreground max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-center">Đang theo dõi</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto beautiful-scrollbar py-4 flex flex-col gap-4">
                        {followListLoading ? (
                            <div className="flex justify-center py-6"><Loader2 className="size-6 animate-spin" /></div>
                        ) : followList.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center">Chưa theo dõi ai.</p>
                        ) : (
                            followList.map((user) => (
                                <div key={user._id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Link to={`/profile/${user.username}`} onClick={() => setIsFollowingOpen(false)}>
                                            <Avatar className="size-9">
                                                <AvatarImage src={user.avatarURL} alt={user.displayName} />
                                                <AvatarFallback>{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </Link>
                                        <div className="flex flex-col">
                                            <Link to={`/profile/${user.username}`} onClick={() => setIsFollowingOpen(false)} className="font-semibold text-xs hover:underline">
                                                {user.username}
                                            </Link>
                                            <span className="text-[10px] text-muted-foreground max-w-[150px] truncate">{user.displayName}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* POST DETAIL DIALOG */}
            <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
                <DialogContent className="sm:max-w-[650px] bg-card border border-border/40 text-foreground p-0 overflow-hidden flex items-center justify-center">
                    {selectedPost && (
                        <div className="w-full flex justify-center mt-6">
                            <PostCard 
                                post={selectedPost} 
                                onDelete={(deletedId) => {
                                    handleDeletePostLocal(deletedId);
                                    setSelectedPost(null);
                                }}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* SETTINGS DIALOG */}
            <ProfileDialog open={isSettingsOpen} setOpen={setIsSettingsOpen} />
        </div>
    );
}
