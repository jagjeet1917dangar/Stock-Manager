import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom"; // <--- NEW IMPORT
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // <--- NEW IMPORT
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Plus, Search, Package, AlertCircle, CheckCircle2, Trash2, Loader2, Pencil, Warehouse, Filter } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// --- Types ---
interface StockEntry {
  locationId: {
    _id: string;
    name: string;
    type: string;
  };
  quantity: number;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minStock: number;
  unitOfMeasure: string;
  stock: StockEntry[];
}

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams(); // <--- URL Params hook
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // <--- Local Filter State
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null); 

  // Sync URL param with Local State on load
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam) {
      setStatusFilter(filterParam);
    }
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      const response = await apiFetch("http://localhost:5000/api/products"); 
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Could not load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddDialog = () => {
    setEditingProduct(null); 
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product); 
    setIsDialogOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get("name"),
      sku: formData.get("sku"),
      category: formData.get("category"),
      unitOfMeasure: formData.get("unitOfMeasure"),
      quantity: Number(formData.get("quantity")), 
      minStock: Number(formData.get("minStock")),
    };

    try {
      const url = editingProduct 
        ? `http://localhost:5000/api/products/${editingProduct._id}` 
        : "http://localhost:5000/api/products";                      
      
      const method = editingProduct ? "PUT" : "POST";

      const response = await apiFetch(url, { 
        method: method,
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingProduct ? "Product updated!" : "Product added!");
        setIsDialogOpen(false);
        fetchProducts(); 
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const response = await apiFetch(`http://localhost:5000/api/products/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Product deleted");
        fetchProducts(); 
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  // --- FILTER LOGIC ---
  const filteredProducts = products.filter(product => {
    // 1. Text Search
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Status Filter
    let matchesStatus = true;
    if (statusFilter === "low") {
      matchesStatus = product.quantity > 0 && product.quantity <= product.minStock;
    } else if (statusFilter === "out") {
      matchesStatus = product.quantity === 0;
    }

    return matchesSearch && matchesStatus;
  });

  // Update URL when filter changes (optional, but good for bookmarking)
  const handleFilterChange = (val: string) => {
    setStatusFilter(val);
    setSearchParams(val === 'all' ? {} : { filter: val });
  };

  const getStatusBadge = (qty: number, minStock: number) => {
    if (qty === 0) return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Out of Stock</Badge>;
    if (qty <= minStock) return <Badge className="bg-warning text-warning-foreground"><AlertCircle className="h-3 w-3 mr-1" />Low Stock</Badge>;
    return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="h-3 w-3 mr-1" />In Stock</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your inventory products</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-soft" onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>
                {editingProduct ? "Update details." : "Enter details to track."}
              </DialogDescription>
            </DialogHeader>
            
            <form key={editingProduct ? editingProduct._id : "new"} onSubmit={handleSaveProduct} className="space-y-4 py-2">
              {/* Form fields same as before... */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" name="name" defaultValue={editingProduct?.name} placeholder="e.g. Steel Rod" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU / Code</Label>
                  <Input id="sku" name="sku" defaultValue={editingProduct?.sku} placeholder="e.g. SR-100" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" defaultValue={editingProduct?.category} placeholder="e.g. Raw Material" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitOfMeasure">Unit</Label>
                  <Input id="unitOfMeasure" name="unitOfMeasure" defaultValue={editingProduct?.unitOfMeasure} placeholder="kg" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Initial Stock</Label>
                  <Input 
                    id="quantity" 
                    name="quantity" 
                    type="number" 
                    defaultValue={editingProduct?.quantity ?? 0} 
                    min="0" 
                    disabled={!!editingProduct} 
                    className={editingProduct ? "bg-muted" : ""}
                  />
                  {editingProduct && <p className="text-[10px] text-muted-foreground">Use 'Operations' to adjust stock.</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">Low Stock Alert</Label>
                  <Input id="minStock" name="minStock" type="number" defaultValue={editingProduct?.minStock ?? 10} min="0" required />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingProduct ? "Update Product" : "Save Product"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* --- UPDATED: KPI Cards now act as filters --- */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className={`shadow-soft cursor-pointer transition-all ${statusFilter === 'all' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
          onClick={() => handleFilterChange('all')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="h-4 w-4 mr-2 text-primary" /> Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card 
          className={`shadow-soft cursor-pointer transition-all ${statusFilter === 'low' ? 'ring-2 ring-warning' : 'hover:bg-muted/50'}`}
          onClick={() => handleFilterChange('low')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-warning" /> Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length}
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`shadow-soft cursor-pointer transition-all ${statusFilter === 'out' ? 'ring-2 ring-destructive' : 'hover:bg-muted/50'}`}
          onClick={() => handleFilterChange('out')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-destructive" /> Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.quantity === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Product List</CardTitle>
              {statusFilter !== 'all' && (
                <Badge variant="outline" className="uppercase">
                  Filtered: {statusFilter === 'low' ? 'Low Stock' : 'Out of Stock'}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {/* --- NEW: Filter Dropdown --- */}
              <Select value={statusFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Min Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading inventory...</TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No products found.</TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product._id} className="hover:bg-muted/50 transition-smooth">
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    
                    {/* Hover to see Breakdown */}
                    <TableCell className="text-right font-semibold cursor-help">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <span className="underline decoration-dotted decoration-muted-foreground/50">
                            {product.quantity} <span className="text-xs font-normal text-muted-foreground">{product.unitOfMeasure}</span>
                          </span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-60">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold flex items-center">
                              <Warehouse className="h-4 w-4 mr-2" /> Stock by Location
                            </h4>
                            <div className="text-sm space-y-1">
                              {product.stock && product.stock.length > 0 ? (
                                product.stock.map((s, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span className="text-muted-foreground">{s.locationId?.name || "Unknown Loc"}</span>
                                    <span className="font-medium">{s.quantity}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted-foreground text-xs">No specific location data</div>
                              )}
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </TableCell>

                    <TableCell className="text-right text-muted-foreground">{product.minStock}</TableCell>
                    <TableCell>{getStatusBadge(product.quantity, product.minStock)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => openEditDialog(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(product._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

export default Products;