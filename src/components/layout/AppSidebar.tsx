import {
  LayoutDashboard, Users, FileCheck, Receipt, ListTodo,
  Newspaper, Link2, Bell, BarChart3, Globe, MessageSquarePlus,
  ClipboardList, Timer, CreditCard, Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserButton } from "@clerk/clerk-react";
import { useAuth } from "@/contexts/AuthContext";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Deliverables", url: "/deliverables", icon: FileCheck },
  { title: "Invoices", url: "/invoices", icon: Receipt },
  { title: "Tasks", url: "/tasks", icon: ListTodo },
];

const moduleNavItems = [
  { title: "Content Pipeline", url: "/content", icon: Newspaper },
  { title: "Content Requests", url: "/content-requests", icon: MessageSquarePlus },
  { title: "Client Reports", url: "/client-reports", icon: ClipboardList },
  { title: "GHL Sync", url: "/ghl-sync", icon: Link2 },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Client Portal", url: "/portal-admin", icon: Globe },
];

const settingsNavItems = [
  { title: "SLA Definitions", url: "/settings/sla", icon: Timer },
  { title: "Retainer Tiers", url: "/settings/retainer", icon: CreditCard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { profile } = useAuth();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-display font-bold text-sm">O</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display font-bold text-sm leading-tight">ONNIFY WORKS</h1>
              <p className="text-xs text-sidebar-foreground/60">Operations Hub</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs text-sidebar-foreground/40 uppercase tracking-wider px-3">Modules</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {moduleNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs text-sidebar-foreground/40 uppercase tracking-wider px-3">Settings</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-3">
        <div className="flex items-center gap-2 px-1">
          <UserButton
            afterSignOutUrl="/login"
            appearance={{
              elements: {
                avatarBox: "h-7 w-7",
              },
            }}
          />
          {!collapsed && profile && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{profile.fullName}</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">{profile.role}</p>
            </div>
          )}
        </div>
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
