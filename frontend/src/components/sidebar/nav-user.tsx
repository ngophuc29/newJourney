"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { User } from "@/types/User"
import { ChevronsUpDownIcon, BellIcon, UserIcon, UsersIcon } from "lucide-react"
import Logout from "../auth/Logout"
import { useState } from "react"
import FriendRequestDialog from "../friendRequest/FriendRequestDialog"
import ProfileDialog from "../profile/ProfileDialog"
import MyFriendsDialog from "../friends/MyFriendsDialog"
import NotificationDialog from "../notification/NotificationDialog"
import { useNotificationStore } from "@/stores/useNotificationStore"
import { useEffect } from "react"

export function NavUser({
  user,
}: {
  user: User
}) {
  const { isMobile } = useSidebar()
  const [friendRequestOpen, setfriendRequestOpen] = useState(false);
  const [profileOpen, setprofileOpen] = useState(false);
  const [myFriendsOpen, setMyFriendsOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  
  const { notifications, fetchNotifications } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    fetchNotifications();
  }, []);
  return (

    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
              }
            >
              <Avatar>
                <AvatarImage src={user.avatarURL} alt={user.displayName} />
                <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.displayName}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar>
                      <AvatarImage src={user.avatarURL} alt={user.displayName} />
                      <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.displayName}</span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />

              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                onClick={()=>setprofileOpen(true)}
                >
                  <UserIcon className="text-muted-foreground dark:group-focus:!text-accent-foreground"
                  />
                  Tai khoan
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setMyFriendsOpen(true)}
                >
                  <UsersIcon className="text-muted-foreground dark:group-focus:!text-accent-foreground" />
                  Ban be cua toi
                </DropdownMenuItem>
                 <DropdownMenuItem
                  onClick={() => setNotificationOpen(true)}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    <BellIcon className="text-muted-foreground dark:group-focus:!text-accent-foreground" />
                    Thông báo
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                      {unreadCount}
                    </span>
                  )}
                </DropdownMenuItem>

              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" variant="destructive">
                <Logout
                />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <FriendRequestDialog
      
        open={friendRequestOpen}
        setOpen={setfriendRequestOpen}
      
      />

      <ProfileDialog
        open={profileOpen}
        setOpen={setprofileOpen}
      />

      <MyFriendsDialog
        open={myFriendsOpen}
        setOpen={setMyFriendsOpen}
      />

      <NotificationDialog
        open={notificationOpen}
        setOpen={setNotificationOpen}
      />


    </>
  )
}
