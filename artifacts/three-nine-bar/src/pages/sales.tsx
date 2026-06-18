import { useState, useMemo } from "react";
import { 
  useListSales, 
  useCreateSale, 
  useDeleteSale,
  useListProducts,
  getListSalesQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Trash, CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function SalesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Date range filter
  const [startDate, setStartDate] = useState<string>(format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const { data: sales, isLoading } = useListSales({ startDate, endDate });
  const { data: products } = useListProducts();
  
  const createMutation = useCreateSale();
  const deleteMutation = useDeleteSale();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    saleDate: format(new Date(), 'yyyy-MM-dd'),
    productId: "",
    qty: 1,
  });

  const handleOpenForm = () => {
    setFormData({
      saleDate: format(new Date(), 'yyyy-MM-dd'),
      productId: "",
      qty: 1,
    });
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.productId) {
      toast({ title: "Error", description: "Product is required", variant: "destructive" });
      return;
    }
    if (formData.qty <= 0) {
      toast({ title: "Error", description: "Quantity must be greater than 0", variant: "destructive" });
      return;
    }

    const payload = {
      saleDate: formData.saleDate,
      productId: Number(formData.productId),
      qty: Number(formData.qty)
    };

    createMutation.mutate({ data: payload }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() });
        toast({ title: "Success", description: "Sale recorded successfully" });
        setIsFormOpen(false);
      },
      onError: (error: any) => {
        toast({ 
          title: "Sale Failed", 
          description: error?.error || "An error occurred", 
          variant: "destructive" 
        });
      }
    });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    deleteMutation.mutate({ id: deletingId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() });
        toast({ title: "Success", description: "Sale deleted successfully" });
        setIsDeleteOpen(false);
      }
    });
  };

  // Only active products for new sales
  const activeProducts = useMemo(() => {
    return products?.filter(p => p.isActive) || [];
  }, [products]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Product Sale</h1>
          <p className="text-muted-foreground mt-1">Record sales and deduct ingredients automatically.</p>
        </div>
        <Button onClick={handleOpenForm} className="bg-primary text-primary-foreground font-semibold tracking-wide uppercase">
          <Plus className="mr-2 h-4 w-4" /> Record Sale
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap gap-4 items-end bg-sidebar/30">
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-sidebar/80 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium text-right">Quantity</th>
                <th className="px-6 py-4 font-medium text-right">Total Price</th>
                {isAdmin && <th className="px-6 py-4 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24 ml-auto" /></td>
                    {isAdmin && <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto" /></td>}
                  </tr>
                ))
              ) : !sales || sales.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-muted-foreground">
                    No sales found in this period.
                  </td>
                </tr>
              ) : (
                sales.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-sidebar/30 transition-colors">
                    <td className="px-6 py-4">{formatShortDate(item.saleDate)}</td>
                    <td className="px-6 py-4 font-medium text-primary">{item.productName}</td>
                    <td className="px-6 py-4 text-right font-mono">{item.qty}</td>
                    <td className="px-6 py-4 text-right font-mono font-medium">{formatCurrency(item.totalPrice)}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setDeletingId(item.id); setIsDeleteOpen(true); }}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
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
              Record Sale
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
              <Input 
                type="date"
                value={formData.saleDate} 
                onChange={e => setFormData({...formData, saleDate: e.target.value})} 
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Product</Label>
              <Select value={formData.productId} onValueChange={val => setFormData({...formData, productId: val})}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {activeProducts.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name} - {formatCurrency(p.price)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quantity</Label>
              <Input 
                type="number"
                min="1"
                value={formData.qty} 
                onChange={e => setFormData({...formData, qty: Number(e.target.value)})} 
                className="bg-background font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending} className="bg-primary text-primary-foreground font-semibold">
              {createMutation.isPending ? "Processing..." : "Submit Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-card border-destructive/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive uppercase tracking-wider">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the sale and REVERT the deducted ingredients.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? "Deleting..." : "Delete Sale"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
