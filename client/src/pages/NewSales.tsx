import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import DataTable from "@/components/DataTable";
import DateFilter from "@/components/DateFilter";

interface Product {
  id: string;
  name: string;
  price: string;
  category: string | null;
}

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

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
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
      toast({ title: "Satış kaydedildi" });
      setCart([]);
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
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      toast({ title: "Sepet boş", variant: "destructive" });
      return;
    }
    createSaleMutation.mutate(cart);
  };

  const salesColumns = [
    { header: "Tarih", accessor: "date", align: "left" as const },
    { header: "Toplam (₺)", accessor: "total", align: "right" as const },
  ];

  const formattedSales = sales.map(sale => ({
    date: new Date(sale.date).toLocaleString('tr-TR'),
    total: Number(sale.total).toFixed(2),
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Satış</h2>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Yeni Satış</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="md:col-span-2">
            <Label htmlFor="product-select">Ürün</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger id="product-select" data-testid="select-product">
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
              data-testid="input-quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={addToCart} className="w-full" data-testid="button-add-to-cart">
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
            <div className="border-t pt-4 flex items-center justify-between">
              <p className="text-xl font-bold">Toplam: {cartTotal.toFixed(2)} ₺</p>
              <Button
                onClick={handleCompleteSale}
                size="lg"
                data-testid="button-complete-sale"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Satışı Tamamla
              </Button>
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
    </div>
  );
}
