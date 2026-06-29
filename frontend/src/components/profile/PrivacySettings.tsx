import { Shield, ShieldBan, Loader2, UserX } from "lucide-react";
import { useState, useEffect } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserAvatar from "../chat/UserAvatar";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

interface BlockedUser {
  _id: string;
  username: string;
  displayName: string;
  avatarURL?: string;
}

const PrivacySettings = () => {
    const { user: currentUser, setUser } = useAuthStore();
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [unblockingId, setUnblockingId] = useState<string | null>(null);
    const [showBlockedList, setShowBlockedList] = useState(false);

    const fetchBlockedUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get("/users/blocked");
            setBlockedUsers(res.data.blockedUsers || []);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách chặn:", error);
            toast.error("Không thể tải danh sách chặn");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (showBlockedList) {
            fetchBlockedUsers();
        }
    }, [showBlockedList]);

    const handleUnblock = async (userId: string) => {
        setUnblockingId(userId);
        try {
            await api.post(`/users/unblock/${userId}`);
            toast.success("Đã bỏ chặn thành công");
            setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
            
            // Cập nhật store
            if (currentUser) {
                const updatedBlocked = (currentUser.blockedUsers || []).filter(
                    (id: any) => (typeof id === "object" ? id._id !== userId : id !== userId)
                );
                setUser({ ...currentUser, blockedUsers: updatedBlocked });
            }
        } catch (error) {
            console.error("Lỗi khi bỏ chặn:", error);
            toast.error("Không thể bỏ chặn");
        } finally {
            setUnblockingId(null);
        }
    };

    return (
        <Card className="glass-strong border-border/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Quyền riêng tư & Bảo mật
                </CardTitle>
                <CardDescription>
                    Quản lý cài đặt quyền riêng tư và danh sách chặn của bạn
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowBlockedList(!showBlockedList)}
                        className="w-full justify-between glass-light border-border/30 hover:text-destructive"
                    >
                        <span className="flex items-center">
                            <ShieldBan className="size-4 mr-2" />
                            Danh sách người dùng đã chặn
                        </span>
                        <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                            {currentUser?.blockedUsers?.length || 0}
                        </span>
                    </Button>

                    {showBlockedList && (
                        <div className="border border-border/30 rounded-xl p-4 bg-muted/20 space-y-3 transition-all duration-300">
                            {loading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="size-5 animate-spin text-primary" />
                                </div>
                            ) : blockedUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-sm gap-2">
                                    <UserX className="size-8 opacity-40" />
                                    <span>Danh sách chặn trống</span>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                    {blockedUsers.map((user) => (
                                        <div key={user._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-all">
                                            <div className="flex items-center gap-2.5">
                                                <UserAvatar
                                                    type="chat"
                                                    name={user.displayName}
                                                    avatarURL={user.avatarURL}
                                                />
                                                <div className="text-left">
                                                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                                    <span className="text-xs text-muted-foreground">@{user.username}</span>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={unblockingId === user._id}
                                                onClick={() => handleUnblock(user._id)}
                                                className="h-8 text-xs border-border/40 hover:bg-green-500 hover:text-white"
                                            >
                                                {unblockingId === user._id && <Loader2 className="size-3 animate-spin mr-1" />}
                                                Bỏ chặn
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-border/30">
                    <h4 className="font-medium mb-3 text-destructive">Khu vực nguy hiểm</h4>
                    <Button
                        variant="destructive"
                        className="w-full hover:bg-red-600 transition-colors"
                        onClick={() => toast.info("Tính năng đang phát triển")}
                    >
                        Xoá tài khoản
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default PrivacySettings;