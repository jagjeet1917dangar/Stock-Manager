import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { PackageOpen, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Product {
  _id: string;
  name: string;
  quantity: number;
}

interface Adjustment {
  _id: string;
  reason: string;
  date: string;
  items: { name: string; quantity: number }[];
}

const Adjustments = () => {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [reason, setReason] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState(0);

  // 1. Fetch Data
  const fetchData = async () => {
    try {
      const [adjRes, prodRes] = await Promise.all([
        fetch("http://localhost:5000/api/adjustments"),
        fetch("http://localhost:5000/api/products")
      ]);
      if (adjRes.ok) setAdjustments(await adjRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Handle Submit
  const handleSubmit = async () => {
    if (!reason || !selectedProduct || qty === 0) {
      toast.error("Please fill all fields (Quantity cannot be 0)");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          items: [{ productId: selectedProduct, quantity: qty }]
        }),
      });

      if (res.ok) {
        toast.success("Adjustment applied!");
        setIsOpen(false);
        setReason("");
        setQty(0);
        setSelectedProduct("");
        fetchData(); // Refresh list
      } else {
        toast.error("Failed to apply adjustment");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stock Adjustments</h1>
          <p className="text-muted-foreground mt-1">Correct inventory levels manually</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-soft">
              <Plus className="h-4 w-4 mr-2" /> New Adjustment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Make Stock Adjustment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input 
                  placeholder="e.g. Damaged during shipping, Annual Audit" 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product to adjust" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name} (Current: {p.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Adjustment Quantity</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    placeholder="-1 or 5" 
                    value={qty} 
                    onChange={(e) => setQty(Number(e.target.value))} 
                  />
                  <span className="text-xs text-muted-foreground w-32">
                    (Use negative for loss, positive for gain)
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Adjustment History</CardTitle>
          <CardDescription>Recent manual stock corrections</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No adjustments recorded.
                  </TableCell>
                </TableRow>
              ) : (
                adjustments.map((adj) => (
                  <TableRow key={adj._id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(adj.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{adj.reason}</TableCell>
                    <TableCell>{adj.items.map(i => i.name).join(", ")}</TableCell>
                    <TableCell className={`text-right font-semibold ${adj.items[0]?.quantity < 0 ? "text-destructive" : "text-success"}`}>
                      {adj.items[0]?.quantity > 0 ? "+" : ""}{adj.items[0]?.quantity}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Adjustments;