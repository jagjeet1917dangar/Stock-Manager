import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RefreshCw, 
  PackageOpen, 
  Plus, 
  Check, 
  Loader2, 
  Trash2,
  MapPin
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api"; // <--- Use helper

// ... (Types same as before)
interface Product {
  _id: string;
  name: string;
  quantity: number;
}

interface OperationItem {
  productId: string;
  quantity: number;
  name: string;
}

interface Operation {
  _id: string;
  type: 'receipt' | 'delivery' | 'transfer' | 'adjustment';
  supplier?: string;
  customer?: string;
  fromLocation?: string;
  toLocation?: string;
  reason?: string;
  items: OperationItem[];
  status?: 'draft' | 'done';
  date: string;
}

const Operations = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("receipts"); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [partyName, setPartyName] = useState(""); 
  const [locFrom, setLocFrom] = useState(""); 
  const [locTo, setLocTo] = useState("");     
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState(1);
  const [orderItems, setOrderItems] = useState<OperationItem[]>([]);

  const fetchData = async () => {
    try {
      // Replace fetches with apiFetch
      const [prodRes, rcptRes, delRes, trfRes, adjRes] = await Promise.all([
        apiFetch("http://localhost:5000/api/products"),
        apiFetch("http://localhost:5000/api/receipts"),
        apiFetch("http://localhost:5000/api/deliveries"),
        apiFetch("http://localhost:5000/api/transfers"),
        apiFetch("http://localhost:5000/api/adjustments")
      ]);

      if (prodRes.ok) setProducts(await prodRes.json());
      
      const allOps: Operation[] = [];
      if (rcptRes.ok) allOps.push(...(await rcptRes.json()).map((i: any) => ({ ...i, type: 'receipt' })));
      if (delRes.ok) allOps.push(...(await delRes.json()).map((i: any) => ({ ...i, type: 'delivery' })));
      if (trfRes.ok) allOps.push(...(await trfRes.json()).map((i: any) => ({ ...i, type: 'transfer' })));
      if (adjRes.ok) allOps.push(...(await adjRes.json()).map((i: any) => ({ ...i, type: 'adjustment' })));

      setOperations(allOps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    } catch (error) {
      console.error(error);
      toast.error("Failed to load operations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ... (addItem and removeItem Logic remains same)
  const addItem = () => {
    if (!selectedProduct || qty === 0) return;
    const prod = products.find(p => p._id === selectedProduct);
    if (!prod) return;
    
    setOrderItems([...orderItems, { productId: selectedProduct, quantity: qty, name: prod.name }]);
    setSelectedProduct("");
    setQty(1);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (orderItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    setIsSubmitting(true);
    let endpoint = "";
    let body: any = { items: orderItems };

    switch (activeTab) {
      case "receipts":
        endpoint = "/api/receipts";
        body.supplier = partyName;
        body.status = 'draft';
        break;
      case "deliveries":
        endpoint = "/api/deliveries";
        body.customer = partyName;
        body.status = 'draft';
        break;
      case "transfers":
        endpoint = "/api/transfers";
        body.fromLocation = locFrom;
        body.toLocation = locTo;
        body.status = 'draft';
        break;
      case "adjustments":
        endpoint = "/api/adjustments";
        body.reason = partyName;
        break;
    }

    try {
      // Updated to use apiFetch
      const res = await apiFetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Operation created successfully!");
        setIsDialogOpen(false);
        setPartyName(""); 
        setLocFrom(""); 
        setLocTo(""); 
        setOrderItems([]);
        fetchData();
      } else {
        const d = await res.json();
        toast.error(d.message || "Failed");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidate = async (id: string, type: string) => {
    if (!confirm("Validate this operation? Stock will be updated.")) return;
    
    let endpoint = "";
    if (type === 'receipt') endpoint = "/api/receipts";
    if (type === 'delivery') endpoint = "/api/deliveries";
    if (type === 'transfer') endpoint = "/api/transfers";

    try {
      // Updated to use apiFetch
      const res = await apiFetch(`http://localhost:5000${endpoint}/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "done" }),
      });

      if (res.ok) {
        toast.success("Validated!");
        fetchData();
      } else {
        const d = await res.json();
        toast.error(d.message || "Validation failed");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  // ... (UI Helpers and Return JSX remain the same)
  const filteredOps = operations.filter(op => {
    if (activeTab === 'receipts') return op.type === 'receipt';
    if (activeTab === 'deliveries') return op.type === 'delivery';
    if (activeTab === 'transfers') return op.type === 'transfer';
    if (activeTab === 'adjustments') return op.type === 'adjustment';
    return true;
  });

  const getIcon = (type: string) => {
    if (type === 'receipt') return <ArrowDownToLine className="h-4 w-4 text-accent"/>;
    if (type === 'delivery') return <ArrowUpFromLine className="h-4 w-4 text-destructive"/>;
    if (type === 'transfer') return <RefreshCw className="h-4 w-4 text-warning"/>;
    return <PackageOpen className="h-4 w-4 text-primary"/>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Operations</h1>
          <p className="text-muted-foreground mt-1">Manage all inventory movements</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-soft">
              <Plus className="h-4 w-4 mr-2" /> 
              New {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="capitalize">Create {activeTab.slice(0, -1)}</DialogTitle>
              <DialogDescription>Enter details for this operation.</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {activeTab === 'receipts' && (
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Input placeholder="Supplier Name" value={partyName} onChange={(e) => setPartyName(e.target.value)} />
                </div>
              )}
              {activeTab === 'deliveries' && (
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Input placeholder="Customer Name" value={partyName} onChange={(e) => setPartyName(e.target.value)} />
                </div>
              )}
              {activeTab === 'adjustments' && (
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Input placeholder="e.g. Damaged Goods" value={partyName} onChange={(e) => setPartyName(e.target.value)} />
                </div>
              )}
              {activeTab === 'transfers' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Warehouse A" value={locFrom} onChange={(e) => setLocFrom(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>To Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Warehouse B" value={locTo} onChange={(e) => setLocTo(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 items-end border-t pt-4 mt-4">
                <div className="flex-1 space-y-2">
                  <Label>Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => <SelectItem key={p._id} value={p._id}>{p.name} (Stock: {p.quantity})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-2">
                  <Label>Qty</Label>
                  <Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
                </div>
                <Button variant="secondary" onClick={addItem}>Add</Button>
              </div>

              <div className="border rounded-md p-2 max-h-40 overflow-y-auto bg-muted/20">
                {orderItems.length === 0 && <p className="text-sm text-center text-muted-foreground py-2">No items added</p>}
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm py-1 border-b last:border-0">
                    <span>{item.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">x{item.quantity}</Badge>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
        </TabsList>

        {["receipts", "deliveries", "transfers", "adjustments"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {filteredOps.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No records found for {tab}.</p>
            ) : (
              filteredOps.map((op) => (
                <Card key={op._id} className="shadow-soft hover:shadow-medium transition-smooth">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getIcon(op.type)}
                          {op.type === 'receipt' && op.supplier}
                          {op.type === 'delivery' && op.customer}
                          {op.type === 'adjustment' && op.reason}
                          {op.type === 'transfer' && `${op.fromLocation} → ${op.toLocation}`}
                        </CardTitle>
                        <CardDescription>{new Date(op.date).toLocaleDateString()}</CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {op.type !== 'adjustment' && (
                          <Badge variant={op.status === 'done' ? 'default' : 'secondary'}>
                            {op.status?.toUpperCase()}
                          </Badge>
                        )}
                        
                        {op.status === 'draft' && op.type !== 'adjustment' && (
                          <Button size="sm" onClick={() => handleValidate(op._id, op.type)}>
                            <Check className="h-4 w-4 mr-1" /> Validate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {op.items.map((i, idx) => (
                        <Badge key={idx} variant="outline" className="text-sm font-normal">
                          {i.name} <span className="ml-1 font-semibold">x{i.quantity}</span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Operations;