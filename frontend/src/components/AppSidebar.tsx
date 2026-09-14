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
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutGrid,
  AlertTriangle,
  Send,
  Users,
  UserSquare2,
  CalendarOff,
  Plug,
  Settings,
  ChevronDown,
  Calendar,
  Home,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const managerItems = {
  respondItems: [
    { label: "Overview", href: "/manager/overview", icon: LayoutGrid },
    { label: "Incidents", href: "/manager/incidents", icon: AlertTriangle },
    { label: "Delivery log", href: "/manager/delivery-log", icon: Send },
  ],
  orgItems: [
    { label: "Teams", href: "/manager/teams", icon: Users },
    { label: "Engineers", href: "/manager/engineers", icon: UserSquare2 },
    { label: "Availability", href: "/manager/availability", icon: Calendar },
    { label: "Time Off", href: "/manager/time-off", icon: CalendarOff },
  ],
  setupItems: [
    { label: "Integrations", href: "/manager/integrations", icon: Plug },
    { label: "Settings", href: "/manager/settings", icon: Settings },
  ],
};

const engineerItems = {
  respondItems: [
    { label: "My shift", href: "/engineer/my-shift", icon: Home },
    { label: "Incidents", href: "/engineer/incidents", icon: AlertTriangle },
    { label: "Delivery log", href: "/engineer/delivery-log", icon: Send },
  ],
  orgItems: [
    { label: "Team", href: "/engineer/team", icon: Users },
    { label: "Time Off", href: "/engineer/time-off", icon: CalendarOff },
  ],
  setupItems: [
    { label: "Settings", href: "/engineer/settings", icon: Settings },
  ],
};

export function AppSidebar() {
  const location = useLocation();

  const user = {
    id: "#1",
    name: "Tobi",
    email: "tobi@acme.com",
    role: "manager" as Role,
    team: "Acme Cloud",
  };

  const items = user.role === "manager" ? managerItems : engineerItems;

  return (
    <Sidebar className="border-none bg-primary text-[#e8ddd3]">
      <SidebarHeader className="flex flex-row items-center p-4">
        <img src="/icon.svg" alt="icon" className="w-8" />
        <span className="text-xs font-semibold uppercase">
          better incidents
        </span>
      </SidebarHeader>

      <SidebarContent className="gap-6 px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] font-medium tracking-wider">
            RESPOND
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.respondItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    className={cn(
                      "gap-2.5 rounded-lg font-medium",
                      location.pathname === item.href
                        ? "bg-secondary text-white hover:bg-secondary"
                        : "text-[#e8ddd3]"
                    )}
                    render={
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] font-medium tracking-wider">
            ORG
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.orgItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    className={cn(
                      "gap-2.5 rounded-lg font-medium",
                      location.pathname === item.href
                        ? "bg-secondary text-white hover:bg-secondary"
                        : "text-[#e8ddd3]"
                    )}
                    render={
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] font-medium tracking-wider">
            SETUP
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.setupItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    className={cn(
                      "gap-2.5 rounded-lg font-medium",
                      location.pathname === item.href
                        ? "bg-secondary text-white hover:bg-secondary"
                        : "text-[#e8ddd3]"
                    )}
                    render={
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 px-2 py-3">
        <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5">
          <div className="relative">
            <Avatar className="h-8 w-8 bg-purple-400 text-white">
              <AvatarFallback className="bg-purple-400 text-xs text-white">
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") ?? "?"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-[#e8ddd3]">
              {user?.name ?? "Unknown"}
            </p>
            <p className="text-xs text-[#8a7a6d]">
              {user?.role === "manager" ? "Manager" : "Engineer"} · Acme Cloud
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-[#8a7a6d]" />
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
