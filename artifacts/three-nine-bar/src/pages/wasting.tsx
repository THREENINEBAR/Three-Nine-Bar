import { useState, useMemo } from "react";
import { 
  useListWasting, 
  useCreateWasting, 
  useUpdateWasting,
  useDeleteWasting,
  useListIngredients,
  getListWastingQueryKey
} from "@workspace/api-client-react";
import { Wasting } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Edit, Trash, CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { format } from "date-fns";

const WASTING_REASONS = [
  "Pecah/Tumpah",
  "Expired",
  "Salah Produksi",
  "Lainnya"
];

export default function WastingPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Date range filter
  const [startDate, setStartDate] = useState<string>(format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const { data: wastingData, isLoading } = useListWasting({ startDate, endDate });
  const { data: ingredients } = useListIngredients();
  
  const createMutation = useCreateWasting();
  const updateMutation = useUpdateWasting();
  const deleteMutation = useDeleteWasting();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Wasting | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    wastingDate: format(new Date(), 'yyyy-MM-dd'),
    ingredientId: "",
    qty: 0,
    reason: WASTING_REASONS[0],
    notes: "",
  });

  const handleOpenForm = (item?: Wasting) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        wastingDate: format(new Date(item.wastingDate), 'yyyy-MM-dd'),
        ingredientId: item.ingredientId.toString(),
        qty: item.qty,
        reason: item.reason,
        notes: item.notes || "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        wastingDate: format(new Date(), 'yyyy-MM-dd'),
        ingredientId: "",
        qty: 0,
        reason: WASTING_REASONS[0],
        notes: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.ingredientId) {
      toast({ title: "Error", description: "Ingredient is required", variant: "destructive" });
      return;
    }
    if (formData.qty <= 0) {
      toast({ title: "Error", description: "Quantity must be greater than 0", variant: "destructive" });
      return;
    }

    const payload = {
      wastingDate: formData.wastingDate,
      ingredientId: Number(formData.ingredientId),
      qty: Number(formData.qty),
      reason: formData.reason,
      notes: formData.notes
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWastingQueryKey() });
          toast({ title: "Success", description: "Wasting record updated" });
          setIsFormOpen(false);
        }
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWastingQueryKey() });
          toast({ title: "Success", description: "Wasting recorded successfully" });
          setIsFormOpen(false);
        },
        onError: (error: any) => {
          toast({ 
            title: "Error", 
            description: error?.error || "Insufficient stock", 
            variant: "destructive" 
          });
        }
      });
    }
  };

  const handleDelete = () => {
    if (!deletingId) return;
    deleteMutation.mutate({ id: deletingId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWastingQueryKey() });
        toast({ title: "Success", description: "Record deleted and stock reverted" });
        setIsDeleteOpen(false);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Wasting</h1>
          <p className="text-muted-foreground mt-1">Record lost, spilled, or expired ingredients.</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="bg-primary text-primary-foreground font-semibold tracking-wide uppercase">
          <Plus className="mr-2 h-4 w-4" /> Add Record
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
                <th className="px-6 py-4 font-medium">Ingredient</th>
                <th className="px-6 py-4 font-medium text-right">Quantity</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium hidden md:table-cell">Notes</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4 hidden md:table-cell"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : !wastingData || wastingData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No wasting records found.
                  </td>
                </tr>
              ) : (
                wastingData.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-sidebar/30 transition-colors">
                    <td className="px-6 py-4">{formatShortDate(item.wastingDate)}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{item.ingredientName}</td>
                    <td className="px-6 py-4 text-right font-mono text-destructive">
                      {item.qty} <span className="text-xs">{item.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        {item.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                      {item.notes || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleOpenForm(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setDeletingId(item.id); setIsDeleteOpen(true); }}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[425px] flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl uppercase tracking-wider text-primary">
              {editingItem ? 'Edit Wasting' : 'Record Wasting'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto overscroll-contain flex-1">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
                <Input 
                  type="date"
                  value={formData.wastingDate} 
                  onChange={e => setFormData({...formData, wastingDate: e.target.value})} 
                  className="bg-background"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Ingredient</Label>
                <SearchableSelect
                  options={(ingredients ?? []).map(i => ({
                    value: i.id.toString(),
                    label: i.name,
                    sublabel: `${i.currentStock} ${i.unit} tersedia`,
                  }))}
                  value={formData.ingredientId}
                  onValueChange={val => setFormData({...formData, ingredientId: val})}
                  placeholder="Pilih bahan..."
                  searchPlaceholder="Cari bahan..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quantity</Label>
                  <Input 
                    type="number"
                    min="0.1"
                    step="any"
                    value={formData.qty} 
                    onChange={e => setFormData({...formData, qty: Number(e.target.value)})} 
                    className="bg-background font-mono"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Reason</Label>
                  <SearchableSelect
                    options={WASTING_REASONS.map(r => ({ value: r, label: r }))}
                    value={formData.reason}
                    onValueChange={val => setFormData({...formData, reason: val})}
                    placeholder="Pilih alasan..."
                    searchPlaceholder="Cari alasan..."
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes (Optional)</Label>
                <Textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="bg-background resize-none"
                  rows={3}
                  placeholder="Additional details..."
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setIsFormOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary text-primary-foreground font-semibold">
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Record"}
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
              This will permanently delete the wasting record and REVERT the deducted stock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? "Deleting..." : "Delete Record"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
