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
  ChevronDown,
  LogOut,
} from "lucide-react";
import { Link, useLocation, Navigate } from "react-router";
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
import { useLogout } from "@/features/auth";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FullPageSpinner } from "@/components/FullPageSpinner";

const managerItems = {
  respondItems: [
    { label: "Overview", href: "/manager/overview", icon: LayoutGrid },
    { label: "Incidents", href: "/manager/incidents", icon: AlertTriangle },
    { label: "Delivery log", href: "/manager/delivery-log", icon: Send },
  ],
  orgItems: [
    { label: "Teams", href: "/manager/teams", icon: Users },
    { label: "Engineers", href: "/manager/engineers", icon: UserSquare2 },
    {
      label: "Unavailabilities",
      href: "/manager/unavailabilities",
      icon: CalendarOff,
    },
  ],
  setupItems: [
    { label: "Integrations", href: "/manager/integrations", icon: Plug },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
};

const engineerItems = {
  respondItems: [
    { label: "Incidents", href: "/engineer/incidents", icon: AlertTriangle },
  ],
  orgItems: [
    { label: "My Team", href: "/engineer/my-team", icon: Users },
    {
      label: "My Unavailabilities",
      href: "/engineer/my-unavailabilities",
      icon: CalendarOff,
    },
  ],
  setupItems: [{ label: "Settings", href: "/settings", icon: Settings }],
};

const groupLabelClass =
  "px-2 text-xs font-bold tracking-wider text-sidebar-foreground/50";

const navButtonClass = (active: boolean) =>
  cn(
    "gap-2.5 rounded-lg text-sm font-medium",
    active
      ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
  );

export function AppSidebar() {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const { mutate: logout, isPending } = useLogout();

  if (isLoading) {
    return <FullPageSpinner />;
  } else if (!user) {
    return <Navigate to="/login" replace />;
  }

  const items = user.role === Role.SRE ? managerItems : engineerItems;
  const userFullName = user.firstName + " " + user.lastName;

  const groups = [
    { label: "RESPOND", items: items.respondItems },
    { label: "ORG", items: items.orgItems },
    { label: "SETUP", items: items.setupItems },
  ];

  return (
    <Sidebar className="border-sidebar-border" collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between p-4 group-data-[collapsible=icon]:justify-center">
        <div className="flex flex-row items-center group-data-[collapsible=icon]:hidden">
          <img src="/icon.svg" alt="icon" className="w-8" />
        </div>
        <SidebarTrigger className="z-50 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
      </SidebarHeader>

      <SidebarContent className="gap-6 px-2 hidden md:block">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="space-y-0.5">
            <SidebarGroupLabel className={groupLabelClass}>
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      className={navButtonClass(
                        location.pathname.includes(item.href)
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
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-2 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="group text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                {user.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left group-data-[collapsible=icon]:hidden">
              {userFullName.length > 20 ? (
                <Tooltip>
                  <TooltipTrigger
                    render={<p className="text-sm font-medium" />}
                  >
                    {userFullName.substring(0, 20)}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{userFullName}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <p className="text-sm font-medium">{userFullName}</p>
              )}
              <p className="text-xs text-sidebar-foreground/60">{user.role}</p>
            </div>
            <ChevronDown className="transition-all duration-300 group-aria-expanded:rotate-180" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="px-2.5">
            <DropdownMenuGroup className="py-2">
              <DropdownMenuLabel>
                <p className="text-sm font-medium text-foreground">
                  {userFullName}
                </p>
                <p>{user.email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="py-2">
              <DropdownMenuItem
                className="cursor-pointer"
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
                disabled={isPending}
                onClick={() => logout()}
              >
                <LogOut />
                {isPending ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
