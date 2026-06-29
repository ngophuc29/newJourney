import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import UserAvatar from "./UserAvatar";
import { Button } from "../ui/button";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

interface UserCardDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserProfileData {
  _id: string;
  username: string;
  displayName: string;
  avatarURL?: string;
  bio?: string;
  phone?: string;
}

const UserCardDialog = ({ userId, open, onOpenChange }: UserCardDialogProps) => {
  const { user: currentUser, setUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      const fetchProfile = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/users/${userId}`);
          setProfile(res.data.user);
        } catch (error) {
          console.error("Lỗi khi tải thông tin người dùng:", error);
          toast.error("Không thể tải thông tin người dùng");
          onOpenChange(false);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [userId, open]);

  if (!open || !userId) return null;

  const isSelf = currentUser?._id === userId;
  const isBlocked = currentUser?.blockedUsers?.map((id: any) => 
    typeof id === "object" ? id._id || id.toString() : id.toString()
  ).includes(userId);

  const handleBlockToggle = async () => {
    setActionLoading(true);
    try {
      if (isBlocked) {
        await api.post(`/users/unblock/${userId}`);
        toast.success(`Đã bỏ chặn ${profile?.displayName}`);
        // Update currentUser blocked list in store
        if (currentUser) {
          const updatedBlocked = (currentUser.blockedUsers || []).filter(
            (id: any) => (typeof id === "object" ? id._id !== userId : id !== userId)
          );
          setUser({ ...currentUser, blockedUsers: updatedBlocked });
        }
      } else {
        await api.post(`/users/block/${userId}`);
        toast.success(`Đã chặn ${profile?.displayName}`);
        if (currentUser) {
          const updatedBlocked = [...(currentUser.blockedUsers || []), userId];
          setUser({ ...currentUser, blockedUsers: updatedBlocked });
        }
      }
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái chặn:", error);
      toast.error("Thao tác thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-6 bg-background rounded-2xl border-none shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : profile ? (
          <div className="flex flex-col items-center text-center space-y-4">
            <DialogHeader className="w-full flex flex-col items-center">
              <UserAvatar
                type="profile"
                name={profile.displayName}
                avatarURL={profile.avatarURL}
                className="size-24 text-3xl shadow-md mb-2"
              />
              <DialogTitle className="text-xl font-bold text-foreground">
                {profile.displayName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">@{profile.username}</p>
            </DialogHeader>

            <div className="w-full border-t border-border/50 my-2 pt-4 text-left space-y-3">
              {profile.bio && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Giới thiệu</span>
                  <p className="text-sm text-foreground bg-muted/30 p-2.5 rounded-xl border border-border/20">{profile.bio}</p>
                </div>
              )}
              {profile.phone && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Số điện thoại</span>
                  <p className="text-sm text-foreground">{profile.phone}</p>
                </div>
              )}
            </div>

            {!isSelf && (
              <div className="w-full pt-2">
                <Button
                  onClick={handleBlockToggle}
                  disabled={actionLoading}
                  variant={isBlocked ? "outline" : "destructive"}
                  className="w-full flex items-center justify-center gap-2 py-5 rounded-xl text-sm font-semibold"
                >
                  {isBlocked ? (
                    <>
                      <ShieldCheck className="size-4 text-green-500" />
                      Bỏ chặn người dùng này
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="size-4" />
                      Chặn người dùng này
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            Không tìm thấy thông tin người dùng.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserCardDialog;
