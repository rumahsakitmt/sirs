"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  LayoutDashboard, 
  FileText, 
  Building2, 
  Settings, 
  Users, 
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Rooms", href: "/rooms", icon: Building2, adminOnly: true },
  { name: "Templates", href: "/templates", icon: FileText, adminOnly: true },
  { name: "Users", href: "/users", icon: Users, adminOnly: true },
  { name: "Settings", href: "/settings", icon: Settings },
];

function Sidebar({ 
  user, 
  collapsed, 
  setCollapsed 
}: { 
  user: DashboardShellProps["user"];
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const filteredNav = navigation.filter(
    (item) => !item.adminOnly || user.role === "admin"
  );

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center h-16 px-4 border-b">
        {!collapsed && (
          <span className="text-xl font-bold truncate">SIRS</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("ml-auto", collapsed && "mx-auto")}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className={cn("flex items-center", collapsed && "justify-center")}>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.role}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          className={cn(
            "mt-2 w-full justify-start text-muted-foreground hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  );
}

function MobileSidebar({ user }: { user: DashboardShellProps["user"] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    setOpen(false);
    router.push("/login");
  };

  const filteredNav = navigation.filter(
    (item) => !item.adminOnly || user.role === "admin"
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-4 border-b">
            <span className="text-xl font-bold">SIRS</span>
          </div>

          <nav className="flex-1 py-4 space-y-1">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="ml-3">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="mt-2 w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar user={user} collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <MobileSidebar user={user} />
          <span className="ml-3 text-xl font-bold">SIRS</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header spacing for mobile */}
        <div className="md:hidden h-16" />
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
