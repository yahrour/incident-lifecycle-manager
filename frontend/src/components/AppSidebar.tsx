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
  SidebarTrigger,
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
  Calendar,
  Home,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Role } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

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
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <p>Loading...</p>;
  } else if (!user) {
    return <p>Unauthorized</p>;
  }

  const items = user.role === Role.SRE ? managerItems : engineerItems;

  return (
    <Sidebar className="border-none bg-primary" collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between p-4 group-data-[collapsible=icon]:justify-center">
        <div className="flex flex-row items-center group-data-[collapsible=icon]:hidden">
          <img src="/icon.svg" alt="icon" className="w-8" />
        </div>
        <SidebarTrigger className="z-50 hover:bg-transparent hover:text-white" />
      </SidebarHeader>

      <SidebarContent className="gap-6 px-2">
        <SidebarGroup className="space-y-2">
          <SidebarGroupLabel className="px-2 text-xs text-muted/50 font-bold tracking-wider">
            RESPOND
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {items.respondItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    className={cn(
                      "text-sm gap-2.5 rounded-lg font-medium",
                      location.pathname === item.href
                        ? "bg-secondary text-white hover:bg-secondary"
                        : "text-muted/70"
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

        <SidebarGroup className="space-y-0.5">
          <SidebarGroupLabel className="px-2 text-xs text-muted/50 font-bold tracking-wider">
            ORG
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.orgItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    className={cn(
                      "text-sm gap-2.5 rounded-lg font-medium",
                      location.pathname === item.href
                        ? "bg-secondary text-white hover:bg-secondary"
                        : "text-muted/70"
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

        <SidebarGroup className="space-y-0.5">
          <SidebarGroupLabel className="px-2 text-xs text-muted/50 font-bold tracking-wider">
            SETUP
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.setupItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    className={cn(
                      "text-sm gap-2.5 rounded-lg font-medium",
                      location.pathname === item.href
                        ? "bg-secondary text-white hover:bg-secondary"
                        : "text-muted/70"
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
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="group hover:bg-transparent aria-expanded:bg-transparent hover:text-white aria-expanded:text-white"
              />
            }
          >
            <div className="relative">
              <Avatar className="h-8 w-8 bg-purple-400 text-white">
                <AvatarFallback className="bg-purple-400 text-xs text-white">
                  {user.firstName.charAt(0) + user.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 text-left group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium text-[#e8ddd3]">
                {user.firstName + " " + user.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
            <ChevronDown className="group-aria-expanded:rotate-180 transition-all duration-300" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="px-2.5">
            <DropdownMenuGroup className="py-2">
              <DropdownMenuLabel>
                <p className="text-sm font-medium text-foreground">
                  {user.firstName + " " + user.lastName}
                </p>
                <p>{user.email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="py-2">
              <DropdownMenuItem
                className="cursor-pointer hover:bg-muted-foreground/10!"
                render={<Link to={"/settings"} />}
              >
                <Settings />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="py-2">
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
              >
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
