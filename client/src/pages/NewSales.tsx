import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, ShoppingCart, Eye } from "lucide-react";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import DataTable from "@/components/DataTable";
import DateFilter from "@/components/DateFilter";
import type { Product, Category } from "@shared/schema";

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: string;
  total: number;
}

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

export default function NewSales() {
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [customerPayment, setCustomerPayment] = useState("");
  const [viewingSaleId, setViewingSaleId] = useState<string | null>(null);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: activeSession } = useQuery<{ id: string; isActive: boolean; date: string } | null>({
    queryKey: ["/api/sessions/active"],
  });

  const { data: saleItems = [] } = useQuery<SaleItem[]>({
    queryKey: ["/api/sales", viewingSaleId, "items"],
    queryFn: async () => {
      const response = await fetch(`/api/sales/${viewingSaleId}/items`);
      return response.json();
    },
    enabled: !!viewingSaleId,
  });

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales", dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      const url = `/api/sales${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      return response.json();
    },
  });

  const createSaleMutation = useMutation({
    mutationFn: async (items: CartItem[]) => {
      // Only send productId and quantity to server - server will fetch prices
      const saleItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      return await apiRequest("POST", "/api/sales", { items: saleItems });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/alerts"] });
      toast({ title: "Satış kaydedildi" });
      setCart([]);
    },
    onError: () => {
      toast({ title: "Satış kaydedilemedi", variant: "destructive" });
    },
  });

  const deleteSaleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/sales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({ title: "Satış silindi" });
    },
    onError: () => {
      toast({ title: "Silme başarısız", variant: "destructive" });
    },
  });

  const addToCart = () => {
    if (!selectedProductId || !quantity || Number(quantity) <= 0) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const existingIndex = cart.findIndex((item) => item.productId === selectedProductId);
    
    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += Number(quantity);
      updated[existingIndex].total = updated[existingIndex].quantity * Number(product.price);
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          quantity: Number(quantity),
          price: product.price,
          total: Number(product.price) * Number(quantity),
        },
      ]);
    }

    setSelectedProductId("");
    setQuantity("1");
  };

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter((item) => item.productId !== productId);
    setCart(newCart);
    if (newCart.length === 0) {
      setCustomerPayment("");
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);
  const change = customerPayment ? Number(customerPayment) - cartTotal : 0;

  // Filter products by selected category
  const filteredProducts = selectedCategoryId
    ? products.filter(p => p.categoryId === selectedCategoryId)
    : products;

  // Clear selected product if it's not in filtered products
  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    // If current product is not in the new filtered list, clear selection
    if (selectedProductId) {
      const newFilteredProducts = categoryId
        ? products.filter(p => p.categoryId === categoryId)
        : products;
      const productExists = newFilteredProducts.some(p => p.id === selectedProductId);
      if (!productExists) {
        setSelectedProductId("");
      }
    }
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      toast({ title: "Sepet boş", variant: "destructive" });
      return;
    }
    createSaleMutation.mutate(cart);
    setCustomerPayment("");
  };

  const salesColumns = [
    { header: "Tarih", accessor: "date", align: "left" as const },
    { header: "Toplam (₺)", accessor: "total", align: "right" as const },
    {
      header: "İşlem",
      align: "center" as const,
      render: (sale: Sale) => (
        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewingSaleId(sale.id)}
            data-testid={`button-view-sale-${sale.id}`}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteSaleMutation.mutate(sale.id)}
            data-testid={`button-delete-sale-${sale.id}`}
            disabled={isReadOnly}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const formattedSales = sales.map(sale => ({
    ...sale,
    date: new Date(sale.date).toLocaleString('tr-TR'),
    total: Number(sale.total).toFixed(2),
  }));

  const isReadOnly = activeSession?.date !== new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Satış</h2>

      {isReadOnly && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Geçmiş gün görüntülüyorsunuz. Sadece satış ve gider kayıtlarını görüntüleyebilirsiniz.
          </p>
        </div>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Yeni Satış</h3>
        
        {categories.length > 0 && (
          <div className="mb-4">
            <Label className="mb-2 block">Kategori Filtresi</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategoryId === null ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(null)}
                data-testid="button-category-all"
              >
                Tümü
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategoryId === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryChange(category.id)}
                  data-testid={`button-category-${category.id}`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="md:col-span-2">
            <Label htmlFor="product-select">Ürün</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger id="product-select" data-testid="select-product">
                <SelectValue placeholder="Ürün seçin" />
              </SelectTrigger>
              <SelectContent>
                {filteredProducts.map((product) => (
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
              data-testid="input-quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={addToCart} 
              className="w-full" 
              data-testid="button-add-to-cart"
              disabled={isReadOnly}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ekle
            </Button>
          </div>
        </div>

        {cart.length > 0 && (
          <>
            <div className="border-t pt-4 space-y-2">
              <h4 className="font-semibold">Sepet</h4>
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                  data-testid={`cart-item-${item.productId}`}
                >
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x {item.price} ₺
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold">{item.total.toFixed(2)} ₺</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.productId)}
                      data-testid={`button-remove-${item.productId}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xl font-bold mb-3">Toplam: {cartTotal.toFixed(2)} ₺</p>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <div>
                      <Label htmlFor="customer-payment" className="text-sm">Müşteri Ödeme (₺)</Label>
                      <Input
                        id="customer-payment"
                        data-testid="input-customer-payment"
                        type="number"
                        value={customerPayment}
                        onChange={(e) => setCustomerPayment(e.target.value)}
                        placeholder="600"
                        step="0.01"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Para Üstü</Label>
                      <div className="mt-1 p-2 bg-muted rounded-md flex items-center h-9" data-testid="text-change">
                        <p className="font-bold text-lg">
                          {change >= 0 ? change.toFixed(2) : "0.00"} ₺
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleCompleteSale}
                  size="lg"
                  data-testid="button-complete-sale"
                  disabled={isReadOnly}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Satışı Tamamla
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Satış Geçmişi</h3>
        <DateFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onClear={() => { setDateFrom(""); setDateTo(""); }}
        />
        {isLoading ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">Yükleniyor...</p>
          </Card>
        ) : (
          <DataTable columns={salesColumns} data={formattedSales} emptyMessage="Henüz satış kaydı yok" />
        )}
      </div>

      <Dialog open={!!viewingSaleId} onOpenChange={(open) => !open && setViewingSaleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Satış Detayları</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            {saleItems.length === 0 ? (
              <p className="text-muted-foreground text-center">Yükleniyor...</p>
            ) : (
              saleItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                  data-testid={`sale-detail-item-${item.id}`}
                >
                  <div>
                    <p className="font-medium" data-testid={`sale-detail-name-${item.id}`}>{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x {Number(item.price).toFixed(2)} ₺
                    </p>
                  </div>
                  <p className="font-bold" data-testid={`sale-detail-total-${item.id}`}>
                    {Number(item.total).toFixed(2)} ₺
                  </p>
                </div>
              ))
            )}
            {saleItems.length > 0 && (
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="font-bold">Toplam:</span>
                <span className="font-bold text-lg" data-testid="sale-detail-grand-total">
                  {saleItems.reduce((sum, item) => sum + Number(item.total), 0).toFixed(2)} ₺
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
