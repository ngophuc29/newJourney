import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { 
    Home, 
    Compass, 
    MessageSquare, 
    Bell, 
    Users,
    PlusSquare, 
    LogOut,
    Sun,
    Moon
} from "lucide-react";
import { useState, useEffect } from "react";
import { useThemeStore } from "@/stores/useThemeStore";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import CreatePostDialog from "../social/CreatePostDialog";
import NotificationDialog from "../notification/NotificationDialog";
import { useNotificationStore } from "@/stores/useNotificationStore";
import MyFriendsDialog from "../friends/MyFriendsDialog";

export default function MainLayout() {
    const { user, signOut } = useAuthStore();
    const { isDarK, toggleTheme } = useThemeStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isFriendsOpen, setIsFriendsOpen] = useState(false);
    
    const { notifications, fetchNotifications } = useNotificationStore();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

    const menuItems = [
        { icon: Home, label: "Trang chủ", path: "/" },
        { icon: Compass, label: "Khám phá", path: "/explore" },
        { icon: MessageSquare, label: "Tin nhắn", path: "/chat" },
    ];

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            {/* LEFT SIDEBAR - DESKTOP */}
            <aside className="hidden md:flex flex-col w-64 h-full border-r border-border/40 bg-card/30 backdrop-blur-md p-4 justify-between shrink-0">
                <div className="flex flex-col gap-8">
                    {/* Logo */}
                    <Link to="/" className="px-3 py-2 flex items-center gap-2">
                        <span className="text-2xl font-black bg-gradient-to-r from-violet-600 via-pink-500 to-amber-400 bg-clip-text text-transparent">
                            NewJourney
                        </span>
                    </Link>

                    {/* Menu Navigation */}
                    <nav className="flex flex-col gap-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-accent/50 ${
                                        isActive ? "bg-accent/80 font-bold text-primary" : "text-muted-foreground"
                                    }`}
                                >
                                    <Icon className={`size-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-primary" : ""}`} />
                                    <span className="text-sm">{item.label}</span>
                                </Link>
                            );
                        })}

                        {/* Notifications */}
                        <button
                            onClick={() => setIsFriendsOpen(true)}
                            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-accent/50 text-muted-foreground w-full text-left group"
                        >
                            <Users className="size-5 transition-transform duration-200 group-hover:scale-110" />
                            <span className="text-sm">Bạn bè</span>
                        </button>

                        <button
                            onClick={() => setIsNotificationsOpen(true)}
                            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-accent/50 text-muted-foreground w-full text-left group"
                        >
                            <div className="relative">
                                <Bell className="size-5 transition-transform duration-200 group-hover:scale-110" />
                                {unreadNotificationsCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white animate-pulse">
                                        {unreadNotificationsCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-sm">Thông báo</span>
                        </button>

                        {/* Create Post Button */}
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-accent/50 text-muted-foreground w-full text-left group"
                        >
                            <PlusSquare className="size-5 transition-transform duration-200 group-hover:scale-110" />
                            <span className="text-sm">Tạo bài viết</span>
                        </button>

                        {/* Profile Link */}
                        {user && (
                            <Link
                                to={`/profile/${user.username}`}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-accent/50 ${
                                    location.pathname.startsWith("/profile") ? "bg-accent/80 font-bold text-primary" : "text-muted-foreground"
                                }`}
                            >
                                <Avatar className="size-6 border border-border">
                                    <AvatarImage src={user.avatarURL} alt={user.displayName} />
                                    <AvatarFallback>{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">Trang cá nhân</span>
                            </Link>
                        )}
                    </nav>
                </div>

                {/* Footer Controls / Settings */}
                <div className="flex flex-col gap-2">
                    {/* Theme Switcher */}
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-accent/50 text-muted-foreground w-full text-left group"
                    >
                        {isDarK ? (
                            <>
                                <Sun className="size-5 text-amber-500 transition-transform duration-200 group-hover:scale-110" />
                                <span className="text-sm">Chế độ sáng</span>
                            </>
                        ) : (
                            <>
                                <Moon className="size-5 text-violet-500 transition-transform duration-200 group-hover:scale-110" />
                                <span className="text-sm">Chế độ tối</span>
                            </>
                        )}
                    </button>

                    {/* Logout */}
                    <button
                        onClick={signOut}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-red-500/10 text-red-500 w-full text-left group"
                    >
                        <LogOut className="size-5 transition-transform duration-200 group-hover:scale-110" />
                        <span className="text-sm">Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* BOTTOM NAVIGATION - MOBILE */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border/40 bg-background/80 backdrop-blur-lg flex items-center justify-around z-40 px-2">
                <Link to="/" className="flex flex-col items-center justify-center text-muted-foreground">
                    <Home className="size-5" />
                </Link>
                <Link to="/explore" className="flex flex-col items-center justify-center text-muted-foreground">
                    <Compass className="size-5" />
                </Link>
                <button 
                    onClick={() => setIsCreateOpen(true)} 
                    className="flex flex-col items-center justify-center text-muted-foreground"
                >
                    <PlusSquare className="size-5" />
                </button>
                <button 
                    onClick={() => setIsFriendsOpen(true)} 
                    className="flex flex-col items-center justify-center text-muted-foreground"
                >
                    <Users className="size-5" />
                </button>
                <Link to="/chat" className="flex flex-col items-center justify-center text-muted-foreground">
                    <MessageSquare className="size-5" />
                </Link>
                {user && (
                    <Link to={`/profile/${user.username}`} className="flex flex-col items-center justify-center">
                        <Avatar className="size-6 border border-border">
                            <AvatarImage src={user.avatarURL} alt={user.displayName} />
                            <AvatarFallback>{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </Link>
                )}
            </nav>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 h-full overflow-hidden pb-16 md:pb-0">
                <Outlet />
            </main>

            {/* CREATE POST GLOBAL DIALOG */}
            <CreatePostDialog 
                open={isCreateOpen} 
                onOpenChange={setIsCreateOpen} 
                onPostCreated={() => {
                    if (location.pathname === "/") {
                        window.location.reload();
                    } else {
                        navigate("/");
                    }
                }}
            />

            {/* NOTIFICATIONS DIALOG */}
            <NotificationDialog 
                open={isNotificationsOpen} 
                setOpen={setIsNotificationsOpen} 
            />

            <MyFriendsDialog
                open={isFriendsOpen}
                setOpen={setIsFriendsOpen}
                onMessageOpened={() => navigate("/chat")}
            />
        </div>
    );
}
