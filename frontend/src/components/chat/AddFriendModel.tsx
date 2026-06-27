import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Search, UserPlus } from "lucide-react";
import { useFriendStore } from "@/stores/useFriendStore";
import { toast } from "sonner";
import UserAvatar from "./UserAvatar";
import type { SuggestedFriend } from "@/types/User";

export interface IFormValues {
  username: string;
  message: string;
}

const AddFriendModel = () => {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const { loading, suggestedUsers, getSuggestedFriends, addFriend } =
    useFriendStore();

  useEffect(() => {
    if (!open) return;

    getSuggestedFriends();
  }, [open, getSuggestedFriends]);

  const filteredUsers = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) return suggestedUsers;

    return suggestedUsers.filter((user) => {
      return (
        user.username?.toLowerCase().includes(value) ||
        user.displayName?.toLowerCase().includes(value)
      );
    });
  }, [keyword, suggestedUsers]);

  const handleSendRequest = async (user: SuggestedFriend) => {
    if (user.friendRequestStatus) return;

    try {
      setSendingId(user._id);
      const message = await addFriend(user._id);
      toast.success(message);
      await getSuggestedFriends();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Khong gui duoc loi moi ket ban",
      );
    } finally {
      setSendingId(null);
    }
  };

  const getButtonLabel = (user: SuggestedFriend) => {
    if (user.friendRequestStatus === "sent") return "Da gui";
    if (user.friendRequestStatus === "received") return "Da nhan";
    if (sendingId === user._id) return "Dang gui";
    return "Ket ban";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <div className="flex justify-center items-center size-5 rounded-full hover:bg-sidebar-accent cursor-pointer z-10">
          <UserPlus className="size-4" />
          <span className="sr-only">Ket ban</span>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px] border-none">
        <DialogHeader>
          <DialogTitle>Ket ban</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tim username hoac ten hien thi..."
              className="pl-8"
            />
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 beautiful-scrollbar">
            {loading && !suggestedUsers.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Dang tai danh sach...
              </p>
            )}

            {!loading && filteredUsers.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Khong co nguoi dung phu hop
              </p>
            )}

            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="flex min-h-16 items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
              >
                <UserAvatar
                  type="chat"
                  name={user.displayName || user.username}
                  avatarURL={user.avatarURL}
                  className="size-10"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user.displayName || user.username}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{user.username}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={user.friendRequestStatus ? "outline" : "default"}
                  disabled={!!user.friendRequestStatus || sendingId === user._id}
                  onClick={() => handleSendRequest(user)}
                >
                  {!user.friendRequestStatus && sendingId !== user._id && (
                    <UserPlus className="size-4" />
                  )}
                  {getButtonLabel(user)}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendModel;
