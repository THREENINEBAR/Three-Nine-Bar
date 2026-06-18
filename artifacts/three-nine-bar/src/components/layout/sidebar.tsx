import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { 
  LayoutDashboard, 
  Package, 
  Wine, 
  BookOpen, 
  ShoppingCart, 
  Trash2, 
  ClipboardList, 
  FileText, 
  Users, 
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard, adminOnly: true },
  { title: "Data Bahan", href: "/ingredients", icon: Package, adminOnly: true },
  { title: "Data Product", href: "/products", icon: Wine, adminOnly: true },
  { title: "Data Resep", href: "/recipes", icon: BookOpen, adminOnly: true },
  { title: "Product Sale", href: "/sales", icon: ShoppingCart },
  { title: "Wasting", href: "/wasting", icon: Trash2 },
  { title: "Stock Opname", href: "/stock-opname", icon: ClipboardList },
  { title: "Laporan", href: "/reports", icon: FileText, adminOnly: true },
  { title: "User Management", href: "/users", icon: Users, adminOnly: true },
];

export function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const logout = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        window.location.href = "/login";
      }
    });
  };

  const filteredItems = navItems.filter(item => {
    if (item.adminOnly && user?.role !== 'admin') return false;
    return true;
  });

  return (
    <div className={`flex h-full flex-col bg-sidebar border-r border-sidebar-border ${className}`}>
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-wider text-primary">THREE NINE</h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Inventory System</p>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1 py-2">
          {filteredItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer
                    ${isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {item.title}
                </div>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none text-foreground">{user?.name || user?.username}</span>
            <span className="text-xs text-muted-foreground mt-1 capitalize">{user?.role}</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-primary">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 border-r-sidebar-border bg-sidebar">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
