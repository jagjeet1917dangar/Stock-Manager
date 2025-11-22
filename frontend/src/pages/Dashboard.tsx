import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // <--- Added navigation hook
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, MapPin, Tag, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// --- Types ---
interface StockEntry {
  locationId: { _id: string; name: string };
  quantity: number;
}

interface Product {
  _id: string;
  name: string;
  quantity: number; 
  minStock: number;
  category: string;
  stock: StockEntry[];
}

interface Item {
  productId: string;
  name: string;
  quantity: number;
}

interface Operation {
  _id: string;
  type: 'receipt' | 'delivery';
  supplier?: string;
  customer?: string;
  status: string;
  date: string;
  items: Item[];
}

interface Location {
  _id: string;
  name: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--destructive))", "#8884d8"];

const Dashboard = () => {
  const navigate = useNavigate(); // <--- Initialize Hook
  const [products, setProducts] = useState<Product[]>([]);
  const [receipts, setReceipts] = useState<Operation[]>([]);
  const [deliveries, setDeliveries] = useState<Operation[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- Filters ---
  const [timeRange, setTimeRange] = useState("7days");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, locRes, receiptRes, deliveryRes] = await Promise.all([
          apiFetch("http://localhost:5000/api/products"),
          apiFetch("http://localhost:5000/api/locations"),
          apiFetch("http://localhost:5000/api/receipts"),
          apiFetch("http://localhost:5000/api/deliveries")
        ]);

        if (prodRes.ok) setProducts(await prodRes.json());
        if (locRes.ok) setLocations(await locRes.json());
        if (receiptRes.ok) setReceipts(await receiptRes.json());
        if (deliveryRes.ok) setDeliveries(await deliveryRes.json());

      } catch (error) {
        console.error("Dashboard fetch error:", error);
        toast.error("Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Extract Unique Categories
  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category))).filter(Boolean);
  }, [products]);

  // Map Product ID to Category for ops filtering
  const productCategoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    products.forEach(p => map[p._id] = p.category);
    return map;
  }, [products]);

  // --- 1. Filter Products (Location & Category) ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === "all" || p.category === selectedCategory;
      return matchCat;
    });
  }, [products, selectedCategory]);

  const locationStats = useMemo(() => {
    let total = 0;
    let low = 0;
    let out = 0;

    filteredProducts.forEach(p => {
      let qty = p.quantity; 

      if (selectedLocation !== "all") {
        const locEntry = p.stock?.find(s => s.locationId?._id === selectedLocation);
        qty = locEntry ? locEntry.quantity : 0;
      }

      if (qty > 0) total++; 
      if (qty > 0 && qty <= p.minStock) low++;
      if (qty === 0) out++;
    });

    return { totalProducts: total, lowStockCount: low, outOfStockCount: out };
  }, [filteredProducts, selectedLocation]);


  // --- 2. Filter Operations (Time & Category) ---
  const filterOps = (ops: Operation[]) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return ops.filter(op => {
      const opDate = new Date(op.date);
      let matchTime = true;
      if (timeRange === "today") matchTime = opDate >= todayStart;
      else if (timeRange === "7days") matchTime = opDate >= new Date(now.setDate(now.getDate() - 7));
      else if (timeRange === "30days") matchTime = opDate >= new Date(now.setDate(now.getDate() - 30));
      else if (timeRange === "90days") matchTime = opDate >= new Date(now.setDate(now.getDate() - 90));
      
      if (!matchTime) return false;

      if (selectedCategory !== "all") {
        const hasCategoryItem = op.items.some(item => productCategoryMap[item.productId] === selectedCategory);
        if (!hasCategoryItem) return false;
      }

      return true;
    });
  };

  const filteredReceipts = useMemo(() => filterOps(receipts), [receipts, timeRange, selectedCategory, productCategoryMap]);
  const filteredDeliveries = useMemo(() => filterOps(deliveries), [deliveries, timeRange, selectedCategory, productCategoryMap]);

  // --- 3. Chart Data ---
  const chartData = useMemo(() => {
    const data = [
      { name: "Mon", receipts: 0, deliveries: 0 },
      { name: "Tue", receipts: 0, deliveries: 0 },
      { name: "Wed", receipts: 0, deliveries: 0 },
      { name: "Thu", receipts: 0, deliveries: 0 },
      { name: "Fri", receipts: 0, deliveries: 0 },
      { name: "Sat", receipts: 0, deliveries: 0 },
      { name: "Sun", receipts: 0, deliveries: 0 },
    ];
    const getDayIndex = (dateStr: string) => (new Date(dateStr).getDay() + 6) % 7;

    const sumQty = (items: Item[]) => {
      return items.reduce((acc, item) => {
        const itemCat = productCategoryMap[item.productId];
        if (selectedCategory === "all" || itemCat === selectedCategory) {
          return acc + item.quantity;
        }
        return acc;
      }, 0);
    };

    filteredReceipts.forEach(r => {
      data[getDayIndex(r.date)].receipts += sumQty(r.items);
    });
    filteredDeliveries.forEach(d => {
      data[getDayIndex(d.date)].deliveries += sumQty(d.items);
    });
    return data;
  }, [filteredReceipts, filteredDeliveries, selectedCategory, productCategoryMap]);

  // --- 4. Category Pie Chart ---
  const categoryData = useMemo(() => {
    const stats: Record<string, number> = {};
    
    filteredProducts.forEach(p => {
      let qty = p.quantity;
      if (selectedLocation !== "all") {
        const locEntry = p.stock?.find(s => s.locationId?._id === selectedLocation);
        qty = locEntry ? locEntry.quantity : 0;
      }
      if (qty > 0) {
        stats[p.category] = (stats[p.category] || 0) + qty;
      }
    });

    return Object.keys(stats).map(key => ({ name: key, value: stats[key] }));
  }, [filteredProducts, selectedLocation]);

  const pendingReceiptsCount = filteredReceipts.filter(r => r.status !== "done").length;
  const pendingDeliveriesCount = filteredDeliveries.filter(d => d.status !== "done").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your inventory health.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[160px] shadow-sm">
              <Tag className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[160px] shadow-sm">
              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc._id} value={loc._id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] shadow-sm">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards (Now Clickable) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="shadow-soft hover:shadow-medium transition-smooth border-l-4 border-l-primary cursor-pointer"
          onClick={() => navigate('/products?filter=all')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : locationStats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedCategory !== 'all' ? selectedCategory : 'All Categories'} 
              {selectedLocation !== 'all' ? ' (Selected Loc)' : ''}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="shadow-soft hover:shadow-medium transition-smooth border-l-4 border-l-warning cursor-pointer"
          onClick={() => navigate('/products?filter=low')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : locationStats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Needs reordering
            </p>
          </CardContent>
        </Card>

        <Card 
          className="shadow-soft hover:shadow-medium transition-smooth border-l-4 border-l-accent cursor-pointer"
          onClick={() => navigate('/operations?tab=receipts')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Receipts</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : pendingReceiptsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Incoming {selectedCategory !== 'all' ? `(${selectedCategory})` : ''}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="shadow-soft hover:shadow-medium transition-smooth border-l-4 border-l-destructive cursor-pointer"
          onClick={() => navigate('/operations?tab=deliveries')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : pendingDeliveriesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Outgoing {selectedCategory !== 'all' ? `(${selectedCategory})` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-soft">
          <CardHeader>
            <CardTitle>Stock Movement</CardTitle>
            <p className="text-sm text-muted-foreground">Receipts vs Deliveries {selectedCategory !== 'all' ? `for ${selectedCategory}` : ''}</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))" }} />
                <Legend />
                <Bar dataKey="receipts" name="Received" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deliveries" name="Delivered" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-soft">
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedLocation === 'all' ? 'Global Stock' : 'Selected Location'}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;