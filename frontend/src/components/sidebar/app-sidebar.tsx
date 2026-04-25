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
import { Group, Moon, Sun } from "lucide-react"
import { Switch } from "../ui/switch"
import CreateNewChat from "../chat/CreateNewChat"
import NewGroupChatModel from "../chat/NewGroupChatModel"
import GroupChatList from "../chat/GroupChatList"
import AddFriendModel from "../chat/AddFriendModel"
import DirectMessageList from "../chat/DirectMessageList"
import { useThemeStore } from "@/stores/useThemeStore"



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const { isDarK, toggleTheme }= useThemeStore()

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



      <SidebarContent>
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
            <GroupChatList />
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
            <DirectMessageList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* footer */}
      <SidebarFooter>
        {/* <NavUser user={data.user} /> */}
      </SidebarFooter>
    </Sidebar>
  )
}
