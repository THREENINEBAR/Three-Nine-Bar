import { Router, type IRouter } from "express";
import { db, salesTable, wastingTable, ingredientsTable, productsTable, stockMovementsTable, recipeDetailsTable, recipesTable } from "@workspace/db";
import { eq, gte, lte, and, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/reports/dashboard", async (_req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const ingredients = await db.select().from(ingredientsTable);
  const products = await db.select().from(productsTable);
  const todaySales = await db.select().from(salesTable).where(eq(salesTable.saleDate, today));
  const todayWasting = await db.select().from(wastingTable).where(eq(wastingTable.wastingDate, today));
  const totalIngredients = ingredients.length;
  const totalProducts = products.length;
  const totalSalesToday = todaySales.reduce((s, r) => s + r.totalPrice, 0);
  const totalWastingToday = todayWasting.reduce((s, r) => s + r.qty, 0);
  const totalLowStock = ingredients.filter(i => i.currentStock <= i.stockMinimum).length;
  // Recent 5 sales
  const allSales = await db.select().from(salesTable).orderBy(salesTable.createdAt).limit(5);
  const productMap = new Map(products.map(p => [p.id, p]));
  const recentSales = allSales.map(s => ({ id: s.id, saleDate: s.saleDate, productId: s.productId, productName: productMap.get(s.productId)?.name || "", qty: s.qty, totalPrice: s.totalPrice, createdAt: s.createdAt.toISOString() }));
  // Sales chart (last 7 days by product)
  const allSalesAll = await db.select().from(salesTable);
  const salesByProduct: Record<number, { productId: number; productName: string; totalQty: number; totalRevenue: number }> = {};
  for (const s of allSalesAll) {
    if (!salesByProduct[s.productId]) {
      salesByProduct[s.productId] = { productId: s.productId, productName: productMap.get(s.productId)?.name || "", totalQty: 0, totalRevenue: 0 };
    }
    salesByProduct[s.productId].totalQty += s.qty;
    salesByProduct[s.productId].totalRevenue += s.totalPrice;
  }
  // Ingredient usage chart
  const movements = await db.select().from(stockMovementsTable).where(eq(stockMovementsTable.movementType, "out"));
  const ingMap = new Map(ingredients.map(i => [i.id, i]));
  const usageByIng: Record<number, { ingredientId: number; ingredientName: string; unit: string; totalUsed: number }> = {};
  for (const m of movements) {
    if (!usageByIng[m.ingredientId]) {
      const ing = ingMap.get(m.ingredientId);
      usageByIng[m.ingredientId] = { ingredientId: m.ingredientId, ingredientName: ing?.name || "", unit: ing?.unit || "", totalUsed: 0 };
    }
    usageByIng[m.ingredientId].totalUsed += m.qty;
  }
  res.json({
    totalIngredients,
    totalProducts,
    totalSalesToday,
    totalWastingToday,
    totalLowStock,
    recentSales,
    salesChart: Object.values(salesByProduct),
    ingredientUsageChart: Object.values(usageByIng).slice(0, 10),
  });
});

router.get("/reports/sales-by-product", async (req, res) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  let query = db.select().from(salesTable).$dynamic();
  const conditions = [];
  if (startDate) conditions.push(gte(salesTable.saleDate, startDate));
  if (endDate) conditions.push(lte(salesTable.saleDate, endDate));
  if (conditions.length > 0) query = query.where(and(...conditions));
  const sales = await query;
  const products = await db.select().from(productsTable);
  const productMap = new Map(products.map(p => [p.id, p]));
  const byProduct: Record<number, { productId: number; productName: string; totalQty: number; totalRevenue: number }> = {};
  for (const s of sales) {
    if (!byProduct[s.productId]) {
      byProduct[s.productId] = { productId: s.productId, productName: productMap.get(s.productId)?.name || "", totalQty: 0, totalRevenue: 0 };
    }
    byProduct[s.productId].totalQty += s.qty;
    byProduct[s.productId].totalRevenue += s.totalPrice;
  }
  res.json(Object.values(byProduct));
});

router.get("/reports/ingredient-usage", async (req, res) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  const movements = await db.select().from(stockMovementsTable).where(eq(stockMovementsTable.movementType, "out"));
  const ingredients = await db.select().from(ingredientsTable);
  const ingMap = new Map(ingredients.map(i => [i.id, i]));
  const usage: Record<number, { ingredientId: number; ingredientName: string; unit: string; totalUsed: number }> = {};
  for (const m of movements) {
    if (!usage[m.ingredientId]) {
      const ing = ingMap.get(m.ingredientId);
      usage[m.ingredientId] = { ingredientId: m.ingredientId, ingredientName: ing?.name || "", unit: ing?.unit || "", totalUsed: 0 };
    }
    usage[m.ingredientId].totalUsed += m.qty;
  }
  res.json(Object.values(usage));
});

router.get("/reports/low-stock", async (_req, res) => {
  const ingredients = await db.select().from(ingredientsTable);
  const movements = await db.select().from(stockMovementsTable);
  const lowStock = ingredients.filter(i => i.currentStock <= i.stockMinimum).map(ing => {
    const ms = movements.filter(m => m.ingredientId === ing.id);
    const stockIn = ms.filter(m => m.movementType === "in").reduce((s, m) => s + m.qty, 0);
    const stockOut = ms.filter(m => m.movementType === "out").reduce((s, m) => s + m.qty, 0);
    const stockWasting = ms.filter(m => m.movementType === "wasting").reduce((s, m) => s + m.qty, 0);
    return {
      ingredientId: ing.id, ingredientName: ing.name, unit: ing.unit, category: ing.category,
      stockInitial: ing.stockInitial, stockIn, stockOut, stockWasting,
      stockFinal: ing.currentStock, stockMinimum: ing.stockMinimum, isLowStock: true,
    };
  });
  res.json(lowStock);
});

export default router;
