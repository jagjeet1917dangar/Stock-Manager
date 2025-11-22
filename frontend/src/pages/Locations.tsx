import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Trash2, Warehouse, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface Location {
  _id: string;
  name: string;
  type: 'internal' | 'supplier' | 'customer' | 'loss';
  address: string;
  isDefault: boolean;
}

const Locations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchLocations = async () => {
    try {
      const res = await apiFetch("http://localhost:5000/api/locations");
      if (res.ok) {
        setLocations(await res.json());
      }
    } catch (error) {
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await apiFetch("http://localhost:5000/api/locations", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          type: formData.get("type"),
          address: formData.get("address"),
          isDefault: false // Default logic can be added later
        }),
      });

      if (res.ok) {
        toast.success("Location added!");
        setIsDialogOpen(false);
        fetchLocations();
      } else {
        toast.error("Failed to add location");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this location?")) return;
    try {
      const res = await apiFetch(`http://localhost:5000/api/locations/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted");
        fetchLocations();
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'internal': return "default";
      case 'supplier': return "secondary";
      case 'customer': return "outline";
      case 'loss': return "destructive";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Locations</h1>
          <p className="text-muted-foreground mt-1">Manage warehouses, racks, and zones</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-soft">
              <Plus className="h-4 w-4 mr-2" /> Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>Create a warehouse, shelf, or partner location.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Location Name</Label>
                <Input name="name" placeholder="e.g. West Wing Rack B" required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select name="type" defaultValue="internal">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal (Warehouse/Rack)</SelectItem>
                    <SelectItem value="supplier">Supplier (Vendor)</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="loss">Inventory Loss/Scrap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Address / Notes (Optional)</Label>
                <Input name="address" placeholder="Physical address or description" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {locations.map((loc) => (
          <Card key={loc._id} className="shadow-soft hover:shadow-medium transition-smooth">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{loc.name}</CardTitle>
                </div>
                <Badge variant={getTypeColor(loc.type) as any}>{loc.type}</Badge>
              </div>
              <CardDescription>{loc.address || "No address provided"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">ID: ...{loc._id.slice(-6)}</span>
                {!loc.isDefault && (
                  <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDelete(loc._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Locations;