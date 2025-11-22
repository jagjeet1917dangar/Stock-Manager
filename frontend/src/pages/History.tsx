import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ArrowDownToLine, ArrowUpFromLine, RefreshCw, PackageOpen } from "lucide-react";
import { useState } from "react";

const movements = [
  { id: 1, date: "2024-01-15 14:30", type: "receipt", product: "MacBook Pro 16\"", from: "Supplier", to: "Warehouse A", qty: "+10", user: "John Doe", status: "completed" },
  { id: 2, date: "2024-01-15 13:15", type: "delivery", product: "Office Chair", from: "Warehouse A", to: "Customer", qty: "-5", user: "Jane Smith", status: "completed" },
  { id: 3, date: "2024-01-15 11:45", type: "transfer", product: "Wireless Mouse", from: "Warehouse A", to: "Warehouse B", qty: "25", user: "Mike Johnson", status: "in-progress" },
  { id: 4, date: "2024-01-15 10:20", type: "adjustment", product: "USB-C Cable", from: "Warehouse A", to: "Warehouse A", qty: "-3", user: "Sarah Wilson", status: "completed" },
  { id: 5, date: "2024-01-14 16:50", type: "receipt", product: "Monitor 27\" 4K", from: "Supplier", to: "Warehouse B", qty: "+15", user: "John Doe", status: "completed" },
  { id: 6, date: "2024-01-14 15:30", type: "delivery", product: "Standing Desk", from: "Warehouse B", to: "Customer", qty: "-3", user: "Jane Smith", status: "completed" },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case "receipt":
      return <ArrowDownToLine className="h-4 w-4" />;
    case "delivery":
      return <ArrowUpFromLine className="h-4 w-4" />;
    case "transfer":
      return <RefreshCw className="h-4 w-4" />;
    case "adjustment":
      return <PackageOpen className="h-4 w-4" />;
    default:
      return null;
  }
};

const getTypeBadge = (type: string) => {
  const config: Record<string, { className: string }> = {
    receipt: { className: "bg-accent/10 text-accent border-accent" },
    delivery: { className: "bg-primary/10 text-primary border-primary" },
    transfer: { className: "bg-warning/10 text-warning border-warning" },
    adjustment: { className: "bg-muted text-foreground border-border" },
  };
  
  const style = config[type] || config.adjustment;
  return (
    <Badge variant="outline" className={style.className}>
      {getTypeIcon(type)}
      <span className="ml-1 capitalize">{type}</span>
    </Badge>
  );
};

const History = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMovements = movements.filter(movement =>
    movement.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
    movement.user.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Move History</h1>
        <p className="text-muted-foreground mt-1">Complete ledger of all inventory movements</p>
      </div>

      {/* Search */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Search History</CardTitle>
          <CardDescription>Filter movements by product, user, or type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Movements List */}
      <div className="space-y-3">
        {filteredMovements.map((movement) => (
          <Card key={movement.id} className="shadow-soft hover:shadow-medium transition-smooth">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-3">
                    {getTypeBadge(movement.type)}
                    <Badge variant={movement.status === 'completed' ? 'default' : 'secondary'}>
                      {movement.status}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{movement.product}</h3>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                      <span>{movement.from}</span>
                      <span>→</span>
                      <span>{movement.to}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Quantity: </span>
                      <span className={`font-semibold ${
                        movement.qty.startsWith('+') ? 'text-accent' : 
                        movement.qty.startsWith('-') ? 'text-destructive' : 
                        'text-foreground'
                      }`}>
                        {movement.qty}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">By: </span>
                      <span className="text-foreground">{movement.user}</span>
                    </div>
                    <div className="text-muted-foreground">{movement.date}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default History;
