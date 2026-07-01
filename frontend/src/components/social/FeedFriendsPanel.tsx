import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/chat/UserAvatar";
import MyFriendsDialog from "@/components/friends/MyFriendsDialog";
import FriendRequestDialog from "@/components/friendRequest/FriendRequestDialog";
import { useFriendStore } from "@/stores/useFriendStore";
import { useChatStore } from "@/stores/useChatStore";
import type { Friend, FriendRequest } from "@/types/User";

interface FeedFriendsPanelProps {
  compact?: boolean;
}

const FeedFriendsPanel = ({ compact = false }: FeedFriendsPanelProps) => {
  const navigate = useNavigate();
  const [friendsDialogOpen, setFriendsDialogOpen] = useState(false);
  const [requestsDialogOpen, setRequestsDialogOpen] = useState(false);
  const {
    friends,
    receivedList,
    loading,
    getFriends,
    getAllFriendRequests,
    acceptFriendRequest,
    declineFriendRequest,
  } = useFriendStore();
  const { openDirectConversation } = useChatStore();

  useEffect(() => {
    getFriends();
    getAllFriendRequests();
  }, [getFriends, getAllFriendRequests]);

  const visibleFriends = compact ? friends.slice(0, 8) : friends.slice(0, 5);
  const visibleRequests = receivedList.slice(0, compact ? 2 : 3);

  const handleMessage = async (friend: Friend) => {
    await openDirectConversation(friend._id);
    navigate("/chat");
  };

  const handleAccept = async (request: FriendRequest) => {
    try {
      await acceptFriendRequest(request._id);
      toast.success("Đã chấp nhận lời mời kết bạn");
    } catch (error) {
      console.error(error);
      toast.error("Không thể chấp nhận lúc này");
    }
  };

  const handleDecline = async (request: FriendRequest) => {
    try {
      await declineFriendRequest(request._id);
      toast.info("Đã từ chối lời mời kết bạn");
    } catch (error) {
      console.error(error);
      toast.error("Không thể từ chối lúc này");
    }
  };

  return (
    <>
      <section className="w-full bg-card border border-border/40 rounded-2xl p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <h2 className="text-sm font-bold">Bạn bè</h2>
            {receivedList.length > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                {receivedList.length}
              </span>
            )}
          </div>

          {friends.length > visibleFriends.length && (
            <button
              type="button"
              onClick={() => setFriendsDialogOpen(true)}
              className="text-xs font-bold text-primary hover:underline"
            >
              Xem tất cả
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <UserPlus className="size-3.5 text-primary" />
                <h3 className="text-xs font-bold text-muted-foreground">
                  Lời mời kết bạn
                </h3>
              </div>
              {receivedList.length > visibleRequests.length && (
                <button
                  type="button"
                  onClick={() => setRequestsDialogOpen(true)}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Xem tất cả
                </button>
              )}
            </div>

            {loading && receivedList.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
                Đang tải lời mời...
              </p>
            ) : receivedList.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
                Chưa có lời mời kết bạn nào
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {visibleRequests.map((request) => {
                  const sender = request.from;
                  if (!sender) return null;

                  return (
                    <div
                      key={request._id}
                      className="flex items-center gap-3 rounded-xl border border-border/40 p-3"
                    >
                      <UserAvatar
                        type="chat"
                        name={sender.displayName || sender.username}
                        avatarURL={sender.avatarURL}
                        className="size-9"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {sender.displayName || sender.username}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          @{sender.username}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAccept(request)}
                          disabled={loading}
                        >
                          Chấp nhận
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecline(request)}
                          disabled={loading}
                        >
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-xs font-bold text-muted-foreground">
              Danh sách bạn bè
            </h3>

            {loading && friends.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Đang tải bạn bè...
              </p>
            ) : friends.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Chưa có bạn bè nào
              </p>
            ) : compact ? (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {visibleFriends.map((friend) => (
                  <div key={friend._id} className="flex w-16 shrink-0 flex-col items-center gap-1">
                    <Link to={`/profile/${friend.username}`}>
                      <UserAvatar
                        type="chat"
                        name={friend.displayName || friend.username}
                        avatarURL={friend.avatarURL}
                        className="size-12"
                      />
                    </Link>
                    <span className="max-w-16 truncate text-[11px] font-medium">
                      {friend.displayName || friend.username}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {visibleFriends.map((friend) => (
                  <div key={friend._id} className="flex items-center gap-3">
                    <Link to={`/profile/${friend.username}`} className="shrink-0">
                      <UserAvatar
                        type="chat"
                        name={friend.displayName || friend.username}
                        avatarURL={friend.avatarURL}
                        className="size-9"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/profile/${friend.username}`}
                        className="block truncate text-xs font-semibold hover:underline"
                      >
                        {friend.displayName || friend.username}
                      </Link>
                      <p className="truncate text-[10px] text-muted-foreground">
                        @{friend.username}
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      title="Nhắn tin"
                      onClick={() => handleMessage(friend)}
                    >
                      <MessageCircle className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <MyFriendsDialog
        open={friendsDialogOpen}
        setOpen={setFriendsDialogOpen}
        onMessageOpened={() => navigate("/chat")}
      />
      <FriendRequestDialog
        open={requestsDialogOpen}
        setOpen={setRequestsDialogOpen}
      />
    </>
  );
};

export default FeedFriendsPanel;
