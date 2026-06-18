import { Router, type IRouter } from "express";
import { db, recipesTable, recipeDetailsTable, productsTable, ingredientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function getFullRecipe(recipeId: number) {
  const recipes = await db.select().from(recipesTable).where(eq(recipesTable.id, recipeId));
  const recipe = recipes[0];
  if (!recipe) return null;
  const product = (await db.select().from(productsTable).where(eq(productsTable.id, recipe.productId)))[0];
  const details = await db.select().from(recipeDetailsTable).where(eq(recipeDetailsTable.recipeId, recipeId));
  const detailsWithNames = await Promise.all(details.map(async d => {
    const ing = (await db.select().from(ingredientsTable).where(eq(ingredientsTable.id, d.ingredientId)))[0];
    return { id: d.id, ingredientId: d.ingredientId, ingredientName: ing?.name || "", unit: ing?.unit || "", quantity: d.quantity };
  }));
  return { id: recipe.id, productId: recipe.productId, productName: product?.name || "", details: detailsWithNames, createdAt: recipe.createdAt.toISOString() };
}

router.get("/recipes", async (_req, res) => {
  const recipes = await db.select().from(recipesTable).orderBy(recipesTable.id);
  const full = await Promise.all(recipes.map(r => getFullRecipe(r.id)));
  res.json(full.filter(Boolean));
});

router.get("/recipes/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const recipe = await getFullRecipe(id);
  if (!recipe) { res.status(404).json({ error: "Recipe not found" }); return; }
  res.json(recipe);
});

router.post("/recipes", async (req, res) => {
  const { productId, details } = req.body;
  if (!productId || !Array.isArray(details)) {
    res.status(400).json({ error: "productId and details array required" });
    return;
  }
  // Delete any existing recipe for this product first
  const existing = await db.select().from(recipesTable).where(eq(recipesTable.productId, productId));
  if (existing.length > 0) {
    await db.delete(recipeDetailsTable).where(eq(recipeDetailsTable.recipeId, existing[0].id));
    await db.delete(recipesTable).where(eq(recipesTable.productId, productId));
  }
  const result = await db.insert(recipesTable).values({ productId }).returning();
  const recipe = result[0];
  if (details.length > 0) {
    await db.insert(recipeDetailsTable).values(details.map((d: { ingredientId: number; quantity: number }) => ({
      recipeId: recipe.id, ingredientId: d.ingredientId, quantity: d.quantity,
    })));
  }
  const full = await getFullRecipe(recipe.id);
  res.status(201).json(full);
});

router.put("/recipes/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { productId, details } = req.body;
  const existing = (await db.select().from(recipesTable).where(eq(recipesTable.id, id)))[0];
  if (!existing) { res.status(404).json({ error: "Recipe not found" }); return; }
  if (productId !== undefined) {
    await db.update(recipesTable).set({ productId }).where(eq(recipesTable.id, id));
  }
  if (Array.isArray(details)) {
    await db.delete(recipeDetailsTable).where(eq(recipeDetailsTable.recipeId, id));
    if (details.length > 0) {
      await db.insert(recipeDetailsTable).values(details.map((d: { ingredientId: number; quantity: number }) => ({
        recipeId: id, ingredientId: d.ingredientId, quantity: d.quantity,
      })));
    }
  }
  const full = await getFullRecipe(id);
  res.json(full);
});

router.delete("/recipes/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(recipeDetailsTable).where(eq(recipeDetailsTable.recipeId, id));
  await db.delete(recipesTable).where(eq(recipesTable.id, id));
  res.json({ success: true, message: "Recipe deleted" });
});

export default router;
