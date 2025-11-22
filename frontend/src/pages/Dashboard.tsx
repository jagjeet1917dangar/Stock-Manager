import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const stockData = [
  { name: "Mon", receipts: 45, deliveries: 32 },
  { name: "Tue", receipts: 52, deliveries: 38 },
  { name: "Wed", receipts: 38, deliveries: 45 },
  { name: "Thu", receipts: 65, deliveries: 42 },
  { name: "Fri", receipts: 48, deliveries: 55 },
  { name: "Sat", receipts: 35, deliveries: 28 },
  { name: "Sun", receipts: 28, deliveries: 22 },
];

const categoryData = [
  { name: "Electronics", value: 450, color: "hsl(var(--primary))" },
  { name: "Furniture", value: 320, color: "hsl(var(--accent))" },
  { name: "Office Supplies", value: 280, color: "hsl(var(--warning))" },
  { name: "Others", value: 150, color: "hsl(var(--muted-foreground))" },
];

const recentActivity = [
  { id: 1, type: "receipt", product: "MacBook Pro 16\"", qty: 10, time: "2 hours ago", status: "completed" },
  { id: 2, type: "delivery", product: "Office Chair Ergonomic", qty: 5, time: "3 hours ago", status: "completed" },
  { id: 3, type: "transfer", product: "Wireless Mouse", qty: 25, time: "5 hours ago", status: "in-progress" },
  { id: 4, type: "adjustment", product: "USB-C Cable", qty: -3, time: "6 hours ago", status: "completed" },
];

const Dashboard = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your inventory overview.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select defaultValue="7days">
            <SelectTrigger className="w-[180px]">
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
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-accent" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-smooth border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingDown className="h-3 w-3 mr-1 text-warning" />
              Needs attention
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-smooth border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Receipts</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              Awaiting validation
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-smooth border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              Ready to ship
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
            <CardDescription>Weekly receipts vs deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockData}>
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
                <Bar dataKey="receipts" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="deliveries" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="lg:col-span-3 shadow-soft">
          <CardHeader>
            <CardTitle>Stock by Category</CardTitle>
            <CardDescription>Distribution of inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest stock movements and operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-smooth">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    activity.type === 'receipt' ? 'bg-accent/10' :
                    activity.type === 'delivery' ? 'bg-primary/10' :
                    activity.type === 'transfer' ? 'bg-warning/10' :
                    'bg-muted'
                  }`}>
                    {activity.type === 'receipt' && <ArrowDownToLine className="h-4 w-4 text-accent" />}
                    {activity.type === 'delivery' && <ArrowUpFromLine className="h-4 w-4 text-primary" />}
                    {activity.type === 'transfer' && <Package className="h-4 w-4 text-warning" />}
                    {activity.type === 'adjustment' && <AlertTriangle className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{activity.product}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {activity.qty > 0 ? '+' : ''}{activity.qty} • {activity.time}
                    </p>
                  </div>
                </div>
                <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
