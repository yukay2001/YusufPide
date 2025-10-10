import { 
  type Product, type InsertProduct,
  type Sale, type InsertSale,
  type SaleItem, type InsertSaleItem,
  type Expense, type InsertExpense,
  type Stock, type InsertStock
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Sales
  getSales(dateFrom?: Date, dateTo?: Date): Promise<Sale[]>;
  getSale(id: string): Promise<Sale | undefined>;
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<{ sale: Sale; items: SaleItem[] }>;
  getSaleItems(saleId: string): Promise<SaleItem[]>;

  // Expenses
  getExpenses(dateFrom?: Date, dateTo?: Date): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  deleteExpense(id: string): Promise<boolean>;

  // Stock
  getStock(): Promise<Stock[]>;
  getStockByName(name: string): Promise<Stock | undefined>;
  createOrUpdateStock(stock: InsertStock): Promise<Stock>;
  updateStockQuantity(name: string, quantityChange: number): Promise<Stock | undefined>;
}

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private sales: Map<string, Sale>;
  private saleItems: Map<string, SaleItem>;
  private expenses: Map<string, Expense>;
  private stock: Map<string, Stock>;

  constructor() {
    this.products = new Map();
    this.sales = new Map();
    this.saleItems = new Map();
    this.expenses = new Map();
    this.stock = new Map();
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
      category: insertProduct.category ?? null
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
  async getSales(dateFrom?: Date, dateTo?: Date): Promise<Sale[]> {
    let sales = Array.from(this.sales.values());
    
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

  async createSale(insertSale: InsertSale, insertItems: InsertSaleItem[]): Promise<{ sale: Sale; items: SaleItem[] }> {
    const saleId = randomUUID();
    const sale: Sale = { 
      id: saleId, 
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

  // Expenses
  async getExpenses(dateFrom?: Date, dateTo?: Date): Promise<Expense[]> {
    let expenses = Array.from(this.expenses.values());
    
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

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = { 
      id, 
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

  async createOrUpdateStock(insertStock: InsertStock): Promise<Stock> {
    const existing = await this.getStockByName(insertStock.name);
    const quantity = insertStock.quantity ?? 0;
    
    if (existing) {
      const updated: Stock = { 
        ...existing, 
        quantity: existing.quantity + quantity
      };
      this.stock.set(existing.id, updated);
      return updated;
    }
    
    const id = randomUUID();
    const stock: Stock = { 
      id, 
      name: insertStock.name,
      quantity
    };
    this.stock.set(id, stock);
    return stock;
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
}

export const storage = new MemStorage();
