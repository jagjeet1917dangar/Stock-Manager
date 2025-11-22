import { useEffect, useState } from "react";
import { Bell, Search, User, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiFetch } from "@/lib/api"; 

interface Product {
  _id: string;
  name: string;
  quantity: number;
  minStock: number;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export const AppHeader = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkStockLevels = async () => {
      try {
        // 1. Get User Settings for Global Threshold
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        // Use the global setting, or default to 10 if not found
        const globalThreshold = user?.lowStockThreshold ?? 10;

        // 2. Fetch Products
        const res = await apiFetch("http://localhost:5000/api/products");
        if (res.ok) {
          const products: Product[] = await res.json();
          const newNotifications: Notification[] = [];

          products.forEach(product => {
            // Determine the threshold to use. 
            // Currently prioritizing the Global User Setting for the "specific amount" logic.
            // You could also use Math.max(product.minStock, globalThreshold) if you wanted to respect both.
            const threshold = globalThreshold;

            if (product.quantity === 0) {
              newNotifications.push({
                id: `out-${product._id}`,
                title: "Out of Stock",
                description: `${product.name} has 0 quantity!`,
                time: "Just now",
                read: false
              });
            } else if (product.quantity <= threshold) {
              newNotifications.push({
                id: `low-${product._id}`,
                title: "Low Stock Alert",
                description: `${product.name} is low (below ${threshold})`,
                time: "Just now",
                read: false
              });
            }
          });

          setNotifications(newNotifications);
          setUnreadCount(newNotifications.length);
        }
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    // Run immediately and then every 60 seconds
    checkStockLevels();
    const interval = setInterval(checkStockLevels, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = () => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shadow-soft sticky top-0 z-20">
      <div className="flex items-center space-x-4 flex-1">
        <SidebarTrigger />
        <div className="relative max-w-md flex-1 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products, SKU..."
            className="pl-9 bg-background"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-card" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h4 className="font-semibold text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" onClick={markAllRead}>
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 ${!notification.read ? 'bg-muted/20' : ''}`}
                    >
                      <div className={`p-2 rounded-full shrink-0 ${
                        notification.title === "Out of Stock" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                      }`}>
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.description}</p>
                        <p className="text-[10px] text-muted-foreground/70">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem>Team Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              localStorage.removeItem("user");
              navigate("/");
            }}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};