import { Router, type IRouter } from "express";
import { db, salesTable, productsTable, recipesTable, recipeDetailsTable, ingredientsTable, stockMovementsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

const router: IRouter = Router();

async function formatSale(s: typeof salesTable.$inferSelect) {
  const product = (await db.select().from(productsTable).where(eq(productsTable.id, s.productId)))[0];
  return { id: s.id, saleDate: s.saleDate, productId: s.productId, productName: product?.name || "", qty: s.qty, totalPrice: s.totalPrice, createdAt: s.createdAt.toISOString() };
}

router.get("/sales", async (req, res) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  let query = db.select().from(salesTable).$dynamic();
  const conditions = [];
  if (startDate) conditions.push(gte(salesTable.saleDate, startDate));
  if (endDate) conditions.push(lte(salesTable.saleDate, endDate));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const rows = await query.orderBy(salesTable.createdAt);
  const formatted = await Promise.all(rows.map(formatSale));
  res.json(formatted);
});

router.post("/sales", async (req, res) => {
  const { saleDate, productId, qty } = req.body;
  if (!saleDate || !productId || !qty) {
    res.status(400).json({ error: "saleDate, productId, and qty required" });
    return;
  }
  const product = (await db.select().from(productsTable).where(eq(productsTable.id, productId)))[0];
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  // Check recipe
  const recipe = (await db.select().from(recipesTable).where(eq(recipesTable.productId, productId)))[0];
  if (!recipe) { res.status(400).json({ error: "No recipe found for this product. Please add a recipe first." }); return; }
  const details = await db.select().from(recipeDetailsTable).where(eq(recipeDetailsTable.recipeId, recipe.id));
  // Check stock sufficiency
  for (const detail of details) {
    const ing = (await db.select().from(ingredientsTable).where(eq(ingredientsTable.id, detail.ingredientId)))[0];
    if (!ing) continue;
    const required = detail.quantity * qty;
    if (ing.currentStock < required) {
      res.status(400).json({ error: `Stok bahan tidak mencukupi: ${ing.name} (dibutuhkan ${required} ${ing.unit}, tersedia ${ing.currentStock} ${ing.unit})` });
      return;
    }
  }
  // Create sale
  const totalPrice = product.price * qty;
  const saleResult = await db.insert(salesTable).values({ saleDate, productId, qty, totalPrice }).returning();
  const sale = saleResult[0];
  // Deduct stock for each ingredient
  for (const detail of details) {
    const used = detail.quantity * qty;
    await db.update(ingredientsTable).set({ currentStock: sql`current_stock - ${used}` }).where(eq(ingredientsTable.id, detail.ingredientId));
    await db.insert(stockMovementsTable).values({ ingredientId: detail.ingredientId, movementType: "out", qty: used, referenceType: "sale", referenceId: sale.id, notes: `Sale #${sale.id}` });
  }
  res.status(201).json(await formatSale(sale));
});

router.delete("/sales/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const sale = (await db.select().from(salesTable).where(eq(salesTable.id, id)))[0];
  if (!sale) { res.status(404).json({ error: "Sale not found" }); return; }
  // Restore stock
  const recipe = (await db.select().from(recipesTable).where(eq(recipesTable.productId, sale.productId)))[0];
  if (recipe) {
    const details = await db.select().from(recipeDetailsTable).where(eq(recipeDetailsTable.recipeId, recipe.id));
    for (const detail of details) {
      const restored = detail.quantity * sale.qty;
      await db.update(ingredientsTable).set({ currentStock: sql`current_stock + ${restored}` }).where(eq(ingredientsTable.id, detail.ingredientId));
      await db.insert(stockMovementsTable).values({ ingredientId: detail.ingredientId, movementType: "in", qty: restored, referenceType: "sale_delete", referenceId: sale.id, notes: `Reversal sale #${sale.id}` });
    }
  }
  await db.delete(salesTable).where(eq(salesTable.id, id));
  res.json({ success: true, message: "Sale deleted and stock restored" });
});

export default router;
