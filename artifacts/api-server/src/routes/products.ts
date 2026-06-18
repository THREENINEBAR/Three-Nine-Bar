import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function formatProduct(p: typeof productsTable.$inferSelect) {
  return { id: p.id, name: p.name, price: p.price, isActive: p.isActive, createdAt: p.createdAt.toISOString() };
}

router.get("/products", async (_req, res) => {
  const rows = await db.select().from(productsTable).orderBy(productsTable.name);
  res.json(rows.map(formatProduct));
});

router.post("/products", async (req, res) => {
  const { name, price, isActive } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const result = await db.insert(productsTable).values({
    name, price: Number(price) || 0, isActive: isActive !== false,
  }).returning();
  res.status(201).json(formatProduct(result[0]));
});

router.put("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price, isActive } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (price !== undefined) updates.price = Number(price);
  if (isActive !== undefined) updates.isActive = isActive;
  const result = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
  if (!result[0]) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(formatProduct(result[0]));
});

router.delete("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json({ success: true, message: "Product deleted" });
});

export default router;
