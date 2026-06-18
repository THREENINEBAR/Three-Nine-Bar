import { useState, useMemo } from "react";
import { 
  useGetStockOpname, 
  useAddStock,
  getGetStockOpnameQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Search, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function StockOpnamePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  
  const { data: stockOpname, isLoading } = useGetStockOpname();
  const addStockMutation = useAddStock();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<{id: number, name: string, unit: string} | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    qty: 0,
    notes: "",
  });

  const filteredData = useMemo(() => {
    if (!stockOpname) return [];
    if (!search) return stockOpname;
    return stockOpname.filter(item => 
      item.ingredientName.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [stockOpname, search]);

  const handleOpenForm = (item: {ingredientId: number, ingredientName: string, unit: string}) => {
    setSelectedIngredient({
      id: item.ingredientId,
      name: item.ingredientName,
      unit: item.unit
    });
    setFormData({
      qty: 0,
      notes: "",
    });
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!selectedIngredient) return;
    if (formData.qty <= 0) {
      toast({ title: "Error", description: "Quantity must be greater than 0", variant: "destructive" });
      return;
    }

    const payload = {
      ingredientId: selectedIngredient.id,
      qty: Number(formData.qty),
      notes: formData.notes
    };

    addStockMutation.mutate({ data: payload }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStockOpnameQueryKey() });
        toast({ title: "Success", description: "Stock added successfully" });
        setIsFormOpen(false);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Stock Opname</h1>
          <p className="text-muted-foreground mt-1">Real-time inventory movement overview.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-sidebar/30">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search ingredients..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-sidebar/80 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Nama Bahan</th>
                <th className="px-4 py-4 font-medium text-right">Awal</th>
                <th className="px-4 py-4 font-medium text-right text-primary">In</th>
                <th className="px-4 py-4 font-medium text-right text-destructive">Out</th>
                <th className="px-4 py-4 font-medium text-right text-destructive">Wasting</th>
                <th className="px-6 py-4 font-medium text-right text-base text-foreground">Stock Akhir</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const isLow = item.isLowStock;
                  return (
                    <tr 
                      key={item.ingredientId} 
                      className={`border-b border-border/50 transition-colors
                        ${isLow ? 'bg-destructive/5 hover:bg-destructive/10 border-destructive/20' : 'hover:bg-sidebar/30'}
                      `}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isLow ? 'text-destructive' : 'text-foreground'}`}>
                            {item.ingredientName}
                          </span>
                          {isLow && (
                            <Badge variant="destructive" className="uppercase tracking-wider font-bold text-[9px] py-0 h-4">
                              <AlertCircle className="mr-1 h-2 w-2" /> Low Stock
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{item.category}</div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono">{item.stockInitial}</td>
                      <td className="px-4 py-4 text-right font-mono text-primary">+{item.stockIn}</td>
                      <td className="px-4 py-4 text-right font-mono text-destructive">-{item.stockOut}</td>
                      <td className="px-4 py-4 text-right font-mono text-destructive">-{item.stockWasting}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-base">
                        {item.stockFinal} <span className="text-xs text-muted-foreground font-normal">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground font-semibold uppercase tracking-wider text-[10px]"
                          onClick={() => handleOpenForm(item)}
                        >
                          <Plus className="mr-1 h-3 w-3" /> Add IN
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl uppercase tracking-wider text-primary">
              Add Stock In
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{selectedIngredient?.name}</p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quantity ({selectedIngredient?.unit})</Label>
              <Input 
                type="number"
                min="0.1"
                step="any"
                value={formData.qty} 
                onChange={e => setFormData({...formData, qty: Number(e.target.value)})} 
                className="bg-background font-mono text-lg"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes (Optional)</Label>
              <Textarea 
                value={formData.notes} 
                onChange={e => setFormData({...formData, notes: e.target.value})} 
                className="bg-background resize-none"
                rows={3}
                placeholder="e.g. Received from Supplier X"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handleSave} disabled={addStockMutation.isPending} className="bg-primary text-primary-foreground font-semibold">
              {addStockMutation.isPending ? "Adding..." : "Add Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
