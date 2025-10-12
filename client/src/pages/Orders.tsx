import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ShoppingCart, X, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category } from "@shared/schema";

interface RestaurantTable {
  id: string;
  name: string;
  orderNumber: number;
  createdAt: string;
}

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

export default function Orders() {
  const { toast } = useToast();
  const [addTableDialogOpen, setAddTableDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { data: tables = [] } = useQuery<RestaurantTable[]>({
    queryKey: ["/api/tables"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createTableMutation = useMutation({
    mutationFn: async (name: string) => {
      const nextOrderNumber = tables.length > 0 
        ? Math.max(...tables.map(t => t.orderNumber)) + 1 
        : 1;
      return await apiRequest("POST", "/api/tables", { 
        name, 
        orderNumber: nextOrderNumber 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      toast({ title: "Masa eklendi" });
      setAddTableDialogOpen(false);
      setNewTableName("");
    },
    onError: () => {
      toast({ title: "Masa eklenemedi", variant: "destructive" });
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/tables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      toast({ title: "Masa silindi" });
    },
    onError: () => {
      toast({ title: "Aktif siparişi olan masa silinemez", variant: "destructive" });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (tableId: string) => {
      return await apiRequest("POST", "/api/orders", { tableId });
    },
    onSuccess: (_data, tableId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tables", tableId, "active-order"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kitchen/active-orders"] });
      toast({ title: "Sipariş başlatıldı" });
    },
    onError: () => {
      toast({ title: "Sipariş başlatılamadı", variant: "destructive" });
    },
  });

  const addOrderItemMutation = useMutation({
    mutationFn: async ({ orderId, productId, quantity, tableId }: { orderId: string; productId: string; quantity: number; tableId: string }) => {
      return await apiRequest("POST", `/api/orders/${orderId}/items`, {
        productId,
        quantity,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tables", variables.tableId, "active-order"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kitchen/active-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/alerts"] });
      setSelectedProductId("");
      setQuantity("1");
    },
    onError: () => {
      toast({ title: "Ürün eklenemedi", variant: "destructive" });
    },
  });

  const deleteOrderItemMutation = useMutation({
    mutationFn: async ({ itemId, tableId }: { itemId: string; tableId: string }) => {
      return await apiRequest("DELETE", `/api/order-items/${itemId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tables", variables.tableId, "active-order"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kitchen/active-orders"] });
    },
    onError: () => {
      toast({ title: "Ürün silinemedi", variant: "destructive" });
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async ({ orderId, tableId }: { orderId: string; tableId: string }) => {
      return await apiRequest("PUT", `/api/orders/${orderId}`, { status: "completed" });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tables", variables.tableId, "active-order"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kitchen/active-orders"] });
      toast({ title: "Sipariş tamamlandı - Hesabı kapatmayı unutmayın" });
      // Don't close dialog - user needs to see "Close Bill" button
    },
    onError: () => {
      toast({ title: "Sipariş tamamlanamadı", variant: "destructive" });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async ({ orderId, tableId }: { orderId: string; tableId: string }) => {
      return await apiRequest("DELETE", `/api/orders/${orderId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tables", variables.tableId, "active-order"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kitchen/active-orders"] });
      toast({ title: "Sipariş iptal edildi" });
      setSelectedTableId(null);
    },
    onError: () => {
      toast({ title: "Sipariş iptal edilemedi", variant: "destructive" });
    },
  });

  const closeBillMutation = useMutation({
    mutationFn: async ({ orderId, tableId }: { orderId: string; tableId: string }) => {
      return await apiRequest("POST", `/api/orders/${orderId}/close-bill`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tables", variables.tableId, "active-order"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kitchen/active-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({ title: "Hesap kapatıldı" });
      setSelectedTableId(null);
    },
    onError: () => {
      toast({ title: "Hesap kapatılamadı", variant: "destructive" });
    },
  });

  const filteredProducts = selectedCategoryId
    ? products.filter(p => p.categoryId === selectedCategoryId)
    : products;

  const handleAddTable = () => {
    if (!newTableName.trim()) return;
    createTableMutation.mutate(newTableName);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold" data-testid="text-orders-title">Sipariş Yönetimi</h2>
          <p className="text-muted-foreground">Masa siparişlerini yönetin</p>
        </div>
        <Button
          onClick={() => setAddTableDialogOpen(true)}
          className="gap-2"
          data-testid="button-add-table"
        >
          <Plus className="w-4 h-4" />
          Masa Ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            onDelete={() => deleteTableMutation.mutate(table.id)}
            onSelect={() => setSelectedTableId(table.id)}
            onStartOrder={() => createOrderMutation.mutate(table.id)}
          />
        ))}
      </div>

      <Dialog open={addTableDialogOpen} onOpenChange={setAddTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Masa Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tableName">Masa Adı</Label>
              <Input
                id="tableName"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="örn: Masa 1"
                data-testid="input-table-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTableDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAddTable} data-testid="button-save-table">
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTableId} onOpenChange={() => setSelectedTableId(null)}>
        <DialogContent className="max-w-3xl">
          {selectedTableId && (
            <OrderDetails
              tableId={selectedTableId}
              products={filteredProducts}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
              quantity={quantity}
              setQuantity={setQuantity}
              onAddItem={(orderId) => {
                if (!selectedProductId || !quantity || Number(quantity) <= 0) return;
                addOrderItemMutation.mutate({ 
                  orderId, 
                  tableId: selectedTableId,
                  productId: selectedProductId, 
                  quantity: Number(quantity) 
                });
              }}
              onDeleteItem={(itemId) => deleteOrderItemMutation.mutate({ itemId, tableId: selectedTableId })}
              onCompleteOrder={(orderId) => completeOrderMutation.mutate({ orderId, tableId: selectedTableId })}
              onCancelOrder={(orderId) => cancelOrderMutation.mutate({ orderId, tableId: selectedTableId })}
              onCloseBill={(orderId) => closeBillMutation.mutate({ orderId, tableId: selectedTableId })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TableCard({
  table,
  onDelete,
  onSelect,
  onStartOrder,
}: {
  table: RestaurantTable;
  onDelete: () => void;
  onSelect: () => void;
  onStartOrder: () => void;
}) {
  const { data: activeOrder } = useQuery<Order | null>({
    queryKey: ["/api/tables", table.id, "active-order"],
    queryFn: async () => {
      const response = await fetch(`/api/tables/${table.id}/active-order`);
      return response.json();
    },
  });

  return (
    <Card className="hover-elevate" data-testid={`card-table-${table.id}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">{table.name}</CardTitle>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          data-testid={`button-delete-table-${table.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {activeOrder ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {activeOrder.status === 'completed' ? 'Tamamlandı' : 'Aktif Sipariş'}
              </div>
              {activeOrder.status === 'completed' && (
                <Badge variant="secondary" data-testid={`badge-completed-${table.id}`}>
                  Hazır
                </Badge>
              )}
            </div>
            <div className="text-2xl font-bold">{activeOrder.total} ₺</div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Boş</div>
        )}
      </CardContent>
      <CardFooter>
        {activeOrder ? (
          <Button 
            className="w-full gap-2" 
            onClick={onSelect}
            data-testid={`button-view-order-${table.id}`}
          >
            <ShoppingCart className="w-4 h-4" />
            Siparişi Gör
          </Button>
        ) : (
          <Button 
            className="w-full gap-2" 
            onClick={onStartOrder}
            data-testid={`button-start-order-${table.id}`}
          >
            <Plus className="w-4 h-4" />
            Sipariş Başlat
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function OrderDetails({
  tableId,
  products,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedProductId,
  setSelectedProductId,
  quantity,
  setQuantity,
  onAddItem,
  onDeleteItem,
  onCompleteOrder,
  onCancelOrder,
  onCloseBill,
}: {
  tableId: string;
  products: Product[];
  categories: Category[];
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  quantity: string;
  setQuantity: (q: string) => void;
  onAddItem: (orderId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onCompleteOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onCloseBill: (orderId: string) => void;
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  const { data: activeOrder } = useQuery<Order | null>({
    queryKey: ["/api/tables", tableId, "active-order"],
    queryFn: async () => {
      const response = await fetch(`/api/tables/${tableId}/active-order`);
      return response.json();
    },
  });

  const { data: orderItems = [] } = useQuery<OrderItem[]>({
    queryKey: ["/api/orders", activeOrder?.id, "items"],
    queryFn: async () => {
      if (!activeOrder) return [];
      const response = await fetch(`/api/orders/${activeOrder.id}/items`);
      return response.json();
    },
    enabled: !!activeOrder,
  });

  if (!activeOrder) {
    return <div className="text-center p-8">Sipariş bulunamadı</div>;
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Sipariş Detayı</DialogTitle>
      </DialogHeader>
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {activeOrder.status === 'active' && (
          <div className="space-y-4">
            <h3 className="font-semibold">Ürün Ekle</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Kategori</Label>
                <Select
                  value={selectedCategoryId || "all"}
                  onValueChange={(value) => setSelectedCategoryId(value === "all" ? null : value)}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Tüm Kategoriler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Kategoriler</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ürün</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger data-testid="select-product">
                    <SelectValue placeholder="Ürün seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {product.price} ₺
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">Adet</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  data-testid="input-quantity"
                />
              </div>
              <Button
                onClick={() => onAddItem(activeOrder.id)}
                className="gap-2"
                data-testid="button-add-item"
              >
                <Plus className="w-4 h-4" />
                Ekle
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-semibold">Sipariş İçeriği</h3>
          {orderItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz ürün eklenmedi</p>
          ) : (
            <div className="space-y-2">
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                  data-testid={`order-item-${item.id}`}
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity} x {item.price} ₺
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-bold">{item.total} ₺</div>
                    {activeOrder.status === 'active' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDeleteItem(item.id)}
                        data-testid={`button-delete-item-${item.id}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-xl font-bold">
            <span>Toplam:</span>
            <span data-testid="text-order-total">{activeOrder.total} ₺</span>
          </div>
        </div>
      </div>
      <DialogFooter className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setShowCancelConfirm(true)}
          className="gap-2"
          data-testid="button-cancel-order"
        >
          <X className="w-4 h-4" />
          İptal
        </Button>
        {activeOrder.status === 'active' ? (
          <Button
            onClick={() => onCompleteOrder(activeOrder.id)}
            className="gap-2"
            data-testid="button-complete-order"
          >
            <Check className="w-4 h-4" />
            Siparişi Tamamla
          </Button>
        ) : (
          <Button
            onClick={() => onCloseBill(activeOrder.id)}
            className="gap-2"
            data-testid="button-close-bill"
          >
            <Check className="w-4 h-4" />
            Hesabı Kapat
          </Button>
        )}
      </DialogFooter>
      
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Siparişi iptal et?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Siparişteki tüm ürünler silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-confirm-no">Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onCancelOrder(activeOrder.id);
                setShowCancelConfirm(false);
              }}
              data-testid="button-cancel-confirm-yes"
            >
              Evet, iptal et
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
