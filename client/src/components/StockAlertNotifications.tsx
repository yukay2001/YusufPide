import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { Stock } from "@shared/schema";

export default function StockAlertNotifications() {
  const { data: alerts = [], isLoading } = useQuery<Stock[]>({
    queryKey: ["/api/stock/alerts"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const hasAlerts = alerts.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-stock-alerts"
        >
          <Bell className="h-5 w-5" />
          {hasAlerts && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              data-testid="badge-alert-count"
            >
              {alerts.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end" data-testid="popover-stock-alerts">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Stok Uyarıları</h4>
            {hasAlerts && (
              <Badge variant="destructive" data-testid="badge-total-alerts">
                {alerts.length}
              </Badge>
            )}
          </div>
          
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Yükleniyor...</div>
          ) : alerts.length === 0 ? (
            <div className="text-sm text-muted-foreground" data-testid="text-no-alerts">
              Stok uyarısı bulunmuyor
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20"
                  data-testid={`alert-item-${item.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm" data-testid={`text-stock-name-${item.id}`}>
                      {item.name}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-stock-quantity-${item.id}`}>
                      Kalan: {item.quantity} adet
                    </p>
                    {item.alertThreshold !== null && (
                      <p className="text-xs text-muted-foreground" data-testid={`text-alert-threshold-${item.id}`}>
                        Uyarı eşiği: {item.alertThreshold}
                      </p>
                    )}
                  </div>
                  <Badge variant="destructive" className="shrink-0">
                    Düşük
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
