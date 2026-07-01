"use client"

import * as React from "react"


import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {  Moon, Sun, Home } from "lucide-react"
import { Switch } from "../ui/switch"
import CreateNewChat from "../chat/CreateNewChat"
import NewGroupChatModel from "../chat/NewGroupChatModel"
import GroupChatList from "../chat/GroupChatList"
import AddFriendModel from "../chat/AddFriendModel"
import DirectMessageList from "../chat/DirectMessageList"
import { useThemeStore } from "@/stores/useThemeStore"
import { useAuthStore } from "@/stores/useAuthStore"
import { useChatStore } from "@/stores/useChatStore"
import ConversationSkeleton from "../skeleton/ConversationSkeleton"
import NotificationBell from "../notification/NotificationBell"
import StoryTray from "../story/StoryTray"
import { Link } from "react-router-dom"



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
const {user} = useAuthStore()
  const { isDarK, toggleTheme }= useThemeStore()
const {convoLoading} =useChatStore()
  return (
    <Sidebar variant="inset" {...props}>

      {/* header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              // asChild
              className="bg-gradient-primary"
            >

              <a href="#" className="w-full">
                <div className="flex w-full items-center px-2 justify-between ">
                  <h1 className="text-xl font-bold text-white">New Journey</h1>
                  <div className="flex items-center gap-2">
                    <NotificationBell />
                    <Sun className="size-4 text-white/80" />
                    <Switch
                      checked={isDarK}
                      onCheckedChange={toggleTheme}
                      className="data-[state=checked]:bg-background/80"
                    />
                    <Moon
                      className="size-4 text-white/85"
                    />
                  </div>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {/* content */}



      <SidebarContent className="beautiful-scollbar">
        {/* Back to Feed */}
        <SidebarGroup className="pb-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link to="/" />}>
                <Home className="size-4 text-primary" />
                <span className="font-bold text-primary">Quay lại Bảng tin</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Story Tray */}
        <StoryTray variant="sidebar" />

        {/* new chat */}
        <SidebarGroup>
          <SidebarGroupContent>
            <CreateNewChat />
          </SidebarGroupContent>
        </SidebarGroup>


        {/* group chat */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">Nhóm chat</SidebarGroupLabel>
          <SidebarGroupAction title="Tạo nhóm"
            className="cursor-pointer">
            <NewGroupChatModel />
          </SidebarGroupAction>

          <SidebarGroupContent>
            {convoLoading ? <ConversationSkeleton /> : <GroupChatList />}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* direct message */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">Bạn bè</SidebarGroupLabel>
          <SidebarGroupAction title="Kết bạn"
            className="cursor-pointer">
            <AddFriendModel />
          </SidebarGroupAction>

          <SidebarGroupContent>
            {convoLoading ? <ConversationSkeleton /> : <DirectMessageList />}

            {/* <DirectMessageList /> */}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* footer */}
      <SidebarFooter>
       {user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  )
}
