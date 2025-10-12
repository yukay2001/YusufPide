import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import passport from "./auth";
import { requireAuth, requireRole } from "./auth";
import { 
  insertProductSchema, 
  insertSaleSchema, 
  insertExpenseSchema, 
  insertStockSchema, 
  insertBusinessSessionSchema, 
  insertCategorySchema,
  insertRestaurantTableSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertUserSchema
} from "@shared/schema";
import { z } from "zod";
import type { User } from "@shared/schema";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Giriş sırasında bir hata oluştu" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Kullanıcı adı veya şifre hatalı" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Giriş sırasında bir hata oluştu" });
        }
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Çıkış sırasında bir hata oluştu" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Giriş yapmanız gerekiyor" });
    }
    const user = req.user as User;
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // User Management
  app.get("/api/users", requireRole("admin"), async (_req, res) => {
    try {
      const users = await storage.getUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Kullanıcılar yüklenemedi" });
    }
  });

  app.post("/api/users", requireRole("admin"), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Bu kullanıcı adı zaten kullanılıyor" });
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Kullanıcı oluşturulamadı" });
    }
  });

  app.delete("/api/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      
      const currentUser = req.user as User;
      if (currentUser.id === id) {
        return res.status(400).json({ error: "Kendi hesabınızı silemezsiniz" });
      }

      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Kullanıcı silinemedi" });
    }
  });

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
          await storage.updateStockQuantityById(product.stockItemId, -item.quantity);
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

  app.get("/api/stock/alerts", async (_req, res) => {
    try {
      const stock = await storage.getStock();
      const alerts = stock.filter(item => {
        if (item.alertThreshold === null || item.alertThreshold === undefined) {
          return false;
        }
        return item.quantity <= item.alertThreshold;
      });
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock alerts" });
    }
  });

  // Restaurant Tables
  app.get("/api/tables", async (_req, res) => {
    try {
      const tables = await storage.getTables();
      res.json(tables);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tables" });
    }
  });

  app.post("/api/tables", async (req, res) => {
    try {
      const table = insertRestaurantTableSchema.parse(req.body);
      const created = await storage.createTable(table);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create table" });
      }
    }
  });

  app.put("/api/tables/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const update = insertRestaurantTableSchema.partial().parse(req.body);
      const updated = await storage.updateTable(id, update);
      if (!updated) {
        res.status(404).json({ error: "Table not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update table" });
      }
    }
  });

  app.delete("/api/tables/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTable(id);
      if (!deleted) {
        res.status(400).json({ error: "Cannot delete table with active orders" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete table" });
    }
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    try {
      const { tableId } = req.query;
      const orders = await storage.getOrders(tableId as string | undefined);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrder(id);
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.get("/api/tables/:tableId/active-order", async (req, res) => {
    try {
      const { tableId } = req.params;
      const order = await storage.getActiveOrderForTable(tableId);
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const order = insertOrderSchema.parse(req.body);
      const activeOrder = await storage.getActiveOrderForTable(order.tableId);
      if (activeOrder) {
        res.status(400).json({ error: "Table already has an active order" });
        return;
      }
      const created = await storage.createOrder(order);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create order" });
      }
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const update = insertOrderSchema.partial().parse(req.body);
      const updated = await storage.updateOrder(id, update);
      if (!updated) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update order" });
      }
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteOrder(id);
      if (!deleted) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // Order Items
  app.get("/api/orders/:orderId/items", async (req, res) => {
    try {
      const { orderId } = req.params;
      const items = await storage.getOrderItems(orderId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order items" });
    }
  });

  app.post("/api/orders/:orderId/items", async (req, res) => {
    try {
      const { orderId } = req.params;
      // Only validate productId and quantity from request
      const requestSchema = z.object({
        productId: z.string(),
        quantity: z.number().int().positive()
      });
      const itemData = requestSchema.parse(req.body);
      
      // Fetch product to get current price and name
      const product = await storage.getProduct(itemData.productId);
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      const item = {
        productId: product.id,
        productName: product.name,
        quantity: itemData.quantity,
        price: product.price,
        total: (Number(product.price) * itemData.quantity).toFixed(2)
      };

      const created = await storage.addOrderItem(orderId, item);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to add order item" });
      }
    }
  });

  app.put("/api/order-items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertOrderItemSchema.partial().parse(req.body);
      
      // Get the current item to access its price and orderId
      const currentItem = await storage.getOrderItem(id);
      if (!currentItem) {
        res.status(404).json({ error: "Order item not found" });
        return;
      }
      
      // Recalculate total using current or updated values
      const finalUpdate = { ...updateData };
      const quantity = updateData.quantity ?? currentItem.quantity;
      const price = updateData.price ?? currentItem.price;
      finalUpdate.total = (Number(price) * quantity).toFixed(2);
      
      const updated = await storage.updateOrderItem(id, finalUpdate);
      if (!updated) {
        res.status(404).json({ error: "Order item not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update order item" });
      }
    }
  });

  app.delete("/api/order-items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteOrderItem(id);
      if (!deleted) {
        res.status(404).json({ error: "Order item not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete order item" });
    }
  });

  app.get("/api/kitchen/active-orders", async (_req, res) => {
    try {
      const orders = await storage.getActiveOrders();
      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const table = await storage.getTable(order.tableId);
          const items = await storage.getOrderItems(order.id);
          return {
            order,
            table,
            items,
          };
        })
      );
      res.json(ordersWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active orders" });
    }
  });

  app.post("/api/orders/:orderId/close-bill", async (req, res) => {
    try {
      const { orderId } = req.params;
      
      // Get the order
      const order = await storage.getOrder(orderId);
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      // Only allow closing completed orders
      if (order.status !== 'completed') {
        res.status(400).json({ error: "Only completed orders can be closed" });
        return;
      }

      // Get order items
      const orderItems = await storage.getOrderItems(orderId);

      // Get active session
      const session = await storage.getActiveSession();
      if (!session) {
        res.status(400).json({ error: "No active session" });
        return;
      }

      // Create sale with items
      const saleItems = orderItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }));

      const result = await storage.createSale(session.id, {
        total: order.total,
      }, saleItems);

      // Delete the order (this will also cascade delete order items)
      await storage.deleteOrder(orderId);

      res.json({ success: true, sale: result.sale });
    } catch (error) {
      console.error("Error closing bill:", error);
      res.status(500).json({ error: "Failed to close bill" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
