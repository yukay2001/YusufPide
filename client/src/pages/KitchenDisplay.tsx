import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Order {
  id: string;
  tableId: string;
  status: string;
  total: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: string;
  total: string;
}

interface RestaurantTable {
  id: string;
  name: string;
  createdAt: string;
}

interface OrderWithDetails {
  order: Order;
  table: RestaurantTable;
  items: OrderItem[];
}

export default function KitchenDisplay() {
  const { data: activeOrders = [], refetch } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/kitchen/active-orders"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Separate new orders (created in last 2 minutes) from older ones
  const now = new Date();
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

  const newOrders = activeOrders.filter(
    ({ order }) => new Date(order.createdAt) > twoMinutesAgo
  );
  const olderOrders = activeOrders.filter(
    ({ order }) => new Date(order.createdAt) <= twoMinutesAgo
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold" data-testid="text-kitchen-title">
            Mutfak Ekranı
          </h2>
          <p className="text-muted-foreground">Aktif siparişleri görüntüleyin</p>
        </div>
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-muted-foreground" />
          <span className="text-lg font-semibold" data-testid="text-total-orders">
            {activeOrders.length} Aktif Sipariş
          </span>
        </div>
      </div>

      {newOrders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold">Yeni Siparişler</h3>
            <Badge variant="destructive" data-testid="badge-new-orders">
              {newOrders.length} YENİ
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newOrders.map(({ order, table, items }) => (
              <OrderCard
                key={order.id}
                order={order}
                table={table}
                items={items}
                isNew={true}
              />
            ))}
          </div>
        </div>
      )}

      {olderOrders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Devam Eden Siparişler</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {olderOrders.map(({ order, table, items }) => (
              <OrderCard
                key={order.id}
                order={order}
                table={table}
                items={items}
                isNew={false}
              />
            ))}
          </div>
        </div>
      )}

      {activeOrders.length === 0 && (
        <div className="text-center py-12">
          <UtensilsCrossed className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground" data-testid="text-no-orders">
            Henüz aktif sipariş yok
          </p>
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  table,
  items,
  isNew,
}: {
  order: Order;
  table: RestaurantTable;
  items: OrderItem[];
  isNew: boolean;
}) {
  return (
    <Card
      className={isNew ? "border-2 border-destructive shadow-lg" : ""}
      data-testid={`order-card-${order.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg" data-testid={`text-table-name-${order.id}`}>
            {table.name}
          </CardTitle>
          {isNew && (
            <Badge variant="destructive" className="animate-pulse">
              YENİ
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span data-testid={`text-order-time-${order.id}`}>
            {formatDistanceToNow(new Date(order.createdAt), {
              addSuffix: true,
              locale: tr,
            })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 bg-muted rounded-md"
              data-testid={`order-item-${item.id}`}
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{item.productName}</div>
              </div>
              <Badge variant="secondary" data-testid={`item-quantity-${item.id}`}>
                {item.quantity}x
              </Badge>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between font-semibold">
            <span>Toplam:</span>
            <span data-testid={`text-order-total-${order.id}`}>{order.total} ₺</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
