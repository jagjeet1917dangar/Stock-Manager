import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, PackageOpen, Plus } from "lucide-react";

const receipts = [
  { id: "RCP-001", supplier: "Tech Supplies Inc.", items: 5, status: "draft", date: "2024-01-15" },
  { id: "RCP-002", supplier: "Office World", items: 12, status: "waiting", date: "2024-01-14" },
  { id: "RCP-003", supplier: "Electronics Hub", items: 8, status: "done", date: "2024-01-13" },
];

const deliveries = [
  { id: "DEL-001", customer: "ABC Corp", items: 3, status: "ready", date: "2024-01-15" },
  { id: "DEL-002", customer: "XYZ Ltd", items: 7, status: "done", date: "2024-01-14" },
];

const transfers = [
  { id: "TRF-001", from: "Warehouse A", to: "Warehouse B", items: 15, status: "draft", date: "2024-01-15" },
  { id: "TRF-002", from: "Warehouse B", to: "Warehouse C", items: 10, status: "done", date: "2024-01-14" },
];

const adjustments = [
  { id: "ADJ-001", reason: "Physical count correction", items: 4, status: "done", date: "2024-01-15" },
  { id: "ADJ-002", reason: "Damaged goods", items: 2, status: "done", date: "2024-01-14" },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
    draft: { variant: "outline", className: "border-muted-foreground text-muted-foreground" },
    waiting: { variant: "secondary", className: "bg-warning/10 text-warning border-warning" },
    ready: { variant: "default", className: "bg-accent text-accent-foreground" },
    done: { variant: "default", className: "bg-success text-success-foreground" },
  };
  
  const config = variants[status] || variants.draft;
  return <Badge variant={config.variant} className={config.className}>{status.toUpperCase()}</Badge>;
};

const Operations = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Operations</h1>
        <p className="text-muted-foreground mt-1">Manage inventory movements and operations</p>
      </div>

      {/* Operations Tabs */}
      <Tabs defaultValue="receipts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="receipts">
            <ArrowDownToLine className="h-4 w-4 mr-2" />
            Receipts
          </TabsTrigger>
          <TabsTrigger value="deliveries">
            <ArrowUpFromLine className="h-4 w-4 mr-2" />
            Deliveries
          </TabsTrigger>
          <TabsTrigger value="transfers">
            <RefreshCw className="h-4 w-4 mr-2" />
            Transfers
          </TabsTrigger>
          <TabsTrigger value="adjustments">
            <PackageOpen className="h-4 w-4 mr-2" />
            Adjustments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receipts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Incoming Receipts</h2>
            <Button className="shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              New Receipt
            </Button>
          </div>
          {receipts.map((receipt) => (
            <Card key={receipt.id} className="shadow-soft hover:shadow-medium transition-smooth">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{receipt.id}</CardTitle>
                    <CardDescription>{receipt.supplier}</CardDescription>
                  </div>
                  {getStatusBadge(receipt.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {receipt.items} items • {receipt.date}
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Outgoing Deliveries</h2>
            <Button className="shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              New Delivery
            </Button>
          </div>
          {deliveries.map((delivery) => (
            <Card key={delivery.id} className="shadow-soft hover:shadow-medium transition-smooth">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{delivery.id}</CardTitle>
                    <CardDescription>{delivery.customer}</CardDescription>
                  </div>
                  {getStatusBadge(delivery.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {delivery.items} items • {delivery.date}
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Internal Transfers</h2>
            <Button className="shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              New Transfer
            </Button>
          </div>
          {transfers.map((transfer) => (
            <Card key={transfer.id} className="shadow-soft hover:shadow-medium transition-smooth">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{transfer.id}</CardTitle>
                    <CardDescription>{transfer.from} → {transfer.to}</CardDescription>
                  </div>
                  {getStatusBadge(transfer.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {transfer.items} items • {transfer.date}
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Stock Adjustments</h2>
            <Button className="shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              New Adjustment
            </Button>
          </div>
          {adjustments.map((adjustment) => (
            <Card key={adjustment.id} className="shadow-soft hover:shadow-medium transition-smooth">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{adjustment.id}</CardTitle>
                    <CardDescription>{adjustment.reason}</CardDescription>
                  </div>
                  {getStatusBadge(adjustment.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {adjustment.items} items • {adjustment.date}
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Operations;
