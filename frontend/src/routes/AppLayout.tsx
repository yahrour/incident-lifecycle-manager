import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppLayout() {
  return (
    <SidebarProvider>
      <SidebarTrigger />
      <AppSidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
