import { Router, type IRouter } from "express";
import { db, ingredientsTable, stockMovementsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stock/opname", async (_req, res) => {
  const ingredients = await db.select().from(ingredientsTable).orderBy(ingredientsTable.name);
  // Calculate stockIn and stockOut from movements
  const result = await Promise.all(ingredients.map(async ing => {
    const movements = await db.select().from(stockMovementsTable).where(eq(stockMovementsTable.ingredientId, ing.id));
    const stockIn = movements.filter(m => m.movementType === "in").reduce((s, m) => s + m.qty, 0);
    const stockOut = movements.filter(m => m.movementType === "out").reduce((s, m) => s + m.qty, 0);
    const stockWasting = movements.filter(m => m.movementType === "wasting").reduce((s, m) => s + m.qty, 0);
    const stockFinal = ing.currentStock;
    return {
      ingredientId: ing.id,
      ingredientName: ing.name,
      unit: ing.unit,
      category: ing.category,
      stockInitial: ing.stockInitial,
      stockIn,
      stockOut,
      stockWasting,
      stockFinal,
      stockMinimum: ing.stockMinimum,
      isLowStock: stockFinal <= ing.stockMinimum,
    };
  }));
  res.json(result);
});

router.get("/stock/movements", async (req, res) => {
  const { ingredientId, startDate, endDate } = req.query as { ingredientId?: string; startDate?: string; endDate?: string };
  const movements = await db.select().from(stockMovementsTable).orderBy(stockMovementsTable.createdAt);
  const ingredients = await db.select().from(ingredientsTable);
  const ingMap = new Map(ingredients.map(i => [i.id, i]));
  let filtered = movements;
  if (ingredientId) filtered = filtered.filter(m => m.ingredientId === parseInt(ingredientId));
  const formatted = filtered.map(m => {
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

router.post("/stock/add", async (req, res) => {
  const { ingredientId, qty, notes } = req.body;
  if (!ingredientId || !qty) {
    res.status(400).json({ error: "ingredientId and qty required" });
    return;
  }
  const addQty = Number(qty);
  await db.update(ingredientsTable).set({ currentStock: sql`current_stock + ${addQty}` }).where(eq(ingredientsTable.id, ingredientId));
  const result = await db.insert(stockMovementsTable).values({ ingredientId, movementType: "in", qty: addQty, referenceType: "manual", notes: notes || "Manual stock addition" }).returning();
  const m = result[0];
  const ing = (await db.select().from(ingredientsTable).where(eq(ingredientsTable.id, ingredientId)))[0];
  res.status(201).json({
    id: m.id, ingredientId: m.ingredientId, ingredientName: ing?.name || "", movementType: m.movementType,
    qty: m.qty, unit: ing?.unit || "", referenceType: m.referenceType, referenceId: m.referenceId ?? null,
    notes: m.notes ?? null, createdAt: m.createdAt.toISOString(),
  });
});

export default router;
