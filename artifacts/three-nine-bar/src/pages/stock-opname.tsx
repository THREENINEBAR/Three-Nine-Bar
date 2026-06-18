import { useState, useMemo } from "react";
import {
  useGetStockOpname,
  getGetStockOpnameQueryKey,
  getListIngredientsQueryKey,
} from "@workspace/api-client-react";
import type { StockOpname } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
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
import { Label } from "@/components/ui/label";

const today = new Date().toISOString().split("T")[0];

async function postStockInitial(data: { ingredientId: number; qty: number; date: string; notes?: string }) {
  const res = await fetch("/api/stock/initial", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Gagal menyimpan stock awal");
  return res.json();
}

async function postStockIn(data: { ingredientId: number; qty: number; date: string; notes?: string }) {
  const res = await fetch("/api/stock/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Gagal menyimpan barang masuk");
  return res.json();
}

export default function StockOpnamePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: opnameData, isLoading } = useGetStockOpname({ date: selectedDate });

  // Stock Awal modal
  const [isInitialOpen, setIsInitialOpen] = useState(false);
  const [initialIngredient, setInitialIngredient] = useState<StockOpname | null>(null);
  const [initialForm, setInitialForm] = useState({ date: today, qty: "" as string | number, notes: "" });

  // IN modal
  const [isInOpen, setIsInOpen] = useState(false);
  const [inIngredient, setInIngredient] = useState<StockOpname | null>(null);
  const [inForm, setInForm] = useState({ date: today, qty: "" as string | number, notes: "" });

  const stockInitialMutation = useMutation({
    mutationFn: postStockInitial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetStockOpnameQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListIngredientsQueryKey() });
      toast({ title: "Stock Awal Disimpan", description: "Stock awal berhasil diinput." });
      setIsInitialOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal menyimpan stock awal", variant: "destructive" });
    },
  });

  const stockInMutation = useMutation({
    mutationFn: postStockIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetStockOpnameQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListIngredientsQueryKey() });
      toast({ title: "Barang Masuk Disimpan", description: "Barang masuk berhasil diinput." });
      setIsInOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal menyimpan barang masuk", variant: "destructive" });
    },
  });

  const filteredOpname = useMemo(() => {
    if (!opnameData) return [];
    if (!search) return opnameData;
    return opnameData.filter(item =>
      item.ingredientName.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [opnameData, search]);

  const handleOpenInitial = (item: StockOpname) => {
    setInitialIngredient(item);
    setInitialForm({ date: selectedDate, qty: "", notes: "" });
    setIsInitialOpen(true);
  };

  const handleOpenIn = (item: StockOpname) => {
    setInIngredient(item);
    setInForm({ date: selectedDate, qty: "", notes: "" });
    setIsInOpen(true);
  };

  const handleSaveInitial = () => {
    if (!initialIngredient) return;
    const qty = Number(initialForm.qty);
    if (!qty || qty <= 0) {
      toast({ title: "Error", description: "Qty harus lebih dari 0", variant: "destructive" });
      return;
    }
    stockInitialMutation.mutate({
      ingredientId: initialIngredient.ingredientId,
      qty,
      date: initialForm.date,
      notes: initialForm.notes || "Opening Shift",
    });
  };

  const handleSaveIn = () => {
    if (!inIngredient) return;
    const qty = Number(inForm.qty);
    if (!qty || qty <= 0) {
      toast({ title: "Error", description: "Qty harus lebih dari 0", variant: "destructive" });
      return;
    }
    stockInMutation.mutate({
      ingredientId: inIngredient.ingredientId,
      qty,
      date: inForm.date,
      notes: inForm.notes || "Ambil dari Gudang",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Stock Opname</h1>
          <p className="text-muted-foreground mt-1">Kelola dan pantau pergerakan stok bahan.</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari bahan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-background border-border"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap uppercase tracking-wider">Tanggal:</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-background border-border h-9 text-sm w-auto"
          />
        </div>
      </div>

      {/* Stock Opname Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-sidebar/80 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Nama Bahan</th>
                <th className="px-4 py-4 font-medium text-center">Stock Awal</th>
                <th className="px-4 py-4 font-medium text-center text-primary">IN</th>
                <th className="px-4 py-4 font-medium text-center text-orange-400">OUT</th>
                <th className="px-4 py-4 font-medium text-center text-destructive">Wasting</th>
                <th className="px-6 py-4 font-medium text-right text-foreground">Stock Akhir</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredOpname.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Tidak ada data untuk tanggal ini.
                  </td>
                </tr>
              ) : (
                filteredOpname.map(item => (
                  <tr
                    key={item.ingredientId}
                    className="border-b border-border/50 hover:bg-sidebar/30 transition-colors"
                  >
                    {/* Nama Bahan */}
                    <td className="px-6 py-3">
                      <div className="font-medium text-foreground">{item.ingredientName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.category} · {item.unit}</div>
                    </td>

                    {/* Stock Awal */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono text-muted-foreground font-medium">
                          {item.stockInitial > 0 ? item.stockInitial.toLocaleString() : <span className="text-border">—</span>}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border hover:border-primary/40"
                          onClick={() => handleOpenInitial(item)}
                          title="Input Stock Awal"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>

                    {/* IN */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono text-primary font-medium">
                          {item.stockIn > 0 ? `+${item.stockIn.toLocaleString()}` : <span className="text-border">—</span>}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border hover:border-primary/40"
                          onClick={() => handleOpenIn(item)}
                          title="Tambah Barang Masuk"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>

                    {/* OUT — read only */}
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono text-orange-400">
                        {item.stockOut > 0 ? `-${item.stockOut.toLocaleString()}` : <span className="text-border">—</span>}
                      </span>
                    </td>

                    {/* Wasting — read only */}
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono text-destructive">
                        {item.stockWasting > 0 ? `-${item.stockWasting.toLocaleString()}` : <span className="text-border">—</span>}
                      </span>
                    </td>

                    {/* Stock Akhir — read only */}
                    <td className="px-6 py-3 text-right">
                      <span className="font-mono font-bold text-base text-foreground">
                        {item.stockFinal.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground font-normal ml-1">{item.unit}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: Input Stock Awal ── */}
      <Dialog open={isInitialOpen} onOpenChange={setIsInitialOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-xl uppercase tracking-wider text-primary">Input Stock Awal</DialogTitle>
            <p className="text-sm text-muted-foreground font-medium">{initialIngredient?.ingredientName}</p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tanggal</Label>
              <Input
                type="date"
                value={initialForm.date}
                onChange={e => setInitialForm({ ...initialForm, date: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Qty Stock Awal ({initialIngredient?.unit})
              </Label>
              <Input
                type="number"
                min="0.1"
                step="any"
                placeholder="0"
                value={initialForm.qty}
                onChange={e => setInitialForm({ ...initialForm, qty: e.target.value })}
                className="bg-background font-mono text-lg"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Keterangan</Label>
              <Textarea
                value={initialForm.notes}
                onChange={e => setInitialForm({ ...initialForm, notes: e.target.value })}
                className="bg-background resize-none"
                rows={2}
                placeholder="Opening Shift"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInitialOpen(false)} className="border-border">Batal</Button>
            <Button
              onClick={handleSaveInitial}
              disabled={stockInitialMutation.isPending || !initialForm.qty || Number(initialForm.qty) <= 0}
              className="bg-primary text-primary-foreground font-semibold"
            >
              {stockInitialMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Tambah Barang Masuk (IN) ── */}
      <Dialog open={isInOpen} onOpenChange={setIsInOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-xl uppercase tracking-wider text-primary">Tambah Barang Masuk</DialogTitle>
            <p className="text-sm text-muted-foreground font-medium">{inIngredient?.ingredientName}</p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tanggal</Label>
              <Input
                type="date"
                value={inForm.date}
                onChange={e => setInForm({ ...inForm, date: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Qty Masuk ({inIngredient?.unit})
              </Label>
              <Input
                type="number"
                min="0.1"
                step="any"
                placeholder="0"
                value={inForm.qty}
                onChange={e => setInForm({ ...inForm, qty: e.target.value })}
                className="bg-background font-mono text-lg"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Keterangan</Label>
              <Textarea
                value={inForm.notes}
                onChange={e => setInForm({ ...inForm, notes: e.target.value })}
                className="bg-background resize-none"
                rows={2}
                placeholder="Ambil dari Gudang"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInOpen(false)} className="border-border">Batal</Button>
            <Button
              onClick={handleSaveIn}
              disabled={stockInMutation.isPending || !inForm.qty || Number(inForm.qty) <= 0}
              className="bg-primary text-primary-foreground font-semibold"
            >
              {stockInMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
