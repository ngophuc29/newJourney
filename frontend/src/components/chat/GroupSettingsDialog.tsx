import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import UserAvatar from "./UserAvatar";
import type { Conversation, Participant } from "@/types/chat";
import type { Friend } from "@/types/User";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { Crown, LogOut, Plus, Search, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";

interface GroupSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data
  ) {
    return String(error.response.data.message);
  }

  return fallback;
};

const ownerIdOf = (conversation: Conversation) => {
  const createdBy = conversation.group?.createdBy as unknown;

  if (createdBy && typeof createdBy === "object" && "_id" in createdBy) {
    return String(createdBy._id);
  }

  return String(createdBy ?? "");
};

const GroupSettingsDialog = ({
  open,
  onOpenChange,
  conversation,
}: GroupSettingsDialogProps) => {
  const { user } = useAuthStore();
  const { friends, getFriends } = useFriendStore();
  const {
    loading,
    renameGroup,
    addGroupMembers,
    removeGroupMember,
    transferGroupOwner,
    leaveGroup,
  } = useChatStore();
  const [name, setName] = useState(conversation.group?.name ?? "");
  const [search, setSearch] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [newOwnerId, setNewOwnerId] = useState("");

  const ownerId = ownerIdOf(conversation);
  const isOwner = !!user && ownerId === user._id;
  const otherParticipants = conversation.participants.filter(
    (p) => p._id !== user?._id,
  );
  const memberIds = new Set(conversation.participants.map((p) => p._id));

  useEffect(() => {
    if (!open) return;

    setName(conversation.group?.name ?? "");
    setNewOwnerId(otherParticipants[0]?._id ?? "");
    getFriends();
  }, [conversation.group?.name, open]);

  const availableFriends = useMemo(() => {
    const value = search.trim().toLowerCase();

    return friends.filter((friend) => {
      const isMember = memberIds.has(friend._id);
      const isSelected = selectedFriends.some((u) => u._id === friend._id);
      const matches =
        !value ||
        friend.displayName?.toLowerCase().includes(value) ||
        friend.username?.toLowerCase().includes(value);

      return !isMember && !isSelected && matches;
    });
  }, [friends, memberIds, search, selectedFriends]);

  const handleRename = async () => {
    try {
      await renameGroup(conversation._id, name.trim());
      toast.success("Da doi ten nhom");
    } catch (error) {
      toast.error(getErrorMessage(error, "Khong doi duoc ten nhom"));
    }
  };

  const handleAddMembers = async () => {
    if (selectedFriends.length === 0) return;

    try {
      await addGroupMembers(
        conversation._id,
        selectedFriends.map((friend) => friend._id),
      );
      setSelectedFriends([]);
      setSearch("");
      toast.success("Da them thanh vien");
    } catch (error) {
      toast.error(getErrorMessage(error, "Khong them duoc thanh vien"));
    }
  };

  const handleRemoveMember = async (participant: Participant) => {
    const ok = window.confirm(
      `Xoa ${participant.displayName} khoi nhom chat?`,
    );
    if (!ok) return;

    try {
      await removeGroupMember(conversation._id, participant._id);
      toast.success("Da xoa thanh vien");
    } catch (error) {
      toast.error(getErrorMessage(error, "Khong xoa duoc thanh vien"));
    }
  };

  const handleTransferOwner = async () => {
    if (!newOwnerId) return;

    try {
      await transferGroupOwner(conversation._id, newOwnerId);
      toast.success("Da chuyen truong nhom");
    } catch (error) {
      toast.error(getErrorMessage(error, "Khong chuyen duoc truong nhom"));
    }
  };

  const handleLeaveGroup = async () => {
    const ok = window.confirm("Ban chac chan muon roi nhom chat nay?");
    if (!ok) return;

    try {
      await leaveGroup(conversation._id, isOwner ? newOwnerId : undefined);
      toast.success("Da roi nhom");
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Khong roi duoc nhom"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] border-none">
        <DialogHeader>
          <DialogTitle>Quan ly nhom chat</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members">Thanh vien</TabsTrigger>
            <TabsTrigger value="add">Them</TabsTrigger>
            <TabsTrigger value="settings">Cai dat</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-4 space-y-2">
            {conversation.participants.map((participant) => (
              <div
                key={participant._id}
                className="flex min-h-14 items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
              >
                <UserAvatar
                  type="chat"
                  name={participant.displayName}
                  avatarURL={participant.avatarURL ?? undefined}
                  className="size-9"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {participant.displayName}
                  </p>
                </div>

                {participant._id === ownerId && (
                  <Badge variant="outline" className="gap-1">
                    <Crown className="size-3" />
                    Truong nhom
                  </Badge>
                )}

                {isOwner && participant._id !== user?._id && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="destructive"
                    disabled={loading}
                    onClick={() => handleRemoveMember(participant)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="add" className="mt-4 space-y-3">
            {!isOwner && (
              <p className="text-sm text-muted-foreground">
                Chi truong nhom moi co the them thanh vien.
              </p>
            )}

            {isOwner && (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tim ban be de them..."
                    className="pl-8"
                  />
                </div>

                {selectedFriends.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedFriends.map((friend) => (
                      <Button
                        key={friend._id}
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          setSelectedFriends((current) =>
                            current.filter((u) => u._id !== friend._id),
                          )
                        }
                      >
                        {friend.displayName}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="max-h-52 space-y-2 overflow-y-auto pr-1 beautiful-scrollbar">
                  {availableFriends.map((friend) => (
                    <button
                      key={friend._id}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted/60"
                      onClick={() =>
                        setSelectedFriends((current) => [...current, friend])
                      }
                    >
                      <UserAvatar
                        type="chat"
                        name={friend.displayName}
                        avatarURL={friend.avatarURL}
                        className="size-9"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {friend.displayName}
                      </span>
                      <Plus className="size-4 text-muted-foreground" />
                    </button>
                  ))}

                  {availableFriends.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Khong co ban be phu hop de them
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  className="w-full"
                  disabled={loading || selectedFriends.length === 0}
                  onClick={handleAddMembers}
                >
                  Them thanh vien
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Ten nhom</p>
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={!isOwner}
                />
                <Button
                  type="button"
                  disabled={!isOwner || loading || !name.trim()}
                  onClick={handleRename}
                >
                  Luu
                </Button>
              </div>
            </div>

            {isOwner && otherParticipants.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Truong nhom moi</p>
                <div className="flex gap-2">
                  <select
                    value={newOwnerId}
                    onChange={(event) => setNewOwnerId(event.target.value)}
                    className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {otherParticipants.map((participant) => (
                      <option key={participant._id} value={participant._id}>
                        {participant.displayName}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading || !newOwnerId}
                    onClick={handleTransferOwner}
                  >
                    <UserCog className="size-4" />
                    Chuyen quyen
                  </Button>
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={loading || (isOwner && otherParticipants.length > 0 && !newOwnerId)}
              onClick={handleLeaveGroup}
            >
              <LogOut className="size-4" />
              Roi nhom
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GroupSettingsDialog;
