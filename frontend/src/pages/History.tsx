import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RefreshCw, 
  PackageOpen,
  Loader2 
} from "lucide-react";
import { toast } from "sonner";

// --- Types ---
interface OperationItem {
  productId: string;
  quantity: number;
  name: string;
}

interface HistoryItem {
  _id: string;
  type: 'receipt' | 'delivery' | 'transfer' | 'adjustment';
  reference: string; 
  details: string;   
  items: OperationItem[];
  status: string;
  date: string;
}

const History = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Fetch & Normalize Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rcptRes, delRes, trfRes, adjRes] = await Promise.all([
          fetch("http://localhost:5000/api/receipts"),
          fetch("http://localhost:5000/api/deliveries"),
          fetch("http://localhost:5000/api/transfers"),
          fetch("http://localhost:5000/api/adjustments")
        ]);

        const combinedHistory: HistoryItem[] = [];

        if (rcptRes.ok) {
          const data = await rcptRes.json();
          data.forEach((r: any) => combinedHistory.push({
            _id: r._id,
            type: 'receipt',
            reference: r.supplier || "Unknown Supplier",
            details: 'Incoming Stock',
            items: r.items || [],
            status: r.status,
            date: r.date
          }));
        }

        if (delRes.ok) {
          const data = await delRes.json();
          data.forEach((d: any) => combinedHistory.push({
            _id: d._id,
            type: 'delivery',
            reference: d.customer || "Unknown Customer",
            details: 'Outgoing Stock',
            items: d.items || [],
            status: d.status,
            date: d.date
          }));
        }

        if (trfRes.ok) {
          const data = await trfRes.json();
          data.forEach((t: any) => combinedHistory.push({
            _id: t._id,
            type: 'transfer',
            reference: 'Internal Transfer',
            details: `${t.fromLocation || '?'} → ${t.toLocation || '?'}`,
            items: t.items || [],
            status: t.status,
            date: t.date
          }));
        }

        if (adjRes.ok) {
          const data = await adjRes.json();
          data.forEach((a: any) => combinedHistory.push({
            _id: a._id,
            type: 'adjustment',
            reference: a.reason || "Unknown Reason",
            details: 'Stock Correction',
            items: a.items || [],
            status: 'done', 
            date: a.date
          }));
        }

        combinedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setHistory(combinedHistory);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Helpers ---
  const getIcon = (type: string) => {
    switch (type) {
      case 'receipt': return <ArrowDownToLine className="h-4 w-4 text-accent" />;
      case 'delivery': return <ArrowUpFromLine className="h-4 w-4 text-destructive" />;
      case 'transfer': return <RefreshCw className="h-4 w-4 text-warning" />;
      case 'adjustment': return <PackageOpen className="h-4 w-4 text-primary" />;
      default: return null;
    }
  };

  const getBadgeVariant = (status: string) => {
    return status === 'done' ? 'default' : 'secondary';
  };

  // SAFE Filter Logic
  const filteredHistory = history.filter(item => {
    const query = searchQuery.toLowerCase();
    const refMatch = (item.reference || "").toLowerCase().includes(query);
    const typeMatch = (item.type || "").toLowerCase().includes(query);
    const itemMatch = item.items?.some(i => (i.name || "").toLowerCase().includes(query));
    
    return refMatch || typeMatch || itemMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Move History</h1>
        <p className="text-muted-foreground mt-1">Complete ledger of all inventory movements</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by reference, product, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>

      {/* History Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>Showing {filteredHistory.length} records</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Reference / Reason</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading history...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No history records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistory.map((item) => (
                  <TableRow key={item._id} className="hover:bg-muted/50 transition-smooth">
                    <TableCell>
                      <div className="flex items-center gap-2 capitalize font-medium">
                        {getIcon(item.type)} {item.type}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.reference}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{item.details}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.items?.map((i, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs font-normal">
                            {i.name} <span className="ml-1 font-semibold">x{i.quantity}</span>
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(item.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getBadgeVariant(item.status)}>
                        {item.status?.toUpperCase() || "UNKNOWN"}
                      </Badge>
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

export default History;