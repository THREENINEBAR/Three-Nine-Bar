import { useState } from "react";
import { 
  useGetSalesByProduct,
  useGetIngredientUsage,
  useListWasting,
  useGetLowStock
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { 
  FileText, CalendarIcon, Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default function ReportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // Date range filter
  const [startDate, setStartDate] = useState<string>(format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const { data: salesData, isLoading: loadingSales } = useGetSalesByProduct({ startDate, endDate });
  const { data: usageData, isLoading: loadingUsage } = useGetIngredientUsage({ startDate, endDate });
  const { data: wastingData, isLoading: loadingWasting } = useListWasting({ startDate, endDate });
  const { data: lowStockData, isLoading: loadingLowStock } = useGetLowStock();

  if (!isAdmin) {
    return <div className="p-8 text-destructive">Unauthorized access</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Laporan</h1>
          <p className="text-muted-foreground mt-1">Generate and print analytical reports.</p>
        </div>
        <Button onClick={handlePrint} variant="outline" className="border-primary/50 text-primary font-semibold tracking-wide uppercase">
          <Printer className="mr-2 h-4 w-4" /> Print / PDF
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm p-4 print:hidden">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="grid gap-2 w-full max-w-[200px]">
            <Label className="text-xs uppercase text-muted-foreground">Start Date</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
          </div>
          <div className="grid gap-2 w-full max-w-[200px]">
            <Label className="text-xs uppercase text-muted-foreground">End Date</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="print-section">
        {/* Only visible when printing */}
        <div className="hidden print:block mb-8 text-center border-b border-black pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-widest">THREE NINE BAR</h1>
          <h2 className="text-lg uppercase mt-2">Inventory System Report</h2>
          <p className="text-sm mt-1">Period: {formatShortDate(startDate)} - {formatShortDate(endDate)}</p>
        </div>

        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-sidebar print:hidden">
            <TabsTrigger value="sales" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground uppercase text-xs tracking-wider">Sales</TabsTrigger>
            <TabsTrigger value="usage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground uppercase text-xs tracking-wider">Ingredient Usage</TabsTrigger>
            <TabsTrigger value="wasting" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground uppercase text-xs tracking-wider">Wasting</TabsTrigger>
            <TabsTrigger value="lowstock" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground uppercase text-xs tracking-wider">Low Stock</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="mt-6 print:block">
            <Card className="border-border bg-transparent shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl text-primary uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-5 w-5 print:hidden" /> Sales Report
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase border-b-2 border-border/50 text-muted-foreground print:text-black print:border-black">
                    <tr>
                      <th className="py-3 font-medium">Product Name</th>
                      <th className="py-3 font-medium text-right">Total Sold</th>
                      <th className="py-3 font-medium text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loadingSales && salesData?.map((item) => (
                      <tr key={item.productId} className="border-b border-border/20 print:border-gray-300">
                        <td className="py-3 font-medium">{item.productName}</td>
                        <td className="py-3 text-right font-mono">{item.totalQty}</td>
                        <td className="py-3 text-right font-mono font-bold text-primary print:text-black">{formatCurrency(item.totalRevenue)}</td>
                      </tr>
                    ))}
                    {!loadingSales && salesData?.length === 0 && (
                      <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">No data for selected period</td></tr>
                    )}
                  </tbody>
                  {!loadingSales && salesData && salesData.length > 0 && (
                    <tfoot className="border-t-2 border-border print:border-black font-bold text-lg">
                      <tr>
                        <td className="py-4">TOTAL</td>
                        <td className="py-4 text-right font-mono">{salesData.reduce((acc, curr) => acc + curr.totalQty, 0)}</td>
                        <td className="py-4 text-right font-mono text-primary print:text-black">{formatCurrency(salesData.reduce((acc, curr) => acc + curr.totalRevenue, 0))}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="mt-6 print:hidden">
            <Card className="border-border bg-transparent shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl text-primary uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Ingredient Usage Report
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase border-b-2 border-border/50 text-muted-foreground">
                    <tr>
                      <th className="py-3 font-medium">Ingredient Name</th>
                      <th className="py-3 font-medium text-right">Total Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loadingUsage && usageData?.map((item) => (
                      <tr key={item.ingredientId} className="border-b border-border/20">
                        <td className="py-3 font-medium">{item.ingredientName}</td>
                        <td className="py-3 text-right font-mono font-bold">{item.totalUsed} <span className="text-xs text-muted-foreground font-normal">{item.unit}</span></td>
                      </tr>
                    ))}
                    {!loadingUsage && usageData?.length === 0 && (
                      <tr><td colSpan={2} className="py-6 text-center text-muted-foreground">No data for selected period</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wasting" className="mt-6 print:hidden">
            <Card className="border-border bg-transparent shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl text-primary uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Wasting Report
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase border-b-2 border-border/50 text-muted-foreground">
                    <tr>
                      <th className="py-3 font-medium">Date</th>
                      <th className="py-3 font-medium">Ingredient</th>
                      <th className="py-3 font-medium">Reason</th>
                      <th className="py-3 font-medium text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loadingWasting && wastingData?.map((item) => (
                      <tr key={item.id} className="border-b border-border/20">
                        <td className="py-3">{formatShortDate(item.wastingDate)}</td>
                        <td className="py-3 font-medium">{item.ingredientName}</td>
                        <td className="py-3 text-muted-foreground">{item.reason}</td>
                        <td className="py-3 text-right font-mono text-destructive">{item.qty} <span className="text-xs text-muted-foreground font-normal">{item.unit}</span></td>
                      </tr>
                    ))}
                    {!loadingWasting && wastingData?.length === 0 && (
                      <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No data for selected period</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lowstock" className="mt-6 print:hidden">
            <Card className="border-border bg-transparent shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl text-destructive uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase border-b-2 border-border/50 text-muted-foreground">
                    <tr>
                      <th className="py-3 font-medium">Ingredient Name</th>
                      <th className="py-3 font-medium">Category</th>
                      <th className="py-3 font-medium text-right">Min Stock</th>
                      <th className="py-3 font-medium text-right text-destructive">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loadingLowStock && lowStockData?.map((item) => (
                      <tr key={item.id} className="border-b border-border/20 bg-destructive/5">
                        <td className="py-3 font-medium text-destructive">{item.name}</td>
                        <td className="py-3 text-muted-foreground">{item.category}</td>
                        <td className="py-3 text-right font-mono">{item.stockMinimum} <span className="text-xs text-muted-foreground">{item.unit}</span></td>
                        <td className="py-3 text-right font-mono font-bold text-destructive">{item.currentStock} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span></td>
                      </tr>
                    ))}
                    {!loadingLowStock && lowStockData?.length === 0 && (
                      <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No low stock items currently</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-section, .print-section * { visibility: visible; }
          .print-section { position: absolute; left: 0; top: 0; width: 100%; color: black; background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
}
