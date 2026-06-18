import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ingredientsTable } from "./ingredients";

export const wastingTable = pgTable("wasting", {
  id: serial("id").primaryKey(),
  wastingDate: text("wasting_date").notNull(),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredientsTable.id),
  qty: real("qty").notNull(),
  reason: text("reason").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWastingSchema = createInsertSchema(wastingTable).omit({ id: true, createdAt: true });
export type InsertWasting = z.infer<typeof insertWastingSchema>;
export type Wasting = typeof wastingTable.$inferSelect;
