import { Router, type IRouter } from "express";
import { db, wastingTable, ingredientsTable, stockMovementsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

const router: IRouter = Router();

async function formatWasting(w: typeof wastingTable.$inferSelect) {
  const ing = (await db.select().from(ingredientsTable).where(eq(ingredientsTable.id, w.ingredientId)))[0];
  return { id: w.id, wastingDate: w.wastingDate, ingredientId: w.ingredientId, ingredientName: ing?.name || "", qty: w.qty, unit: ing?.unit || "", reason: w.reason, notes: w.notes ?? null, createdAt: w.createdAt.toISOString() };
}

router.get("/wasting", async (req, res) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  let query = db.select().from(wastingTable).$dynamic();
  const conditions = [];
  if (startDate) conditions.push(gte(wastingTable.wastingDate, startDate));
  if (endDate) conditions.push(lte(wastingTable.wastingDate, endDate));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const rows = await query.orderBy(wastingTable.createdAt);
  const formatted = await Promise.all(rows.map(formatWasting));
  res.json(formatted);
});

router.post("/wasting", async (req, res) => {
  const { wastingDate, ingredientId, qty, reason, notes } = req.body;
  if (!wastingDate || !ingredientId || !qty || !reason) {
    res.status(400).json({ error: "wastingDate, ingredientId, qty, and reason required" });
    return;
  }
  const result = await db.insert(wastingTable).values({ wastingDate, ingredientId, qty: Number(qty), reason, notes: notes || null }).returning();
  const w = result[0];
  // Deduct stock
  await db.update(ingredientsTable).set({ currentStock: sql`current_stock - ${Number(qty)}` }).where(eq(ingredientsTable.id, ingredientId));
  await db.insert(stockMovementsTable).values({ ingredientId, movementType: "wasting", qty: Number(qty), referenceType: "wasting", referenceId: w.id, notes: reason });
  res.status(201).json(await formatWasting(w));
});

router.put("/wasting/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = (await db.select().from(wastingTable).where(eq(wastingTable.id, id)))[0];
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const { wastingDate, ingredientId, qty, reason, notes } = req.body;
  // Reverse old deduction
  await db.update(ingredientsTable).set({ currentStock: sql`current_stock + ${existing.qty}` }).where(eq(ingredientsTable.id, existing.ingredientId));
  const newQty = qty !== undefined ? Number(qty) : existing.qty;
  const newIngId = ingredientId !== undefined ? ingredientId : existing.ingredientId;
  const updates: Record<string, unknown> = {};
  if (wastingDate !== undefined) updates.wastingDate = wastingDate;
  if (ingredientId !== undefined) updates.ingredientId = ingredientId;
  if (qty !== undefined) updates.qty = newQty;
  if (reason !== undefined) updates.reason = reason;
  if (notes !== undefined) updates.notes = notes;
  const result = await db.update(wastingTable).set(updates).where(eq(wastingTable.id, id)).returning();
  // Apply new deduction
  await db.update(ingredientsTable).set({ currentStock: sql`current_stock - ${newQty}` }).where(eq(ingredientsTable.id, newIngId));
  res.json(await formatWasting(result[0]));
});

router.delete("/wasting/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = (await db.select().from(wastingTable).where(eq(wastingTable.id, id)))[0];
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  // Restore stock
  await db.update(ingredientsTable).set({ currentStock: sql`current_stock + ${existing.qty}` }).where(eq(ingredientsTable.id, existing.ingredientId));
  await db.delete(wastingTable).where(eq(wastingTable.id, id));
  res.json({ success: true, message: "Wasting deleted and stock restored" });
});

export default router;
