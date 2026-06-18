import { useState, useMemo } from "react";
import {
  useGetStockOpname,
  useListStockMovements,
  useAddStock,
  getGetStockOpnameQueryKey,
  getListIngredientsQueryKey,
  getListStockMovementsQueryKey,
} from "@workspace/api-client-react";
import type { StockOpname } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, AlertCircle, History, ArrowDownToLine, ArrowUpFromLine, Trash2 } from "lucide-react";
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

const today = new Date().toISOString().split("T")[0];

export default function StockOpnamePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);

  // Cards section uses current state (no date filter) for "stock saat ini"
  const { data: currentData, isLoading: isLoadingCurrent } = useGetStockOpname();
  // Table section uses date-filtered view
  const { data: opnameData, isLoading: isLoadingOpname } = useGetStockOpname({ date: selectedDate });

  const addStockMutation = useAddStock();

  // Add stock modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<{ id: number; name: string; unit: string; currentStock: number } | null>(null);
  const [addForm, setAddForm] = useState({ date: today, qty: "" as string | number, notes: "" });

  // History modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyIngredient, setHistoryIngredient] = useState<{ id: number; name: string; unit: string } | null>(null);
  const movementParams = historyIngredient ? { ingredientId: historyIngredient.id } : undefined;
  const { data: movements, isLoading: isLoadingMovements } = useListStockMovements(
    movementParams,
    { query: { queryKey: getListStockMovementsQueryKey(movementParams), enabled: isHistoryOpen && !!historyIngredient } }
  );

  const filteredCards = useMemo(() => {
    if (!currentData) return [];
    if (!search) return currentData;
    return currentData.filter(item =>
      item.ingredientName.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [currentData, search]);

  const filteredOpname = useMemo(() => {
    if (!opnameData) return [];
    if (!search) return opnameData;
    return opnameData.filter(item =>
      item.ingredientName.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [opnameData, search]);

  const handleOpenAdd = (item: StockOpname) => {
    setSelectedIngredient({ id: item.ingredientId, name: item.ingredientName, unit: item.unit, currentStock: item.currentStock });
    setAddForm({ date: today, qty: "", notes: "" });
    setIsAddOpen(true);
  };

  const handleOpenHistory = (item: StockOpname) => {
    setHistoryIngredient({ id: item.ingredientId, name: item.ingredientName, unit: item.unit });
    setIsHistoryOpen(true);
  };

  const handleAddStock = () => {
    if (!selectedIngredient) return;
    const qty = Number(addForm.qty);
    if (!qty || qty <= 0) {
      toast({ title: "Error", description: "Qty harus lebih dari 0", variant: "destructive" });
      return;
    }
    addStockMutation.mutate({ data: { ingredientId: selectedIngredient.id, qty, notes: addForm.notes || undefined } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStockOpnameQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListIngredientsQueryKey() });
        toast({ title: "Stock Ditambahkan", description: `${qty} ${selectedIngredient.unit} berhasil ditambahkan` });
        setIsAddOpen(false);
      },
      onError: () => {
        toast({ title: "Error", description: "Gagal menambahkan stock", variant: "destructive" });
      }
    });
  };

  const movementTypeLabel: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    in: { label: "IN", color: "text-primary", icon: <ArrowDownToLine className="h-3 w-3" /> },
    out: { label: "OUT", color: "text-orange-400", icon: <ArrowUpFromLine className="h-3 w-3" /> },
    wasting: { label: "WASTING", color: "text-destructive", icon: <Trash2 className="h-3 w-3" /> },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary uppercase">Stock Opname</h1>
          <p className="text-muted-foreground mt-1">Kelola dan pantau pergerakan stok bahan.</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari bahan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-background border-border"
        />
      </div>

      {/* ── SECTION 1: Stock Saat Ini (Card Grid) ── */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 ml-1">Stock Saat Ini</p>
        {isLoadingCurrent ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-36 w-full bg-sidebar" />)}
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Tidak ada bahan ditemukan.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCards.map(item => (
              <div
                key={item.ingredientId}
                className={`bg-card border rounded-xl p-4 flex flex-col gap-3 shadow-sm transition-all
                  ${item.isLowStock ? 'border-destructive/40 bg-destructive/5' : 'border-border hover:border-primary/40'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className={`font-semibold text-sm leading-tight ${item.isLowStock ? 'text-destructive' : 'text-foreground'}`}>
                      {item.ingredientName}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{item.category}</div>
                  </div>
                  {item.isLowStock && (
                    <Badge variant="destructive" className="text-[9px] h-4 px-1 uppercase shrink-0">
                      <AlertCircle className="h-2 w-2 mr-1" />Low
                    </Badge>
                  )}
                </div>

                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Stock Saat Ini</div>
                  <div className="text-2xl font-bold font-mono text-primary">
                    {item.currentStock.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground ml-1">{item.unit}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <Button
                    size="sm"
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold uppercase tracking-wider text-[11px] h-8"
                    onClick={() => handleOpenAdd(item)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Tambah Stock
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => handleOpenHistory(item)}
                    title="Riwayat Pergerakan"
                  >
                    <History className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 2: Tabel Stock Opname Harian ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground ml-1">Tabel Opname Harian</p>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Pilih Tanggal:</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-background border-border h-8 text-sm w-auto"
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-sidebar/80 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Nama Bahan</th>
                  <th className="px-4 py-4 font-medium text-right">Stock Awal</th>
                  <th className="px-4 py-4 font-medium text-right text-primary">IN</th>
                  <th className="px-4 py-4 font-medium text-right text-orange-400">OUT</th>
                  <th className="px-4 py-4 font-medium text-right text-destructive">Wasting</th>
                  <th className="px-6 py-4 font-medium text-right text-foreground">Stock Akhir</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingOpname ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
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
                  filteredOpname.map(item => {
                    const isLow = item.isLowStock;
                    return (
                      <tr
                        key={item.ingredientId}
                        className={`border-b border-border/50 transition-colors
                          ${isLow ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-sidebar/30'}`}
                      >
                        <td className="px-6 py-4">
                          <button
                            className="text-left group"
                            onClick={() => handleOpenHistory(item)}
                            title="Lihat riwayat"
                          >
                            <div className={`font-medium group-hover:text-primary transition-colors ${isLow ? 'text-destructive' : 'text-foreground'}`}>
                              {item.ingredientName}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">{item.category} · klik untuk riwayat</div>
                          </button>
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-muted-foreground">
                          {item.stockInitial.toLocaleString()} <span className="text-xs">{item.unit}</span>
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-primary font-medium">
                          +{item.stockIn.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-orange-400">
                          -{item.stockOut.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-destructive">
                          -{item.stockWasting.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-base">
                          {item.stockFinal.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">{item.unit}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODAL: Tambah Stock ── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-xl uppercase tracking-wider text-primary">Tambah Stock</DialogTitle>
            <p className="text-sm text-muted-foreground font-medium">{selectedIngredient?.name}</p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-sidebar/40 rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Stock Saat Ini</span>
              <span className="font-bold font-mono text-lg text-foreground">
                {selectedIngredient?.currentStock.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{selectedIngredient?.unit}</span>
              </span>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Qty Masuk ({selectedIngredient?.unit})
              </Label>
              <Input
                type="number"
                min="0.1"
                step="any"
                placeholder="0"
                value={addForm.qty}
                onChange={e => setAddForm({ ...addForm, qty: e.target.value })}
                className="bg-background font-mono text-lg"
                autoFocus
              />
              {Number(addForm.qty) > 0 && selectedIngredient && (
                <p className="text-xs text-primary">
                  Stock baru: <span className="font-bold font-mono">{(selectedIngredient.currentStock + Number(addForm.qty)).toLocaleString()} {selectedIngredient.unit}</span>
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Keterangan (Opsional)</Label>
              <Textarea
                value={addForm.notes}
                onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
                className="bg-background resize-none"
                rows={2}
                placeholder="e.g. Barang datang dari supplier"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="border-border">Batal</Button>
            <Button
              onClick={handleAddStock}
              disabled={addStockMutation.isPending || !addForm.qty || Number(addForm.qty) <= 0}
              className="bg-primary text-primary-foreground font-semibold"
            >
              {addStockMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Riwayat Pergerakan Stock ── */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-xl uppercase tracking-wider text-primary flex items-center gap-2">
              <History className="h-5 w-5" /> Riwayat Stock
            </DialogTitle>
            <p className="text-sm text-muted-foreground font-medium">{historyIngredient?.name} ({historyIngredient?.unit})</p>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 mt-2">
            {isLoadingMovements ? (
              <div className="space-y-2 py-2">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !movements || movements.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Belum ada riwayat pergerakan.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground sticky top-0 bg-card border-b border-border">
                  <tr>
                    <th className="py-3 text-left font-medium">Tanggal</th>
                    <th className="py-3 text-center font-medium">Jenis</th>
                    <th className="py-3 text-right font-medium">Qty</th>
                    <th className="py-3 text-left font-medium pl-4">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {[...movements].reverse().map(m => {
                    const typeInfo = movementTypeLabel[m.movementType] ?? { label: m.movementType.toUpperCase(), color: "text-foreground", icon: null };
                    return (
                      <tr key={m.id} className="border-b border-border/40 hover:bg-sidebar/20">
                        <td className="py-3 text-muted-foreground text-xs">
                          {new Date(m.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex items-center gap-1 font-bold text-xs uppercase ${typeInfo.color}`}>
                            {typeInfo.icon}
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className={`py-3 text-right font-mono font-semibold ${typeInfo.color}`}>
                          {m.movementType === "in" ? "+" : "-"}{m.qty.toLocaleString()}
                          <span className="text-xs font-normal text-muted-foreground ml-1">{m.unit}</span>
                        </td>
                        <td className="py-3 pl-4 text-muted-foreground text-xs">{m.notes ?? "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
