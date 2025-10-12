import { storage } from "./storage";
import bcrypt from "bcryptjs";

export async function seedInitialData() {
  // Ensure all required permissions exist
  console.log("Checking permissions...");
  let permissions = await storage.getPermissions();
  
  const requiredPermissions = [
    { key: "dashboard", name: "Dashboard" },
    { key: "sales", name: "Satış" },
    { key: "orders", name: "Siparişler" },
    { key: "kitchen", name: "Mutfak" },
    { key: "products", name: "Ürünler" },
    { key: "expenses", name: "Gider" },
    { key: "stock", name: "Stok" },
    { key: "reports", name: "Rapor" },
    { key: "users", name: "Kullanıcılar" },
    { key: "roles", name: "Roller" }
  ];
  
  for (const perm of requiredPermissions) {
    const exists = permissions.find(p => p.key === perm.key);
    if (!exists) {
      console.log(`Creating permission: ${perm.name}`);
      await storage.createPermission(perm);
    }
  }
  
  // Refresh permissions list
  permissions = await storage.getPermissions();
  console.log(`${permissions.length} permissions ready`);

  // Ensure all required roles exist
  console.log("Checking roles...");
  let roles = await storage.getRoles();
  let adminRole = roles.find(r => r.name === "Admin");
  let garsonRole = roles.find(r => r.name === "Garson");
  let mutfakRole = roles.find(r => r.name === "Mutfak");
  
  // Create Admin role if it doesn't exist
  if (!adminRole) {
    console.log("Creating Admin role with all permissions...");
    adminRole = await storage.createRole({ name: "Admin" });
    for (const permission of permissions) {
      await storage.assignPermissionToRole(adminRole.id, permission.id);
    }
    console.log("Admin role created successfully!");
  }
  
  // Create Garson role if it doesn't exist
  if (!garsonRole) {
    console.log("Creating Garson role...");
    garsonRole = await storage.createRole({ name: "Garson" });
    const garsonPermissions = permissions.filter(p => 
      ["dashboard", "sales", "orders", "products", "expenses", "reports"].includes(p.key)
    );
    for (const permission of garsonPermissions) {
      await storage.assignPermissionToRole(garsonRole.id, permission.id);
    }
    console.log("Garson role created successfully!");
  }
  
  // Create Mutfak role if it doesn't exist
  if (!mutfakRole) {
    console.log("Creating Mutfak role...");
    mutfakRole = await storage.createRole({ name: "Mutfak" });
    const kitchenPermission = permissions.find(p => p.key === "kitchen");
    if (kitchenPermission) {
      await storage.assignPermissionToRole(mutfakRole.id, kitchenPermission.id);
    }
    console.log("Mutfak role created successfully!");
  }
  
  console.log("All roles ready!");

  // Check if session already exists
  const existingSessions = await storage.getBusinessSessions();
  if (existingSessions.length === 0) {
    console.log("Creating initial business session...");
    const today = new Date();
    const formattedDate = today.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    await storage.createBusinessSession({
      date: today.toISOString().split('T')[0],
      name: formattedDate,
      isActive: true
    });
    console.log("Initial session created successfully!");
  }

  // Check if admin user already exists
  const existingUsers = await storage.getUsers();
  if (existingUsers.length === 0) {
    console.log("Creating initial admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
      roleId: adminRole.id
    });
    console.log("Initial admin user created successfully! (username: admin, password: admin123)");
  }

  // Check if categories already exist
  const existingCategories = await storage.getCategories();
  let yemekCategory, icecekCategory;
  
  if (existingCategories.length === 0) {
    console.log("Creating default categories...");
    yemekCategory = await storage.createCategory({ name: "Yemek" });
    icecekCategory = await storage.createCategory({ name: "İçecek" });
    console.log("Default categories created successfully!");
  } else {
    yemekCategory = existingCategories.find(c => c.name === "Yemek");
    icecekCategory = existingCategories.find(c => c.name === "İçecek");
    
    if (!yemekCategory) {
      yemekCategory = await storage.createCategory({ name: "Yemek" });
    }
    if (!icecekCategory) {
      icecekCategory = await storage.createCategory({ name: "İçecek" });
    }
  }

  // Check if products already exist
  const existingProducts = await storage.getProducts();
  if (existingProducts.length > 0) {
    console.log("Products already seeded, skipping...");
    return;
  }

  console.log("Seeding initial products...");

  const products = [
    // Pide çeşitleri
    { name: "Kıymalı Pide", price: "150", categoryId: yemekCategory.id },
    { name: "Kuşbaşılı Pide", price: "180", categoryId: yemekCategory.id },
    { name: "Kaşarlı Pide", price: "150", categoryId: yemekCategory.id },
    { name: "Kuşbaşı Kaşarlı Pide", price: "220", categoryId: yemekCategory.id },
    { name: "Peynirli Pide", price: "150", categoryId: yemekCategory.id },
    { name: "Kıymalı Kaşarlı Pide", price: "200", categoryId: yemekCategory.id },
    
    // Cantık çeşitleri
    { name: "Cantık", price: "75", categoryId: yemekCategory.id },
    { name: "Kıymalı Kaşarlı Cantık", price: "100", categoryId: yemekCategory.id },
    { name: "Kuşbaşı Kaşarlı Cantık", price: "120", categoryId: yemekCategory.id },
    { name: "Kaşarlı Cantık", price: "120", categoryId: yemekCategory.id },
    
    // İçecekler
    { name: "Ayran", price: "10", categoryId: icecekCategory.id },
    { name: "Soda", price: "40", categoryId: icecekCategory.id },
  ];

  for (const product of products) {
    await storage.createProduct(product);
  }

  console.log(`${products.length} products seeded successfully!`);
}
