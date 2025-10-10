import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const businessSessions = pgTable("business_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
});

export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => businessSessions.id),
  date: timestamp("date").notNull().defaultNow(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const saleItems = pgTable("sale_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  saleId: varchar("sale_id").notNull().references(() => sales.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => businessSessions.id),
  date: timestamp("date").notNull().defaultNow(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
});

export const stock = pgTable("stock", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  quantity: integer("quantity").notNull().default(0),
});

// Insert schemas
export const insertBusinessSessionSchema = createInsertSchema(businessSessions).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, date: true, sessionId: true });
export const insertSaleItemSchema = createInsertSchema(saleItems).omit({ id: true, saleId: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, date: true, sessionId: true });
export const insertStockSchema = createInsertSchema(stock).omit({ id: true });

// Types
export type BusinessSession = typeof businessSessions.$inferSelect;
export type InsertBusinessSession = z.infer<typeof insertBusinessSessionSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type Stock = typeof stock.$inferSelect;
export type InsertStock = z.infer<typeof insertStockSchema>;
