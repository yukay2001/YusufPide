import { storage } from "./storage";

export async function seedInitialData() {
  // Check if products already exist
  const existingProducts = await storage.getProducts();
  if (existingProducts.length > 0) {
    console.log("Products already seeded, skipping...");
    return;
  }

  console.log("Seeding initial products...");

  const products = [
    // Pide çeşitleri
    { name: "Kıymalı Pide", price: "150", category: "Pide" },
    { name: "Kuşbaşılı Pide", price: "180", category: "Pide" },
    { name: "Kaşarlı Pide", price: "150", category: "Pide" },
    { name: "Kuşbaşı Kaşarlı Pide", price: "220", category: "Pide" },
    { name: "Peynirli Pide", price: "150", category: "Pide" },
    { name: "Kıymalı Kaşarlı Pide", price: "200", category: "Pide" },
    
    // Cantık çeşitleri
    { name: "Cantık", price: "75", category: "Cantık" },
    { name: "Kıymalı Kaşarlı Cantık", price: "100", category: "Cantık" },
    { name: "Kuşbaşı Kaşarlı Cantık", price: "120", category: "Cantık" },
    { name: "Kaşarlı Cantık", price: "120", category: "Cantık" },
    
    // İçecekler
    { name: "Ayran", price: "10", category: "İçecek" },
    { name: "Soda", price: "40", category: "İçecek" },
  ];

  for (const product of products) {
    await storage.createProduct(product);
  }

  console.log(`${products.length} products seeded successfully!`);
}
