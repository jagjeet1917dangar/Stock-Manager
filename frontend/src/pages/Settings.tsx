import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and warehouse settings</p>
      </div>

      {/* Profile Settings */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue="John" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue="Doe" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="john.doe@company.com" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Warehouse Settings */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Warehouse Configuration</CardTitle>
          <CardDescription>Manage warehouse locations and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="warehouse">Default Warehouse</Label>
            <Input id="warehouse" defaultValue="Warehouse A - Main Storage" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Default Location</Label>
            <Input id="location" defaultValue="WH-A/SHELF-01/BIN-05" />
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="font-semibold">Low Stock Threshold</h4>
            <p className="text-sm text-muted-foreground">Set the default minimum stock level for alerts</p>
            <Input type="number" defaultValue="10" />
          </div>
          <Button>Update Settings</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure alert preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Low Stock Alerts</h4>
              <p className="text-sm text-muted-foreground">Receive notifications when products are low</p>
            </div>
            <Button variant="outline">Enabled</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Email Reports</h4>
              <p className="text-sm text-muted-foreground">Daily inventory summary via email</p>
            </div>
            <Button variant="outline">Enabled</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
