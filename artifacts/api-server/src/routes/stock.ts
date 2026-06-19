import { Router, type IRouter } from "express";
import { db, ingredientsTable, stockMovementsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stock/opname", async (req, res) => {
  const { date } = req.query as { date?: string };
  const ingredients = await db.select().from(ingredientsTable).orderBy(ingredientsTable.name);
  const allMovements = await db.select().from(stockMovementsTable).orderBy(stockMovementsTable.createdAt);

  const result = ingredients.map(ing => {
    const ingMovements = allMovements.filter(m => m.ingredientId === ing.id);

    let stockIn: number;
    let stockOut: number;
    let stockWasting: number;
    let stockInitial: number;
    let stockFinal: number;

    if (date) {
      const dayMovements = ingMovements.filter(m => {
        const d = m.createdAt.toISOString().split("T")[0];
        return d === date;
      });

      stockInitial = dayMovements.filter(m => m.movementType === "initial").reduce((s, m) => s + m.qty, 0);
      stockIn = dayMovements.filter(m => m.movementType === "in").reduce((s, m) => s + m.qty, 0);
      stockOut = dayMovements.filter(m => m.movementType === "out").reduce((s, m) => s + m.qty, 0);
      stockWasting = dayMovements.filter(m => m.movementType === "wasting").reduce((s, m) => s + m.qty, 0);
      stockFinal = Math.max(0, stockInitial + stockIn - stockOut - stockWasting);
    } else {
      stockInitial = ing.stockInitial;
      stockIn = ingMovements.filter(m => m.movementType === "in").reduce((s, m) => s + m.qty, 0);
      stockOut = ingMovements.filter(m => m.movementType === "out").reduce((s, m) => s + m.qty, 0);
      stockWasting = ingMovements.filter(m => m.movementType === "wasting").reduce((s, m) => s + m.qty, 0);
      stockFinal = ing.currentStock;
    }

    return {
      ingredientId: ing.id,
      ingredientName: ing.name,
      unit: ing.unit,
      category: ing.category,
      stockInitial: Math.max(0, stockInitial),
      stockIn,
      stockOut,
      stockWasting,
      stockFinal,
      currentStock: ing.currentStock,
    };
  });
  res.json(result);
});

router.get("/stock/movements", async (req, res) => {
  const { ingredientId } = req.query as { ingredientId?: string };
  let movements = await db.select().from(stockMovementsTable).orderBy(stockMovementsTable.createdAt);
  const ingredients = await db.select().from(ingredientsTable);
  const ingMap = new Map(ingredients.map(i => [i.id, i]));
  if (ingredientId) movements = movements.filter(m => m.ingredientId === parseInt(ingredientId));
  const formatted = movements.map(m => {
    const ing = ingMap.get(m.ingredientId);
    return {
      id: m.id,
      ingredientId: m.ingredientId,
      ingredientName: ing?.name || "",
      movementType: m.movementType,
      qty: m.qty,
      unit: ing?.unit || "",
      referenceType: m.referenceType,
      referenceId: m.referenceId ?? null,
      notes: m.notes ?? null,
      createdAt: m.createdAt.toISOString(),
    };
  });
  res.json(formatted);
});

// POST /stock/add — Tambah Barang Masuk (IN)
router.post("/stock/add", async (req, res) => {
  const { ingredientId, qty, notes, date } = req.body;
  if (!ingredientId || !qty) {
    res.status(400).json({ error: "ingredientId and qty required" });
    return;
  }
  const addQty = Number(qty);
  await db.update(ingredientsTable).set({ currentStock: sql`current_stock + ${addQty}` }).where(eq(ingredientsTable.id, ingredientId));

  const createdAt = date ? new Date(date + "T12:00:00") : new Date();

  const result = await db.insert(stockMovementsTable).values({
    ingredientId,
    movementType: "in",
    qty: addQty,
    referenceType: "manual",
    notes: notes || "Barang masuk",
    createdAt,
  }).returning();
  const m = result[0];
  const ing = (await db.select().from(ingredientsTable).where(eq(ingredientsTable.id, ingredientId)))[0];
  res.status(201).json({
    id: m.id, ingredientId: m.ingredientId, ingredientName: ing?.name || "",
    movementType: m.movementType, qty: m.qty, unit: ing?.unit || "",
    referenceType: m.referenceType, referenceId: m.referenceId ?? null,
    notes: m.notes ?? null, createdAt: m.createdAt.toISOString(),
  });
});

// POST /stock/initial — Input Stock Awal
router.post("/stock/initial", async (req, res) => {
  const { ingredientId, qty, notes, date } = req.body;
  if (!ingredientId || !qty) {
    res.status(400).json({ error: "ingredientId and qty required" });
    return;
  }
  const addQty = Number(qty);
  const createdAt = date ? new Date(date + "T08:00:00") : new Date();

  const result = await db.insert(stockMovementsTable).values({
    ingredientId,
    movementType: "initial",
    qty: addQty,
    referenceType: "manual",
    notes: notes || "Stock Awal",
    createdAt,
  }).returning();
  const m = result[0];
  const ing = (await db.select().from(ingredientsTable).where(eq(ingredientsTable.id, ingredientId)))[0];
  res.status(201).json({
    id: m.id, ingredientId: m.ingredientId, ingredientName: ing?.name || "",
    movementType: m.movementType, qty: m.qty, unit: ing?.unit || "",
    referenceType: m.referenceType, notes: m.notes ?? null,
    createdAt: m.createdAt.toISOString(),
  });
});

export default router;
