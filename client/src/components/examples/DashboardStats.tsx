import DashboardStats from '../DashboardStats'
import { DollarSign, TrendingDown, TrendingUp, Package } from "lucide-react";

export default function DashboardStatsExample() {
  const stats = [
    { label: "Toplam Satış", value: "12,450.00 ₺", icon: DollarSign, trend: "up" as const },
    { label: "Toplam Gider", value: "3,200.00 ₺", icon: TrendingDown, trend: "down" as const },
    { label: "Net Kâr", value: "9,250.00 ₺", icon: TrendingUp, trend: "up" as const },
    { label: "En Çok Satılan", value: "Kıymalı", icon: Package },
  ];

  return <DashboardStats stats={stats} />
}
