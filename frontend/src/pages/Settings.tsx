import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save, User, Warehouse, Bell } from "lucide-react";

const Settings = () => {
  // User state now includes settings fields
  const [user, setUser] = useState({ 
    id: "", 
    name: "", 
    email: "", 
    warehouseName: "", 
    lowStockThreshold: 10 
  });
  const [loading, setLoading] = useState(false);
  
  // Local state for form inputs (initialized from user state)
  const [warehouseName, setWarehouseName] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [notifications, setNotifications] = useState(true);

  // Load User from LocalStorage on Mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Initialize local state with user data
      setWarehouseName(parsedUser.warehouseName || "");
      setLowStockThreshold(parsedUser.lowStockThreshold || 10);
    }
  }, []);

  // Handle Profile Update (Name, Email, Password)
  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch(`http://localhost:5000/api/user/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          email, 
          password: password || undefined,
          // Preserve existing settings if not being updated here
          warehouseName: user.warehouseName,
          lowStockThreshold: user.lowStockThreshold
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Profile updated!");
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Handle Preferences Update (Warehouse, Threshold)
  const handlePreferencesUpdate = async () => {
    setLoading(true);
    try {
      // Send updates to backend
      const res = await fetch(`http://localhost:5000/api/user/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          // Preserve existing profile info
          name: user.name,
          email: user.email,
          // Update settings
          warehouseName,
          lowStockThreshold
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Preferences saved to account!");
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        toast.error(data.message || "Failed to save preferences");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and system preferences</p>
      </div>

      {/* Profile Settings */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Profile Settings</CardTitle>
          </div>
          <CardDescription>Update your personal information and security</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Key forces re-render when user data loads */}
          <form key={user.id} onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" defaultValue={user.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={user.email} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password (Optional)</Label>
              <Input id="password" name="password" type="password" placeholder="Leave blank to keep current" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Warehouse Settings */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-accent" />
            <CardTitle>Warehouse Configuration</CardTitle>
          </div>
          <CardDescription>Manage default locations and inventory rules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="warehouse">Default Warehouse Name</Label>
            <Input 
              id="warehouse" 
              value={warehouseName} 
              onChange={(e) => setWarehouseName(e.target.value)} 
              placeholder="e.g. Main Warehouse"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="threshold">Global Low Stock Alert Threshold</Label>
            <div className="flex items-center gap-4">
              <Input 
                id="threshold" 
                type="number" 
                value={lowStockThreshold} 
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-32" 
              />
              <span className="text-sm text-muted-foreground">units</span>
            </div>
            <p className="text-xs text-muted-foreground">Products below this quantity will be flagged as "Low Stock".</p>
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={handlePreferencesUpdate} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Update Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-warning" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Configure system alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Low Stock Alerts</h4>
              <p className="text-sm text-muted-foreground">Receive notifications when products fall below threshold</p>
            </div>
            <Switch 
              checked={notifications} 
              onCheckedChange={setNotifications} 
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Email Reports</h4>
              <p className="text-sm text-muted-foreground">Receive daily inventory summary via email</p>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;