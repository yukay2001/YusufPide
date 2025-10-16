import { useQuery } from "@tanstack/react-query";
import DashboardStats from "@/components/DashboardStats";
import StockAlert from "@/components/StockAlert";
import { DollarSign, TrendingDown, TrendingUp, Package } from "lucide-react";

interface Sale {
  id: string;
  date: string;
  total: string;
}

interface SaleItem {
  id: string;
  saleId: string;
  productName: string;
  quantity: number;
  price: string;
  total: string;
}

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: string;
}

interface StockItem {
  id: string;
  name: string;
  quantity: number;
}

export default function Dashboard() {
  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: stock = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock"],
  });

  // Fetch all sale items to calculate top product
  const { data: allSaleItems = [] } = useQuery<SaleItem[]>({
    queryKey: ["/api/sales/items"],
    queryFn: async () => {
      const items: SaleItem[] = [];
      for (const sale of sales) {
        const response = await fetch(`/api/sales/${sale.id}/items`);
        if (!response.ok) {
          console.error(`Failed to fetch sale items for ${sale.id}`);
          continue;
        }
        const saleItems = await response.json();
        items.push(...saleItems);
      }
      return items;
    },
    enabled: sales.length > 0,
  });

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const netProfit = totalSales - totalExpenses;

  // Calculate top product
  const productCounts: { [key: string]: number } = {};
  allSaleItems.forEach(item => {
    productCounts[item.productName] = (productCounts[item.productName] || 0) + item.quantity;
  });
  const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  const stats = [
    { label: "Toplam Satış", value: `${totalSales.toFixed(2)} ₺`, icon: DollarSign, trend: "up" as const },
    { label: "Toplam Gider", value: `${totalExpenses.toFixed(2)} ₺`, icon: TrendingDown, trend: "down" as const },
    { label: "Net Kâr", value: `${netProfit.toFixed(2)} ₺`, icon: TrendingUp, trend: netProfit >= 0 ? "up" as const : "down" as const },
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
