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
import {  Moon, Sun } from "lucide-react"
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
                  <h1 className="text-xl font-bold text-white">Phuc Chat</h1>
                  <div className="flex items-center gap-2">
                    <Sun className="size-4 text-white/80" />
                    <Switch
                      checked={isDarK}
                      onCheckedChange={toggleTheme}
                      className="data-[state=checked]:bg-background/80"
                    />
                    <Moon
                      className="size-4 text-white/80"
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
        {/* new chat */}
        <SidebarGroup>
          <SidebarGroupContent>
            <CreateNewChat />
          </SidebarGroupContent>
        </SidebarGroup>


        {/* group chat */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase"> Nhom chat</SidebarGroupLabel>
          <SidebarGroupAction title="Tao nhom"
            className="cursor-pointer">
            <NewGroupChatModel />
          </SidebarGroupAction>

          <SidebarGroupContent>
            {convoLoading ? <ConversationSkeleton /> : <GroupChatList />}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* direct message */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">Ban be</SidebarGroupLabel>
          <SidebarGroupAction title="Ket ban"
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
