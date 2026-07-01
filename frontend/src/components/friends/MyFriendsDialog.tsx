import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFriendStore } from "@/stores/useFriendStore";
import { useChatStore } from "@/stores/useChatStore";
import UserAvatar from "../chat/UserAvatar";
import { MessageCircle, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { Friend } from "@/types/User";

interface MyFriendsDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onMessageOpened?: () => void;
}

const MyFriendsDialog = ({ open, setOpen, onMessageOpened }: MyFriendsDialogProps) => {
  const [keyword, setKeyword] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { friends, loading, getFriends, removeFriend } = useFriendStore();
  const { openDirectConversation } = useChatStore();

  useEffect(() => {
    if (!open) return;

    getFriends();
  }, [open, getFriends]);

  const filteredFriends = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) return friends;

    return friends.filter((friend) => {
      return (
        friend.username?.toLowerCase().includes(value) ||
        friend.displayName?.toLowerCase().includes(value)
      );
    });
  }, [friends, keyword]);

  const handleMessage = async (friend: Friend) => {
    await openDirectConversation(friend._id);
    setOpen(false);
    onMessageOpened?.();
  };

  const handleRemoveFriend = async (friend: Friend) => {
    const ok = window.confirm(
      `Xoa ${friend.displayName || friend.username} khoi danh sach ban be?`,
    );
    if (!ok) return;

    try {
      setRemovingId(friend._id);
      const message = await removeFriend(friend._id);
      toast.success(message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Khong xoa duoc ban be luc nay",
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[540px] border-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Ban be cua toi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tim ban be..."
              className="pl-8"
            />
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 beautiful-scrollbar">
            {loading && friends.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Dang tai danh sach ban be...
              </p>
            )}

            {!loading && filteredFriends.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Chua co ban be phu hop
              </p>
            )}

            {filteredFriends.map((friend) => (
              <div
                key={friend._id}
                className="flex min-h-16 items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
              >
                <UserAvatar
                  type="chat"
                  name={friend.displayName || friend.username}
                  avatarURL={friend.avatarURL}
                  className="size-10"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {friend.displayName || friend.username}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{friend.username}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    title="Nhan tin"
                    onClick={() => handleMessage(friend)}
                  >
                    <MessageCircle className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="destructive"
                    title="Xoa ban"
                    disabled={removingId === friend._id}
                    onClick={() => handleRemoveFriend(friend)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MyFriendsDialog;
