import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, TrendingUp, TrendingDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";

// --- Types ---
interface Product {
  _id: string;
  name: string;
  quantity: number;
  minStock: number;
  category: string;
}

interface Item {
  name: string;
  quantity: number;
}

interface Receipt {
  _id: string;
  type: 'receipt';
  supplier: string;
  status: string;
  date: string;
  items: Item[];
}

interface Delivery {
  _id: string;
  type: 'delivery';
  customer: string;
  status: string;
  date: string;
  items: Item[];
}

// --- Chart Colors ---
const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--destructive))", "#8884d8"];

const Dashboard = () => {
  // --- State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Run all fetches in parallel for speed
        const [prodRes, receiptRes, deliveryRes] = await Promise.all([
          fetch("http://localhost:5000/api/products"),
          fetch("http://localhost:5000/api/receipts"),
          fetch("http://localhost:5000/api/deliveries")
        ]);

        if (prodRes.ok) setProducts(await prodRes.json());
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

  // --- Calculate Chart Data (Dynamic) ---
  const chartData = useMemo(() => {
    // Initialize structure for Mon-Sun
    const data = [
      { name: "Mon", receipts: 0, deliveries: 0 },
      { name: "Tue", receipts: 0, deliveries: 0 },
      { name: "Wed", receipts: 0, deliveries: 0 },
      { name: "Thu", receipts: 0, deliveries: 0 },
      { name: "Fri", receipts: 0, deliveries: 0 },
      { name: "Sat", receipts: 0, deliveries: 0 },
      { name: "Sun", receipts: 0, deliveries: 0 },
    ];

    // Helper to map JS Day (0=Sun) to Array Index (0=Mon ... 6=Sun)
    const getDayIndex = (dateStr: string) => {
      const day = new Date(dateStr).getDay(); // 0 is Sunday
      return (day + 6) % 7; // Shift so 0 is Monday
    };

    // Sum Receipts
    receipts.forEach(r => {
      const idx = getDayIndex(r.date);
      const totalQty = r.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      data[idx].receipts += totalQty;
    });

    // Sum Deliveries
    deliveries.forEach(d => {
      const idx = getDayIndex(d.date);
      const totalQty = d.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      data[idx].deliveries += totalQty;
    });

    return data;
  }, [receipts, deliveries]);

  // --- Calculate KPIs ---
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length;
  const pendingReceiptsCount = receipts.filter(r => r.status !== "done").length;
  const pendingDeliveriesCount = deliveries.filter(d => d.status !== "done").length;

  // Pie Chart Data
  const categoryStats = products.reduce((acc: Record<string, number>, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.quantity;
    return acc;
  }, {});

  const categoryData = Object.keys(categoryStats).map((key) => ({
    name: key,
    value: categoryStats[key],
  }));

  // Recent Activity Feed
  const recentActivity = [...receipts, ...deliveries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(item => {
      const isReceipt = item.type === 'receipt'; // Note: ensure backend sends 'type' or infer it
      // Inference fallback if 'type' is missing from API response (depends on model)
      // But we can infer based on properties or just check the array source if we processed differently.
      // For now, let's assume we cast it correctly or backend sends it. 
      // Actually, backend Mongoose models have default type='receipt'/'delivery', so it should be there.
      
      // Safe check for type if not present (optional robustness)
      const type = (item as any).type || (Object.prototype.hasOwnProperty.call(item, 'supplier') ? 'receipt' : 'delivery');
      const partyName = type === 'receipt' ? (item as Receipt).supplier : (item as Delivery).customer;
      
      return {
        id: item._id,
        type: type,
        title: type === 'receipt' ? `Received from ${partyName}` : `Delivered to ${partyName}`,
        desc: `${item.items?.length || 0} items`,
        qty: item.items?.reduce((sum, i) => sum + i.quantity, 0) || 0,
        date: new Date(item.date).toLocaleDateString(),
        status: item.status
      };
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time inventory overview.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select defaultValue="7days">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Products */}
        <Card className="shadow-soft hover:shadow-medium transition-smooth border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalProducts}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-accent" />
              Active items
            </p>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card className="shadow-soft hover:shadow-medium transition-smooth border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : lowStockCount}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingDown className="h-3 w-3 mr-1 text-warning" />
              Needs reordering
            </p>
          </CardContent>
        </Card>

        {/* Pending Receipts */}
        <Card className="shadow-soft hover:shadow-medium transition-smooth border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Receipts</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : pendingReceiptsCount}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              Incoming stock
            </p>
          </CardContent>
        </Card>

        {/* Pending Deliveries */}
        <Card className="shadow-soft hover:shadow-medium transition-smooth border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : pendingDeliveriesCount}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              Outgoing stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Bar Chart - Now Dynamic */}
        <Card className="lg:col-span-4 shadow-soft">
          <CardHeader>
            <CardTitle>Stock Movement (This Week)</CardTitle>
            <p className="text-sm text-muted-foreground">Total items received vs delivered</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}
                />
                <Legend />
                <Bar dataKey="receipts" name="Received" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deliveries" name="Delivered" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="lg:col-span-3 shadow-soft">
          <CardHeader>
            <CardTitle>Stock by Category</CardTitle>
            <p className="text-sm text-muted-foreground">Distribution by Quantity</p>
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

      {/* Recent Activity List */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <p className="text-sm text-muted-foreground">Latest movements (Receipts & Deliveries)</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No recent activity found.</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-smooth">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${activity.type === 'receipt' ? 'bg-accent/10' : 'bg-destructive/10'}`}>
                      {activity.type === 'receipt' 
                        ? <ArrowDownToLine className="h-4 w-4 text-accent" />
                        : <ArrowUpFromLine className="h-4 w-4 text-destructive" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={activity.status === 'done' ? 'default' : 'secondary'}>
                      {activity.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{activity.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;