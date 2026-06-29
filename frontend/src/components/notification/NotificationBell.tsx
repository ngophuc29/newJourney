import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { Button } from "../ui/button";
import NotificationDialog from "./NotificationDialog";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { notifications, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="relative hover:bg-white/10 text-white hover:text-white shrink-0"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </Button>

      <NotificationDialog open={open} setOpen={setOpen} />
    </>
  );
};

export default NotificationBell;
