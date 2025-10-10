import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface StockItem {
  name: string;
  quantity: number;
}

interface StockAlertProps {
  items: StockItem[];
  threshold?: number;
}

export default function StockAlert({ items, threshold = 5 }: StockAlertProps) {
  const lowStock = items.filter(item => item.quantity < threshold);

  if (lowStock.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Kritik Stoklar</h3>
        <p className="text-sm text-muted-foreground" data-testid="no-alerts">
          Tüm stoklar yeterli seviyede
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        Kritik Stoklar
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {lowStock.map((item, idx) => (
          <div 
            key={idx} 
            className="p-3 border-l-4 border-destructive bg-destructive/5 rounded"
            data-testid={`alert-item-${idx}`}
          >
            <div className="font-medium">{item.name}</div>
            <div className="text-sm text-muted-foreground">
              Kalan: {item.quantity} adet
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
