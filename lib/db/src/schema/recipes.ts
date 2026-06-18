import { pgTable, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";
import { ingredientsTable } from "./ingredients";

export const recipesTable = pgTable("recipes", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recipeDetailsTable = pgTable("recipe_details", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipesTable.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredientsTable.id),
  quantity: real("quantity").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRecipeSchema = createInsertSchema(recipesTable).omit({ id: true, createdAt: true });
export const insertRecipeDetailSchema = createInsertSchema(recipeDetailsTable).omit({ id: true, createdAt: true });
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type InsertRecipeDetail = z.infer<typeof insertRecipeDetailSchema>;
export type Recipe = typeof recipesTable.$inferSelect;
export type RecipeDetail = typeof recipeDetailsTable.$inferSelect;
