import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, TrendingUp, TrendingDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

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

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--destructive))", "#8884d8"];

const Dashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter State
  const [timeRange, setTimeRange] = useState("7days");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, receiptRes, deliveryRes] = await Promise.all([
          apiFetch("http://localhost:5000/api/products"),
          apiFetch("http://localhost:5000/api/receipts"),
          apiFetch("http://localhost:5000/api/deliveries")
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

  // --- Filter Logic ---
  const filterDataByTime = <T extends { date: string }>(data: T[]) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Midnight today

    return data.filter(item => {
      const itemDate = new Date(item.date);
      
      switch (timeRange) {
        case "today":
          return itemDate >= todayStart;
        case "7days": {
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          return itemDate >= sevenDaysAgo;
        }
        case "30days": {
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return itemDate >= thirtyDaysAgo;
        }
        case "90days": {
          const ninetyDaysAgo = new Date(now);
          ninetyDaysAgo.setDate(now.getDate() - 90);
          return itemDate >= ninetyDaysAgo;
        }
        default:
          return true;
      }
    });
  };

  // Use memoized filtered data for charts and lists
  const filteredReceipts = useMemo(() => filterDataByTime(receipts), [receipts, timeRange]);
  const filteredDeliveries = useMemo(() => filterDataByTime(deliveries), [deliveries, timeRange]);

  // --- Calculate Chart Data ---
  const chartData = useMemo(() => {
    // For "Today", showing "Mon-Sun" isn't very useful, maybe show hourly? 
    // But keeping "Mon-Sun" is safer for simplicity.
    const data = [
      { name: "Mon", receipts: 0, deliveries: 0 },
      { name: "Tue", receipts: 0, deliveries: 0 },
      { name: "Wed", receipts: 0, deliveries: 0 },
      { name: "Thu", receipts: 0, deliveries: 0 },
      { name: "Fri", receipts: 0, deliveries: 0 },
      { name: "Sat", receipts: 0, deliveries: 0 },
      { name: "Sun", receipts: 0, deliveries: 0 },
    ];

    const getDayIndex = (dateStr: string) => {
      const day = new Date(dateStr).getDay(); 
      return (day + 6) % 7; 
    };

    filteredReceipts.forEach(r => {
      const idx = getDayIndex(r.date);
      const totalQty = r.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      data[idx].receipts += totalQty;
    });

    filteredDeliveries.forEach(d => {
      const idx = getDayIndex(d.date);
      const totalQty = d.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      data[idx].deliveries += totalQty;
    });

    return data;
  }, [filteredReceipts, filteredDeliveries]); // Depend on filtered data

  // --- Calculate KPIs ---
  // Note: Total Products & Low Stock usually reflect *current* state, not history, 
  // so we typically don't filter products by date unless tracking "New Products added".
  // However, Receipts/Deliveries KPIs SHOULD be filtered.
  
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length;
  
  // KPIs based on filtered data (e.g., "Pending receipts created in last 7 days")
  const pendingReceiptsCount = filteredReceipts.filter(r => r.status !== "done").length;
  const pendingDeliveriesCount = filteredDeliveries.filter(d => d.status !== "done").length;

  const categoryStats = products.reduce((acc: Record<string, number>, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.quantity;
    return acc;
  }, {});

  const categoryData = Object.keys(categoryStats).map((key) => ({
    name: key,
    value: categoryStats[key],
  }));

  const recentActivity = [...filteredReceipts, ...filteredDeliveries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(item => {
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
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
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

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        {/* Bar Chart */}
        <Card className="lg:col-span-4 shadow-soft">
          <CardHeader>
            <CardTitle>Stock Movement</CardTitle>
            <p className="text-sm text-muted-foreground">Receipts vs Deliveries ({timeRange === "today" ? "Today" : timeRange})</p>
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
            <p className="text-sm text-muted-foreground">Current Distribution</p>
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
          <p className="text-sm text-muted-foreground">Latest movements ({timeRange})</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No recent activity in this period.</p>
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