import { Router, type IRouter } from "express";
import { db, ingredientsTable, recipeDetailsTable, recipesTable, wastingTable, stockMovementsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function formatIngredient(i: typeof ingredientsTable.$inferSelect) {
  return {
    id: i.id,
    name: i.name,
    category: i.category,
    unit: i.unit,
    stockInitial: i.stockInitial,
    stockMinimum: i.stockMinimum,
    currentStock: i.currentStock,
    isLowStock: i.currentStock <= i.stockMinimum,
    createdAt: i.createdAt.toISOString(),
  };
}

router.get("/ingredients", async (_req, res) => {
  const rows = await db.select().from(ingredientsTable).orderBy(ingredientsTable.name);
  res.json(rows.map(formatIngredient));
});

router.post("/ingredients", async (req, res) => {
  const { name, category, unit, stockInitial, stockMinimum } = req.body;
  if (!name || !category || !unit) {
    res.status(400).json({ error: "name, category, and unit required" });
    return;
  }
  const initial = Number(stockInitial) || 0;
  const result = await db.insert(ingredientsTable).values({
    name, category, unit,
    stockInitial: initial,
    stockMinimum: Number(stockMinimum) || 0,
    currentStock: initial,
  }).returning();
  res.status(201).json(formatIngredient(result[0]));
});

router.put("/ingredients/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, category, unit, stockInitial, stockMinimum } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (category !== undefined) updates.category = category;
  if (unit !== undefined) updates.unit = unit;
  if (stockInitial !== undefined) updates.stockInitial = Number(stockInitial);
  if (stockMinimum !== undefined) updates.stockMinimum = Number(stockMinimum);
  const result = await db.update(ingredientsTable).set(updates).where(eq(ingredientsTable.id, id)).returning();
  if (!result[0]) { res.status(404).json({ error: "Ingredient not found" }); return; }
  res.json(formatIngredient(result[0]));
});

router.delete("/ingredients/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  // Cascade: remove from recipe_details first
  const recipeDetailRows = await db.select().from(recipeDetailsTable).where(eq(recipeDetailsTable.ingredientId, id));
  if (recipeDetailRows.length > 0) {
    const recipeIds = [...new Set(recipeDetailRows.map(r => r.recipeId))];
    await db.delete(recipeDetailsTable).where(eq(recipeDetailsTable.ingredientId, id));
    // If the recipe has no more details, delete the recipe itself
    for (const recipeId of recipeIds) {
      const remaining = await db.select().from(recipeDetailsTable).where(eq(recipeDetailsTable.recipeId, recipeId));
      if (remaining.length === 0) {
        await db.delete(recipesTable).where(eq(recipesTable.id, recipeId));
      }
    }
  }
  // Delete related wasting and stock movements
  await db.delete(wastingTable).where(eq(wastingTable.ingredientId, id));
  await db.delete(stockMovementsTable).where(eq(stockMovementsTable.ingredientId, id));
  await db.delete(ingredientsTable).where(eq(ingredientsTable.id, id));
  res.json({ success: true, message: "Ingredient deleted" });
});

export default router;
