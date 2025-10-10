import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertSaleSchema, insertExpenseSchema, insertStockSchema, insertBusinessSessionSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Business Sessions
  app.get("/api/sessions", async (_req, res) => {
    try {
      const sessions = await storage.getBusinessSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/active", async (_req, res) => {
    try {
      const session = await storage.getActiveSession();
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active session" });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const session = insertBusinessSessionSchema.parse(req.body);
      const created = await storage.createBusinessSession(session);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create session" });
      }
    }
  });

  app.post("/api/sessions/:id/activate", async (req, res) => {
    try {
      const { id } = req.params;
      const session = await storage.setActiveSession(id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to activate session" });
    }
  });

  // Categories
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const category = insertCategorySchema.parse(req.body);
      const created = await storage.createCategory(category);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const update = insertCategorySchema.partial().parse(req.body);
      const updated = await storage.updateCategory(id, update);
      if (!updated) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update category" });
      }
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCategory(id);
      if (!deleted) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Products
  app.get("/api/products", async (_req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const product = insertProductSchema.parse(req.body);
      const created = await storage.createProduct(product);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const update = insertProductSchema.partial().parse(req.body);
      const updated = await storage.updateProduct(id, update);
      if (!updated) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update product" });
      }
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Sales
  app.get("/api/sales", async (req, res) => {
    try {
      const activeSession = await storage.getActiveSession();
      if (!activeSession) {
        res.status(400).json({ error: "No active session" });
        return;
      }

      const { dateFrom, dateTo } = req.query;
      const sales = await storage.getSales(
        activeSession.id,
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined
      );
      res.json(sales);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  });

  app.get("/api/sales/:id/items", async (req, res) => {
    try {
      const { id } = req.params;
      const items = await storage.getSaleItems(id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sale items" });
    }
  });

  const createSaleSchema = z.object({
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    }))
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const activeSession = await storage.getActiveSession();
      if (!activeSession) {
        res.status(400).json({ error: "No active session. Please start a new business day first." });
        return;
      }

      // Check if the active session is today's date
      const today = new Date().toISOString().split('T')[0];
      if (activeSession.date !== today) {
        res.status(403).json({ error: "Cannot create sales for past sessions. Please select today's session." });
        return;
      }

      const { items } = createSaleSchema.parse(req.body);
      
      // Fetch products and calculate total using server-side prices
      const saleItems = [];
      let total = 0;

      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          res.status(400).json({ error: `Product not found: ${item.productId}` });
          return;
        }

        const itemTotal = Number(product.price) * item.quantity;
        total += itemTotal;

        saleItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          price: product.price,
          total: itemTotal.toFixed(2),
        });
      }

      const result = await storage.createSale(
        activeSession.id,
        { total: total.toFixed(2) },
        saleItems
      );
      
      // Automatically deduct stock based on product-stock mapping
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (product && product.stockItemId) {
          const stockItem = await storage.getStockItem(product.stockItemId);
          if (stockItem) {
            await storage.updateStockQuantity(stockItem.name, -item.quantity);
          }
        }
      }
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create sale" });
      }
    }
  });

  app.delete("/api/sales/:id", async (req, res) => {
    try {
      const activeSession = await storage.getActiveSession();
      if (!activeSession) {
        res.status(400).json({ error: "No active session" });
        return;
      }

      // Check if the active session is today's date
      const today = new Date().toISOString().split('T')[0];
      if (activeSession.date !== today) {
        res.status(403).json({ error: "Cannot delete sales from past sessions." });
        return;
      }

      const { id } = req.params;
      
      // Verify the sale belongs to the current active session
      const sale = await storage.getSale(id);
      if (!sale) {
        res.status(404).json({ error: "Sale not found" });
        return;
      }
      
      if (sale.sessionId !== activeSession.id) {
        res.status(403).json({ error: "Cannot delete sales from other sessions." });
        return;
      }
      
      const deleted = await storage.deleteSale(id);
      if (!deleted) {
        res.status(404).json({ error: "Sale not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete sale" });
    }
  });

  app.get("/api/reports/sales-statistics", async (_req, res) => {
    try {
      const activeSession = await storage.getActiveSession();
      if (!activeSession) {
        res.status(400).json({ error: "No active session" });
        return;
      }

      const stats = await storage.getSalesStatistics(activeSession.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales statistics" });
    }
  });

  // Expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const activeSession = await storage.getActiveSession();
      if (!activeSession) {
        res.status(400).json({ error: "No active session" });
        return;
      }

      const { dateFrom, dateTo } = req.query;
      const expenses = await storage.getExpenses(
        activeSession.id,
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined
      );
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const activeSession = await storage.getActiveSession();
      if (!activeSession) {
        res.status(400).json({ error: "No active session. Please start a new business day first." });
        return;
      }

      // Check if the active session is today's date
      const today = new Date().toISOString().split('T')[0];
      if (activeSession.date !== today) {
        res.status(403).json({ error: "Cannot create expenses for past sessions. Please select today's session." });
        return;
      }

      const expense = insertExpenseSchema.parse(req.body);
      const created = await storage.createExpense(activeSession.id, expense);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create expense" });
      }
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const activeSession = await storage.getActiveSession();
      if (!activeSession) {
        res.status(400).json({ error: "No active session" });
        return;
      }

      // Check if the active session is today's date
      const today = new Date().toISOString().split('T')[0];
      if (activeSession.date !== today) {
        res.status(403).json({ error: "Cannot delete expenses from past sessions." });
        return;
      }

      const { id } = req.params;
      
      // Verify the expense belongs to the current active session
      const expense = await storage.getExpense(id);
      if (!expense) {
        res.status(404).json({ error: "Expense not found" });
        return;
      }
      
      if (expense.sessionId !== activeSession.id) {
        res.status(403).json({ error: "Cannot delete expenses from other sessions." });
        return;
      }
      
      const deleted = await storage.deleteExpense(id);
      if (!deleted) {
        res.status(404).json({ error: "Expense not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  // Stock
  app.get("/api/stock", async (_req, res) => {
    try {
      const stock = await storage.getStock();
      res.json(stock);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock" });
    }
  });

  app.post("/api/stock", async (req, res) => {
    try {
      const stockItem = insertStockSchema.parse(req.body);
      const created = await storage.createOrUpdateStock(stockItem);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create/update stock" });
      }
    }
  });

  app.put("/api/stock/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const update = insertStockSchema.parse(req.body);
      
      // Validate quantity
      if (update.quantity !== undefined && update.quantity < 0) {
        res.status(400).json({ error: "Quantity cannot be negative" });
        return;
      }
      
      const updated = await storage.updateStock(id, update);
      if (!updated) {
        res.status(404).json({ error: "Stock not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update stock" });
      }
    }
  });

  app.delete("/api/stock/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteStock(id);
      if (!deleted) {
        res.status(404).json({ error: "Stock not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete stock" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
