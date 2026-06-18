import { useGetDashboard } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Wine, ShoppingCart, Trash2, AlertTriangle, TrendingUp, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useGetDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full bg-sidebar" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full bg-sidebar" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-96 w-full bg-sidebar" />
          <Skeleton className="h-96 w-full bg-sidebar" />
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your inventory and sales.</p>
        </div>
      </div>

      {/* Row 1: Inventory & Sales Summary */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 ml-1">Ringkasan Inventori</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Bahan</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{dashboard.totalIngredients}</div>
              <p className="text-xs text-muted-foreground mt-1">Jenis bahan</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Product</CardTitle>
              <Wine className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{dashboard.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">Jenis minuman</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Penjualan Hari Ini</CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(dashboard.totalSalesToday)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total revenue</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-md border-destructive/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive uppercase tracking-wider">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{dashboard.totalLowStock}</div>
              <p className="text-xs text-muted-foreground mt-1">Bahan perlu restock</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Row 2: Today's Stock Movement */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 ml-1">Pergerakan Stock Hari Ini</p>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card border-primary/20 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary uppercase tracking-wider">Stock Masuk</CardTitle>
              <ArrowDownToLine className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary font-mono">{dashboard.stockInToday.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total qty IN hari ini</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-orange-500/20 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-400 uppercase tracking-wider">Stock Keluar</CardTitle>
              <ArrowUpFromLine className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400 font-mono">{dashboard.stockOutToday.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total qty OUT hari ini</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-destructive/20 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive uppercase tracking-wider">Total Wasting</CardTitle>
              <Trash2 className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive font-mono">{dashboard.wastingQtyToday.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total qty wasting hari ini</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border shadow-md col-span-1">
          <CardHeader>
            <CardTitle className="text-lg uppercase tracking-wider text-primary flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Sales by Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.salesChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="productName" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp ${value / 1000}k`} />
                  <Tooltip
                    cursor={{fill: '#222'}}
                    contentStyle={{backgroundColor: '#111', borderColor: '#333', color: '#fff'}}
                    itemStyle={{color: '#D4AF37'}}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="totalRevenue" radius={[4, 4, 0, 0]}>
                    {dashboard.salesChart.map((_, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-md col-span-1">
          <CardHeader>
            <CardTitle className="text-lg uppercase tracking-wider text-primary flex items-center gap-2">
              <Package className="h-5 w-5" /> Ingredient Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.ingredientUsageChart} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis type="number" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="ingredientName" type="category" stroke="#888" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip
                    cursor={{fill: '#222'}}
                    contentStyle={{backgroundColor: '#111', borderColor: '#333', color: '#fff'}}
                    itemStyle={{color: '#D4AF37'}}
                    formatter={(value: number, _name: string, props: { payload?: { unit?: string } }) => [`${value} ${props.payload?.unit ?? ''}`, 'Used']}
                  />
                  <Bar dataKey="totalUsed" radius={[0, 4, 4, 0]}>
                    {dashboard.ingredientUsageChart.map((_, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--sidebar-primary))" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-lg uppercase tracking-wider text-primary">Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs uppercase bg-sidebar/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-border/50 hover:bg-sidebar/30 transition-colors">
                    <td className="px-4 py-3">{new Date(sale.saleDate).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3 font-medium text-primary">{sale.productName}</td>
                    <td className="px-4 py-3 text-right">{sale.qty}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(sale.totalPrice)}</td>
                  </tr>
                ))}
                {dashboard.recentSales.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No recent sales found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
