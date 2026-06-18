import { useState, useMemo } from "react";
import { 
  useListRecipes, 
  useCreateRecipe, 
  useUpdateRecipe, 
  useDeleteRecipe,
  useListProducts,
  useListIngredients,
  getListRecipesQueryKey
} from "@workspace/api-client-react";
import { Recipe, RecipeDetailInput } from "@workspace/api-client-react/src/generated/api.schemas";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Search, Edit, Trash, ChevronDown, ChevronUp 
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
import { ScrollArea } from "@/components/ui/scroll-area";

export default function RecipesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  
  const { data: recipes, isLoading: isLoadingRecipes } = useListRecipes();
  const { data: products } = useListProducts();
  const { data: ingredients } = useListIngredients();
  
  const createMutation = useCreateRecipe();
  const updateMutation = useUpdateRecipe();
  const deleteMutation = useDeleteRecipe();

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Recipe | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
  const [productId, setProductId] = useState<string>("");
  const [details, setDetails] = useState<RecipeDetailInput[]>([]);

  const filteredData = useMemo(() => {
    if (!recipes) return [];
    if (!search) return recipes;
    return recipes.filter(item => 
      item.productName.toLowerCase().includes(search.toLowerCase())
    );
  }, [recipes, search]);

  const toggleRow = (id: number) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenForm = (item?: Recipe) => {
    if (item) {
      setEditingItem(item);
      setProductId(item.productId.toString());
      setDetails(item.details?.map(d => ({
        ingredientId: d.ingredientId,
        quantity: d.quantity
      })) || []);
    } else {
      setEditingItem(null);
      setProductId("");
      setDetails([]);
    }
    setIsFormOpen(true);
  };

  const addIngredientRow = () => {
    if (ingredients && ingredients.length > 0) {
      setDetails([...details, { ingredientId: ingredients[0].id, quantity: 0 }]);
    }
  };

  const updateIngredientRow = (index: number, field: keyof RecipeDetailInput, value: number) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  const removeIngredientRow = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!productId) {
      toast({ title: "Error", description: "Product is required", variant: "destructive" });
      return;
    }
    if (details.length === 0) {
      toast({ title: "Error", description: "At least one ingredient is required", variant: "destructive" });
      return;
    }

    const payload = {
      productId: Number(productId),
      details: details.map(d => ({
        ingredientId: Number(d.ingredientId),
        quantity: Number(d.quantity)
      }))
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
          toast({ title: "Success", description: "Recipe updated successfully" });
          setIsFormOpen(false);
        }
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
          toast({ title: "Success", description: "Recipe created successfully" });
          setIsFormOpen(false);
        }
      });
    }
  };

  const handleDelete = () => {
    if (!deletingId) return;
    deleteMutation.mutate({ id: deletingId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
        toast({ title: "Success", description: "Recipe deleted successfully" });
        setIsDeleteOpen(false);
      }
    });
  };

  if (!isAdmin) {
    return <div className="p-8 text-destructive">Unauthorized access</div>;
  }

  // Filter products that don't have recipes yet (for creation)
  const availableProducts = useMemo(() => {
    if (!products) return [];
    if (editingItem) {
      // Include the currently editing product
      return products.filter(p => !recipes?.find(r => r.productId === p.id && r.id !== editingItem.id));
    }
    return products.filter(p => !recipes?.find(r => r.productId === p.id));
  }, [products, recipes, editingItem]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Data Resep</h1>
          <p className="text-muted-foreground mt-1">Manage cocktail recipes and ingredient measurements.</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="bg-primary text-primary-foreground font-semibold tracking-wide uppercase">
          <Plus className="mr-2 h-4 w-4" /> Add Recipe
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-sidebar/30">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search recipes by product..." 
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
                <th className="px-6 py-4 font-medium w-10"></th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium text-center">Ingredients Count</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingRecipes ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No recipes found.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr className="border-b border-border/50 hover:bg-sidebar/30 transition-colors">
                      <td className="px-6 py-4">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => toggleRow(item.id)}>
                          {expandedRows[item.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </td>
                      <td className="px-6 py-4 font-medium text-primary text-base">{item.productName}</td>
                      <td className="px-6 py-4 text-center font-mono">{item.details?.length || 0}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleOpenForm(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setDeletingId(item.id); setIsDeleteOpen(true); }}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows[item.id] && (
                      <tr className="bg-sidebar/20 border-b border-border/50">
                        <td colSpan={4} className="p-0">
                          <div className="px-14 py-4">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recipe Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {item.details?.map(detail => (
                                <div key={detail.id} className="flex justify-between items-center bg-card p-3 rounded-md border border-border">
                                  <span className="font-medium text-foreground">{detail.ingredientName}</span>
                                  <span className="font-mono text-primary font-semibold">{detail.quantity} <span className="text-xs text-muted-foreground">{detail.unit}</span></span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl uppercase tracking-wider text-primary">
              {editingItem ? 'Edit Recipe' : 'Tambah Recipe'}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Product</Label>
                <Select value={productId} onValueChange={setProductId} disabled={!!editingItem}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Ingredients</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addIngredientRow} className="h-8 text-xs border-primary/20 text-primary hover:bg-primary/10">
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>

                {details.map((detail, index) => (
                  <div key={index} className="flex items-end gap-3 bg-sidebar/30 p-3 rounded-md border border-border/50">
                    <div className="grid gap-2 flex-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Ingredient</Label>
                      <Select 
                        value={detail.ingredientId.toString()} 
                        onValueChange={(val) => updateIngredientRow(index, 'ingredientId', Number(val))}
                      >
                        <SelectTrigger className="bg-background h-9">
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients?.map(i => (
                            <SelectItem key={i.id} value={i.id.toString()}>{i.name} ({i.unit})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2 w-24">
                      <Label className="text-[10px] uppercase text-muted-foreground">Qty</Label>
                      <Input 
                        type="number" 
                        value={detail.quantity} 
                        onChange={(e) => updateIngredientRow(index, 'quantity', Number(e.target.value))}
                        className="bg-background h-9 font-mono"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => removeIngredientRow(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {details.length === 0 && (
                  <div className="text-center p-6 border border-dashed border-border rounded-md text-muted-foreground text-sm">
                    No ingredients added yet. Click Add to add ingredients.
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="mt-4 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setIsFormOpen(false)} className="border-border">Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary text-primary-foreground font-semibold">
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Recipe"}
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
              This will permanently delete the recipe. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
