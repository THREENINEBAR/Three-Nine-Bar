import { useState, useMemo } from "react";
import { 
  useListIngredients, 
  useCreateIngredient, 
  useUpdateIngredient, 
  useDeleteIngredient,
  useListRecipes,
  getListIngredientsQueryKey
} from "@workspace/api-client-react";
import { Ingredient } from "@workspace/api-client-react/src/generated/api.schemas";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Search, Edit, Trash, AlertCircle, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

export default function IngredientsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  
  const { data: ingredients, isLoading } = useListIngredients();
  const { data: recipes } = useListRecipes();
  const createMutation = useCreateIngredient();
  const updateMutation = useUpdateIngredient();
  const deleteMutation = useDeleteIngredient();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingName, setDeletingName] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "Spirit",
    unit: "ml",
    stockInitial: 0,
    stockMinimum: 0,
  });

  const filteredData = useMemo(() => {
    if (!ingredients) return [];
    if (!search) return ingredients;
    return ingredients.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      item.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [ingredients, search]);

  // Check if an ingredient is used in any recipe
  const getRecipesUsingIngredient = (ingredientId: number) => {
    if (!recipes) return [];
    return recipes.filter(r => r.details?.some(d => d.ingredientId === ingredientId));
  };

  const handleOpenForm = (item?: Ingredient) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        unit: item.unit,
        stockInitial: item.stockInitial,
        stockMinimum: item.stockMinimum,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        category: "Spirit",
        unit: "ml",
        stockInitial: 0,
        stockMinimum: 1000,
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }

    const payload = {
      ...formData,
      stockInitial: Number(formData.stockInitial),
      stockMinimum: Number(formData.stockMinimum)
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListIngredientsQueryKey() });
          toast({ title: "Berhasil", description: "Bahan berhasil diupdate" });
          setIsFormOpen(false);
        },
        onError: () => {
          toast({ title: "Error", description: "Gagal mengupdate bahan", variant: "destructive" });
        }
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListIngredientsQueryKey() });
          toast({ title: "Berhasil", description: "Bahan berhasil ditambahkan" });
          setIsFormOpen(false);
        },
        onError: () => {
          toast({ title: "Error", description: "Gagal menambahkan bahan", variant: "destructive" });
        }
      });
    }
  };

  const handleConfirmDelete = (item: Ingredient) => {
    setDeletingId(item.id);
    setDeletingName(item.name);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!deletingId) return;
    deleteMutation.mutate({ id: deletingId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListIngredientsQueryKey() });
        toast({ title: "Berhasil", description: "Bahan berhasil dihapus" });
        setIsDeleteOpen(false);
        setDeletingId(null);
        setDeletingName("");
      },
      onError: () => {
        toast({ title: "Error", description: "Gagal menghapus bahan", variant: "destructive" });
        setIsDeleteOpen(false);
      }
    });
  };

  if (!isAdmin) {
    return <div className="p-8 text-destructive">Unauthorized access</div>;
  }

  const usedInRecipes = deletingId ? getRecipesUsingIngredient(deletingId) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Data Bahan</h1>
          <p className="text-muted-foreground mt-1">Kelola bahan baku dan batas minimum stock.</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="bg-primary text-primary-foreground font-semibold tracking-wide uppercase">
          <Plus className="mr-2 h-4 w-4" /> Tambah Bahan
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-sidebar/30">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari bahan..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-sidebar/80 text-muted-foreground sticky top-0">
              <tr>
                <th className="px-6 py-4 font-medium">Nama Bahan</th>
                <th className="px-6 py-4 font-medium">Kategori</th>
                <th className="px-6 py-4 font-medium text-right">Stock Saat Ini</th>
                <th className="px-6 py-4 font-medium text-right">Min Stock</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Tidak ada bahan ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-sidebar/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{item.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.category}</td>
                    <td className="px-6 py-4 text-right font-mono">
                      {item.currentStock} <span className="text-xs text-muted-foreground">{item.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-muted-foreground">
                      {item.stockMinimum} <span className="text-xs">{item.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.isLowStock ? (
                        <Badge variant="destructive" className="uppercase tracking-wider font-bold text-[10px]">
                          <AlertCircle className="mr-1 h-3 w-3" /> Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 uppercase tracking-wider font-bold text-[10px]">
                          Normal
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleOpenForm(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleConfirmDelete(item)}>
                          <Trash className="h-4 w-4" />
                        </Button>
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
              {editingItem ? 'Edit Bahan' : 'Tambah Bahan'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto overscroll-contain flex-1">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Nama Bahan</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="bg-background"
                  placeholder="cth. Absolut Vodka"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category" className="text-xs uppercase tracking-wider text-muted-foreground">Kategori</Label>
                  <Input 
                    id="category" 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    className="bg-background"
                    placeholder="cth. Spirit"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit" className="text-xs uppercase tracking-wider text-muted-foreground">Satuan</Label>
                  <Input 
                    id="unit" 
                    value={formData.unit} 
                    onChange={e => setFormData({...formData, unit: e.target.value})} 
                    className="bg-background"
                    placeholder="cth. ml"
                  />
                </div>
              </div>
              {!editingItem && (
                <div className="grid gap-2">
                  <Label htmlFor="stockInitial" className="text-xs uppercase tracking-wider text-muted-foreground">Stock Awal</Label>
                  <Input 
                    id="stockInitial" 
                    type="number"
                    value={formData.stockInitial} 
                    onChange={e => setFormData({...formData, stockInitial: Number(e.target.value)})} 
                    className="bg-background font-mono"
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="stockMinimum" className="text-xs uppercase tracking-wider text-muted-foreground">Min Stock</Label>
                <Input 
                  id="stockMinimum" 
                  type="number"
                  value={formData.stockMinimum} 
                  onChange={e => setFormData({...formData, stockMinimum: Number(e.target.value)})} 
                  className="bg-background font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setIsFormOpen(false)} className="border-border">Batal</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary text-primary-foreground font-semibold">
              {(createMutation.isPending || updateMutation.isPending) ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={open => { setIsDeleteOpen(open); if (!open) { setDeletingId(null); setDeletingName(""); } }}>
        <AlertDialogContent className="bg-card border-destructive/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Hapus Bahan
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  Yakin ingin menghapus <span className="font-semibold text-foreground">"{deletingName}"</span>?
                </p>
                {usedInRecipes.length > 0 && (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-amber-400 text-sm">
                    <p className="font-semibold mb-1">⚠ Bahan ini digunakan di {usedInRecipes.length} resep:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-amber-300/80">
                      {usedInRecipes.map(r => (
                        <li key={r.id}>{r.productName}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-amber-400/70">Bahan akan dihapus dari resep tersebut. Data wasting dan riwayat stock juga akan terhapus.</p>
                  </div>
                )}
                {usedInRecipes.length === 0 && (
                  <p className="text-sm">Data wasting dan riwayat stock bahan ini juga akan terhapus. Tindakan ini tidak bisa dibatalkan.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
