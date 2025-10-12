import { 
  type Product, type InsertProduct,
  type Sale, type InsertSale,
  type SaleItem, type InsertSaleItem,
  type Expense, type InsertExpense,
  type Stock, type InsertStock,
  type BusinessSession, type InsertBusinessSession,
  type Category, type InsertCategory,
  type RestaurantTable, type InsertRestaurantTable,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type User, type InsertUser,
  type Role, type InsertRole,
  type Permission, type InsertPermission,
  type RolePermission, type InsertRolePermission
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { roles, permissions, rolePermissions, users as usersTable } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Business Sessions
  getBusinessSessions(): Promise<BusinessSession[]>;
  getBusinessSession(id: string): Promise<BusinessSession | undefined>;
  getActiveSession(): Promise<BusinessSession | null>;
  createBusinessSession(session: InsertBusinessSession): Promise<BusinessSession>;
  setActiveSession(id: string): Promise<BusinessSession | undefined>;
  deactivateAllSessions(): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Sales
  getSales(sessionId: string, dateFrom?: Date, dateTo?: Date): Promise<Sale[]>;
  getSale(id: string): Promise<Sale | undefined>;
  createSale(sessionId: string, sale: InsertSale, items: InsertSaleItem[]): Promise<{ sale: Sale; items: SaleItem[] }>;
  getSaleItems(saleId: string): Promise<SaleItem[]>;
  deleteSale(id: string): Promise<boolean>;
  getSalesStatistics(sessionId: string): Promise<{
    todaysMostPopular: { productId: string; productName: string; quantity: number } | null;
    bestSelling: { productId: string; productName: string; quantity: number } | null;
    leastSelling: { productId: string; productName: string; quantity: number } | null;
    allProducts: Array<{ productId: string; productName: string; quantity: number; revenue: number }>;
  }>;

  // Expenses
  getExpenses(sessionId: string, dateFrom?: Date, dateTo?: Date): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(sessionId: string, expense: InsertExpense): Promise<Expense>;
  deleteExpense(id: string): Promise<boolean>;

  // Stock
  getStock(): Promise<Stock[]>;
  getStockByName(name: string): Promise<Stock | undefined>;
  getStockItem(id: string): Promise<Stock | undefined>;
  createOrUpdateStock(stock: InsertStock): Promise<Stock>;
  updateStock(id: string, update: Partial<InsertStock>): Promise<Stock | undefined>;
  updateStockQuantity(name: string, quantityChange: number): Promise<Stock | undefined>;
  updateStockQuantityById(id: string, quantityChange: number): Promise<Stock | undefined>;
  deductStockByName(name: string, quantity: number): Promise<Stock | undefined>;
  deleteStock(id: string): Promise<boolean>;

  // Restaurant Tables
  getTables(): Promise<RestaurantTable[]>;
  getTable(id: string): Promise<RestaurantTable | undefined>;
  createTable(table: InsertRestaurantTable): Promise<RestaurantTable>;
  updateTable(id: string, table: Partial<InsertRestaurantTable>): Promise<RestaurantTable | undefined>;
  deleteTable(id: string): Promise<boolean>;

  // Orders
  getOrders(tableId?: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getActiveOrders(): Promise<Order[]>;
  getActiveOrderForTable(tableId: string): Promise<Order | null>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;

  // Order Items
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  getOrderItem(id: string): Promise<OrderItem | undefined>;
  addOrderItem(orderId: string, item: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: string, item: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: string): Promise<boolean>;

  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Roles
  getRoles(): Promise<Role[]>;
  getRole(id: string): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: string): Promise<boolean>;

  // Permissions
  getPermissions(): Promise<Permission[]>;
  getPermission(id: string): Promise<Permission | undefined>;
  getPermissionByKey(key: string): Promise<Permission | undefined>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  updatePermission(id: string, permission: Partial<InsertPermission>): Promise<Permission | undefined>;
  deletePermission(id: string): Promise<boolean>;

  // Role Permissions
  getRolePermissions(roleId: string): Promise<RolePermission[]>;
  getUserPermissions(userId: string): Promise<Permission[]>;
  assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission>;
  removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private businessSessions: Map<string, BusinessSession>;
  private categories: Map<string, Category>;
  private products: Map<string, Product>;
  private sales: Map<string, Sale>;
  private saleItems: Map<string, SaleItem>;
  private expenses: Map<string, Expense>;
  private stock: Map<string, Stock>;
  private restaurantTables: Map<string, RestaurantTable>;
  private orders: Map<string, Order>;
  private orderItems: Map<string, OrderItem>;
  private users: Map<string, User>;
  private activeSessionId: string | null;

  constructor() {
    this.businessSessions = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.sales = new Map();
    this.saleItems = new Map();
    this.expenses = new Map();
    this.stock = new Map();
    this.restaurantTables = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.users = new Map();
    this.activeSessionId = null;
  }

  // Business Sessions
  async getBusinessSessions(): Promise<BusinessSession[]> {
    return Array.from(this.businessSessions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getBusinessSession(id: string): Promise<BusinessSession | undefined> {
    return this.businessSessions.get(id);
  }

  async getActiveSession(): Promise<BusinessSession | null> {
    if (!this.activeSessionId) return null;
    return this.businessSessions.get(this.activeSessionId) || null;
  }

  async createBusinessSession(insertSession: InsertBusinessSession): Promise<BusinessSession> {
    const id = randomUUID();
    
    // Set all other sessions to inactive if this one is active
    if (insertSession.isActive) {
      this.businessSessions.forEach(session => {
        session.isActive = false;
      });
    }
    
    const session: BusinessSession = { 
      id,
      date: insertSession.date,
      name: insertSession.name,
      isActive: insertSession.isActive ?? false,
      createdAt: new Date()
    };
    
    this.businessSessions.set(id, session);
    
    if (session.isActive) {
      this.activeSessionId = id;
    }
    
    return session;
  }

  async setActiveSession(id: string): Promise<BusinessSession | undefined> {
    const session = this.businessSessions.get(id);
    if (!session) return undefined;
    
    // Set all sessions to inactive
    this.businessSessions.forEach(s => {
      s.isActive = false;
    });
    
    // Set this session to active
    session.isActive = true;
    this.activeSessionId = id;
    this.businessSessions.set(id, session);
    
    return session;
  }

  async deactivateAllSessions(): Promise<void> {
    // Set all sessions to inactive
    this.businessSessions.forEach(s => {
      s.isActive = false;
    });
    
    // Clear active session ID
    this.activeSessionId = null;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = {
      id,
      name: insertCategory.name,
      createdAt: new Date()
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, update: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updated: Category = { ...category, ...update };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { 
      id, 
      name: insertProduct.name,
      price: insertProduct.price,
      categoryId: insertProduct.categoryId ?? null,
      stockItemId: insertProduct.stockItemId ?? null
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, update: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updated: Product = { ...product, ...update };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Sales
  async getSales(sessionId: string, dateFrom?: Date, dateTo?: Date): Promise<Sale[]> {
    let sales = Array.from(this.sales.values()).filter(sale => sale.sessionId === sessionId);
    
    if (dateFrom || dateTo) {
      sales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        if (dateFrom && saleDate < dateFrom) return false;
        if (dateTo && saleDate > dateTo) return false;
        return true;
      });
    }
    
    return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getSale(id: string): Promise<Sale | undefined> {
    return this.sales.get(id);
  }

  async createSale(sessionId: string, insertSale: InsertSale, insertItems: InsertSaleItem[]): Promise<{ sale: Sale; items: SaleItem[] }> {
    const saleId = randomUUID();
    const sale: Sale = { 
      id: saleId,
      sessionId,
      date: new Date(),
      total: insertSale.total
    };
    this.sales.set(saleId, sale);

    const items: SaleItem[] = insertItems.map(item => {
      const itemId = randomUUID();
      const saleItem: SaleItem = { 
        id: itemId, 
        saleId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      };
      this.saleItems.set(itemId, saleItem);
      return saleItem;
    });

    return { sale, items };
  }

  async getSaleItems(saleId: string): Promise<SaleItem[]> {
    return Array.from(this.saleItems.values()).filter(item => item.saleId === saleId);
  }

  async deleteSale(id: string): Promise<boolean> {
    // Delete sale items first
    const items = await this.getSaleItems(id);
    items.forEach(item => this.saleItems.delete(item.id));
    // Delete the sale
    return this.sales.delete(id);
  }

  async getSalesStatistics(sessionId: string): Promise<{
    todaysMostPopular: { productId: string; productName: string; quantity: number } | null;
    bestSelling: { productId: string; productName: string; quantity: number } | null;
    leastSelling: { productId: string; productName: string; quantity: number } | null;
    allProducts: Array<{ productId: string; productName: string; quantity: number; revenue: number }>;
  }> {
    // Get ALL sales across ALL sessions for all-time stats
    const allSales = Array.from(this.sales.values());
    
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Maps to aggregate product statistics
    const productStatsAll = new Map<string, { productName: string; quantity: number; revenue: number }>();
    const productStatsToday = new Map<string, { productName: string; quantity: number }>();
    
    // Process all sale items from all sessions
    for (const sale of allSales) {
      const items = await this.getSaleItems(sale.id);
      const saleDate = new Date(sale.date);
      const isToday = saleDate >= today;
      
      for (const item of items) {
        // All-time stats (across all sessions)
        const existingAll = productStatsAll.get(item.productId) || { 
          productName: item.productName, 
          quantity: 0, 
          revenue: 0 
        };
        productStatsAll.set(item.productId, {
          productName: item.productName,
          quantity: existingAll.quantity + item.quantity,
          revenue: existingAll.revenue + Number(item.total)
        });
        
        // Today's stats (across all sessions but filtered by date)
        if (isToday) {
          const existingToday = productStatsToday.get(item.productId) || { 
            productName: item.productName, 
            quantity: 0 
          };
          productStatsToday.set(item.productId, {
            productName: item.productName,
            quantity: existingToday.quantity + item.quantity
          });
        }
      }
    }
    
    // Convert to arrays and sort
    const allProductsArray = Array.from(productStatsAll.entries()).map(([productId, stats]) => ({
      productId,
      productName: stats.productName,
      quantity: stats.quantity,
      revenue: stats.revenue
    })).sort((a, b) => b.quantity - a.quantity);
    
    const todayProductsArray = Array.from(productStatsToday.entries()).map(([productId, stats]) => ({
      productId,
      productName: stats.productName,
      quantity: stats.quantity
    })).sort((a, b) => b.quantity - a.quantity);
    
    // Find best and least selling
    const bestSelling = allProductsArray.length > 0 ? allProductsArray[0] : null;
    const leastSelling = allProductsArray.length > 0 ? allProductsArray[allProductsArray.length - 1] : null;
    const todaysMostPopular = todayProductsArray.length > 0 ? todayProductsArray[0] : null;
    
    return {
      todaysMostPopular,
      bestSelling,
      leastSelling,
      allProducts: allProductsArray
    };
  }

  // Expenses
  async getExpenses(sessionId: string, dateFrom?: Date, dateTo?: Date): Promise<Expense[]> {
    let expenses = Array.from(this.expenses.values()).filter(expense => expense.sessionId === sessionId);
    
    if (dateFrom || dateTo) {
      expenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        if (dateFrom && expenseDate < dateFrom) return false;
        if (dateTo && expenseDate > dateTo) return false;
        return true;
      });
    }
    
    return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(sessionId: string, insertExpense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = { 
      id,
      sessionId,
      date: new Date(),
      ...insertExpense 
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async deleteExpense(id: string): Promise<boolean> {
    return this.expenses.delete(id);
  }

  // Stock
  async getStock(): Promise<Stock[]> {
    return Array.from(this.stock.values());
  }

  async getStockByName(name: string): Promise<Stock | undefined> {
    return Array.from(this.stock.values()).find(s => s.name === name);
  }

  async getStockItem(id: string): Promise<Stock | undefined> {
    return this.stock.get(id);
  }

  async createOrUpdateStock(insertStock: InsertStock): Promise<Stock> {
    const existing = await this.getStockByName(insertStock.name);
    const quantity = insertStock.quantity ?? 0;
    
    if (existing) {
      const updated: Stock = { 
        ...existing, 
        quantity: existing.quantity + quantity,
        ...(insertStock.price !== undefined && { price: insertStock.price }),
        ...(insertStock.categoryId !== undefined && { categoryId: insertStock.categoryId }),
        ...(insertStock.alertThreshold !== undefined && { alertThreshold: insertStock.alertThreshold })
      };
      this.stock.set(existing.id, updated);
      return updated;
    }
    
    const id = randomUUID();
    const stock: Stock = { 
      id, 
      name: insertStock.name,
      quantity,
      price: insertStock.price ?? null,
      categoryId: insertStock.categoryId ?? null,
      alertThreshold: insertStock.alertThreshold ?? null
    };
    this.stock.set(id, stock);
    return stock;
  }

  async updateStock(id: string, update: Partial<InsertStock>): Promise<Stock | undefined> {
    const stock = this.stock.get(id);
    if (!stock) return undefined;
    
    const updated: Stock = { ...stock, ...update };
    this.stock.set(id, updated);
    return updated;
  }

  async updateStockQuantity(name: string, quantityChange: number): Promise<Stock | undefined> {
    const stock = await this.getStockByName(name);
    if (!stock) return undefined;
    
    const updated: Stock = { 
      ...stock, 
      quantity: stock.quantity + quantityChange 
    };
    this.stock.set(stock.id, updated);
    return updated;
  }

  async updateStockQuantityById(id: string, quantityChange: number): Promise<Stock | undefined> {
    const stock = this.stock.get(id);
    if (!stock) return undefined;
    
    const updated: Stock = { 
      ...stock, 
      quantity: stock.quantity + quantityChange 
    };
    this.stock.set(stock.id, updated);
    return updated;
  }

  async deductStockByName(name: string, quantity: number): Promise<Stock | undefined> {
    const stock = await this.getStockByName(name);
    if (!stock) return undefined;
    
    const updated: Stock = { 
      ...stock, 
      quantity: Math.max(0, stock.quantity - quantity)
    };
    this.stock.set(stock.id, updated);
    return updated;
  }

  async deleteStock(id: string): Promise<boolean> {
    return this.stock.delete(id);
  }

  // Restaurant Tables
  async getTables(): Promise<RestaurantTable[]> {
    return Array.from(this.restaurantTables.values())
      .sort((a, b) => a.orderNumber - b.orderNumber);
  }

  async getTable(id: string): Promise<RestaurantTable | undefined> {
    return this.restaurantTables.get(id);
  }

  async createTable(insertTable: InsertRestaurantTable): Promise<RestaurantTable> {
    const id = randomUUID();
    const table: RestaurantTable = {
      id,
      name: insertTable.name,
      orderNumber: insertTable.orderNumber,
      createdAt: new Date()
    };
    this.restaurantTables.set(id, table);
    return table;
  }

  async updateTable(id: string, update: Partial<InsertRestaurantTable>): Promise<RestaurantTable | undefined> {
    const table = this.restaurantTables.get(id);
    if (!table) return undefined;
    
    const updated: RestaurantTable = { ...table, ...update };
    this.restaurantTables.set(id, updated);
    return updated;
  }

  async deleteTable(id: string): Promise<boolean> {
    const activeOrder = await this.getActiveOrderForTable(id);
    if (activeOrder) {
      return false;
    }
    return this.restaurantTables.delete(id);
  }

  // Orders
  async getOrders(tableId?: string): Promise<Order[]> {
    const orders = Array.from(this.orders.values());
    if (tableId) {
      return orders.filter(o => o.tableId === tableId);
    }
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getActiveOrderForTable(tableId: string): Promise<Order | null> {
    const orders = Array.from(this.orders.values());
    const activeOrder = orders.find(o => o.tableId === tableId && (o.status === 'active' || o.status === 'completed'));
    return activeOrder || null;
  }

  async getActiveOrders(): Promise<Order[]> {
    const orders = Array.from(this.orders.values());
    return orders.filter(o => o.status === 'active');
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      id,
      tableId: insertOrder.tableId,
      status: insertOrder.status ?? 'active',
      total: insertOrder.total ?? '0',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, update: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updated: Order = { 
      ...order, 
      ...update,
      updatedAt: new Date()
    };
    this.orders.set(id, updated);
    return updated;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const items = await this.getOrderItems(id);
    items.forEach(item => this.orderItems.delete(item.id));
    return this.orders.delete(id);
  }

  // Order Items
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId);
  }

  async getOrderItem(id: string): Promise<OrderItem | undefined> {
    return this.orderItems.get(id);
  }

  async addOrderItem(orderId: string, insertItem: InsertOrderItem): Promise<OrderItem> {
    const id = randomUUID();
    const item: OrderItem = {
      id,
      orderId,
      productId: insertItem.productId,
      productName: insertItem.productName,
      quantity: insertItem.quantity,
      price: insertItem.price,
      total: insertItem.total
    };
    this.orderItems.set(id, item);
    
    const order = this.orders.get(orderId);
    if (order) {
      const orderItems = await this.getOrderItems(orderId);
      const total = orderItems.reduce((sum, item) => sum + Number(item.total), 0);
      await this.updateOrder(orderId, { total: total.toFixed(2) });
    }
    
    return item;
  }

  async updateOrderItem(id: string, update: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const item = this.orderItems.get(id);
    if (!item) return undefined;
    
    const updated: OrderItem = { ...item, ...update };
    this.orderItems.set(id, updated);
    
    const orderItems = await this.getOrderItems(item.orderId);
    const total = orderItems.reduce((sum, oi) => sum + Number(oi.total), 0);
    await this.updateOrder(item.orderId, { total: total.toFixed(2) });
    
    return updated;
  }

  async deleteOrderItem(id: string): Promise<boolean> {
    const item = this.orderItems.get(id);
    if (!item) return false;
    
    const deleted = this.orderItems.delete(id);
    if (deleted) {
      const orderItems = await this.getOrderItems(item.orderId);
      const total = orderItems.reduce((sum, oi) => sum + Number(oi.total), 0);
      await this.updateOrder(item.orderId, { total: total.toFixed(2) });
    }
    
    return deleted;
  }

  // Users
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      roleId: insertUser.roleId,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, update: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated: User = { ...user, ...update };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Roles - using database
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async getRole(id: string): Promise<Role | undefined> {
    const result = await db.select().from(roles).where(eq(roles.id, id));
    return result[0];
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const result = await db.select().from(roles).where(eq(roles.name, name));
    return result[0];
  }

  async createRole(role: InsertRole): Promise<Role> {
    const result = await db.insert(roles).values(role).returning();
    return result[0];
  }

  async updateRole(id: string, update: Partial<InsertRole>): Promise<Role | undefined> {
    const result = await db.update(roles).set(update).where(eq(roles.id, id)).returning();
    return result[0];
  }

  async deleteRole(id: string): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id)).returning();
    return result.length > 0;
  }

  // Permissions - using database
  async getPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions);
  }

  async getPermission(id: string): Promise<Permission | undefined> {
    const result = await db.select().from(permissions).where(eq(permissions.id, id));
    return result[0];
  }

  async getPermissionByKey(key: string): Promise<Permission | undefined> {
    const result = await db.select().from(permissions).where(eq(permissions.key, key));
    return result[0];
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const result = await db.insert(permissions).values(permission).returning();
    return result[0];
  }

  async updatePermission(id: string, update: Partial<InsertPermission>): Promise<Permission | undefined> {
    const result = await db.update(permissions).set(update).where(eq(permissions.id, id)).returning();
    return result[0];
  }

  async deletePermission(id: string): Promise<boolean> {
    const result = await db.delete(permissions).where(eq(permissions.id, id)).returning();
    return result.length > 0;
  }

  // Role Permissions - using database
  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, roleId));
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    
    const result = await db
      .select({ permission: permissions })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, user.roleId));
    
    return result.map(r => r.permission);
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission> {
    const result = await db.insert(rolePermissions).values({ roleId, permissionId }).returning();
    return result[0];
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
    const result = await db.delete(rolePermissions)
      .where(and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId)
      ))
      .returning();
    return result.length > 0;
  }
}

export const storage = new MemStorage();
