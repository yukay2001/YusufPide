import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react";

interface Stat {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: "up" | "down";
}

interface DashboardStatsProps {
  stats: Stat[];
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-6" data-testid={`stat-card-${index}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold" data-testid={`stat-value-${index}`}>
                {stat.value}
              </div>
              {stat.trend && (
                stat.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
