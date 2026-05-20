"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  return (
    <SidebarGroup className="sidebar-group-compact">
      <SidebarMenu className="sidebar-menu-compact">
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible sidebar-collapsible-compact"
          >
            <SidebarMenuItem className="sidebar-menu-item-compact">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title} className="sidebar-menu-button-compact">
                  {item.icon && <item.icon className="sidebar-icon-compact" />}
                  <span className="sidebar-label-compact">{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 sidebar-chevron-compact" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="sidebar-submenu-compact">
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title} className="sidebar-submenu-item-compact">
                      <SidebarMenuSubButton asChild className="sidebar-submenu-button-compact">
                        <a href={subItem.url}>
                          <span>{subItem.title}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>

  )
}
