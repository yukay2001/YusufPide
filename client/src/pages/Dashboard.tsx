import { useState } from "react";
import DashboardStats from "@/components/DashboardStats";
import StockAlert from "@/components/StockAlert";
import { DollarSign, TrendingDown, TrendingUp, Package } from "lucide-react";

export default function Dashboard() {
  //todo: remove mock functionality
  const [sales] = useState([
    { id: 1, productName: "Kıymalı", quantity: 5, total: 300 },
    { id: 2, productName: "Peynirli", quantity: 3, total: 165 },
    { id: 3, productName: "Kıymalı", quantity: 2, total: 120 },
    { id: 4, productName: "Karışık", quantity: 4, total: 280 },
  ]);

  const [expenses] = useState([
    { id: 1, amount: 500 },
    { id: 2, amount: 300 },
  ]);

  const [stock] = useState([
    { name: "Kıymalı", quantity: 3 },
    { name: "Peynirli", quantity: 8 },
    { name: "Karışık", quantity: 2 },
    { name: "Un", quantity: 1 },
  ]);

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalSales - totalExpenses;

  const productCounts: { [key: string]: number } = {};
  sales.forEach(sale => {
    productCounts[sale.productName] = (productCounts[sale.productName] || 0) + sale.quantity;
  });
  const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  const stats = [
    { label: "Toplam Satış", value: `${totalSales.toFixed(2)} ₺`, icon: DollarSign, trend: "up" as const },
    { label: "Toplam Gider", value: `${totalExpenses.toFixed(2)} ₺`, icon: TrendingDown, trend: "down" as const },
    { label: "Net Kâr", value: `${netProfit.toFixed(2)} ₺`, icon: TrendingUp, trend: "up" as const },
    { label: "En Çok Satılan", value: topProduct, icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-6">Genel Bakış</h2>
        <DashboardStats stats={stats} />
      </div>
      <StockAlert items={stock} />
    </div>
  );
}
