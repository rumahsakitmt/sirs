import * as React from "react";

import { SearchForm } from "@/components/search-form";
import { VersionSwitcher } from "@/components/version-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  BarChart3,
  Home,
} from "lucide-react";
import Link from "next/link";

const data = {
  versions: ["1.0.0"],
  navMain: [
    {
      title: "Menu Utama",
      url: "#",
      items: [
        {
          title: "Dasbor",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Laporan",
          url: "/dashboard/reports",
          icon: FileText,
        },
        {
          title: "Lihat Laporan",
          url: "/dashboard/reports/viewer",
          icon: BarChart3,
        },
      ],
    },
    {
      title: "Manajemen",
      url: "#",
      items: [
        {
          title: "Ruangan",
          url: "/dashboard/rooms",
          icon: Building2,
        },
        {
          title: "Template",
          url: "/dashboard/templates",
          icon: FileText,
        },
        {
          title: "Pengguna",
          url: "/dashboard/users",
          icon: Users,
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props} className="border-none bg-background">
      <SidebarHeader className="bg-background">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="text-primary">
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium text-2xl font-serif">SIRS</span>
                  <span className="text-muted-foreground">
                    Sistem Informasi Rumah Sakit
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-background">
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        {item.icon && <item.icon className="size-4" />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="bg-background">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <Home className="size-4" />
                <span>Beranda</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
