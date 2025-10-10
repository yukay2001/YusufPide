import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Plus, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StockItem {
  id: string;
  name: string;
  quantity: number;
  price: string | null;
  categoryId: string | null;
  alertThreshold: number | null;
}

interface Category {
  id: string;
  name: string;
}

export default function Stock() {
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    price: "",
    categoryId: "",
    alertThreshold: "",
  });

  const { data: stock = [], isLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/stock"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; quantity: number; price?: string; categoryId?: string; alertThreshold?: number }) => {
      return await apiRequest("POST", "/api/stock", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      setIsAddDialogOpen(false);
      setFormData({ name: "", quantity: "", price: "", categoryId: "", alertThreshold: "" });
      toast({ title: "Stok eklendi" });
    },
    onError: () => {
      toast({ title: "Hata oluştu", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/stock/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      setEditingItem(null);
      setFormData({ name: "", quantity: "", price: "", categoryId: "", alertThreshold: "" });
      toast({ title: "Stok güncellendi" });
    },
    onError: () => {
      toast({ title: "Güncelleme başarısız", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/stock/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      toast({ title: "Stok silindi" });
    },
    onError: () => {
      toast({ title: "Silme başarısız", variant: "destructive" });
    },
  });

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      price: item.price || "",
      categoryId: item.categoryId || "",
      alertThreshold: item.alertThreshold?.toString() || "",
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: "Ürün adı gerekli", variant: "destructive" });
      return;
    }
    
    const quantity = Number(formData.quantity);
    if (isNaN(quantity) || quantity < 0) {
      toast({ title: "Geçerli bir adet girin", variant: "destructive" });
      return;
    }

    const data: any = { name: formData.name, quantity };
    
    if (formData.price) {
      data.price = formData.price;
    }
    
    if (formData.categoryId) {
      data.categoryId = formData.categoryId;
    }
    
    if (formData.alertThreshold) {
      const threshold = Number(formData.alertThreshold);
      if (!isNaN(threshold) && threshold >= 0) {
        data.alertThreshold = threshold;
      }
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Check for low stock items
  const lowStockItems = stock.filter(item => 
    item.alertThreshold !== null && 
    item.alertThreshold > 0 && 
    item.quantity <= item.alertThreshold
  );

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    return category?.name;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold" data-testid="text-stock-title">Stok Yönetimi</h2>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-stock">
          <Plus className="w-4 h-4 mr-2" />
          Stok Ekle
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950" data-testid="alert-low-stock">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>{lowStockItems.length} ürün</strong> stok uyarı seviyesinin altında!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="col-span-full text-center text-muted-foreground">Yükleniyor...</p>
        ) : stock.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground">Henüz stok kaydı yok</p>
        ) : (
          stock.map((item) => {
            const isLowStock = item.alertThreshold !== null && item.alertThreshold > 0 && item.quantity <= item.alertThreshold;
            const categoryName = getCategoryName(item.categoryId);
            
            return (
              <Card 
                key={item.id} 
                className={`p-4 ${isLowStock ? 'border-orange-500 bg-orange-50 dark:bg-orange-950' : ''}`}
                data-testid={`card-stock-${item.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg" data-testid={`text-stock-name-${item.id}`}>{item.name}</h3>
                    {categoryName && (
                      <Badge variant="secondary" className="mt-1" data-testid={`badge-category-${item.id}`}>
                        {categoryName}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                      data-testid={`button-edit-stock-${item.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(item.id)}
                      data-testid={`button-delete-stock-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stok:</span>
                    <span className={`font-bold ${isLowStock ? 'text-orange-600' : ''}`} data-testid={`text-stock-quantity-${item.id}`}>
                      {item.quantity} adet
                    </span>
                  </div>
                  
                  {item.price && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Fiyat:</span>
                      <span className="font-medium" data-testid={`text-stock-price-${item.id}`}>
                        {Number(item.price).toFixed(2)} ₺
                      </span>
                    </div>
                  )}
                  
                  {item.alertThreshold !== null && item.alertThreshold > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Uyarı Seviyesi:</span>
                      <span className="text-sm" data-testid={`text-stock-alert-${item.id}`}>
                        {item.alertThreshold} adet
                      </span>
                    </div>
                  )}
                  
                  {isLowStock && (
                    <div className="flex items-center gap-1 text-orange-600 text-sm pt-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Stok azaldı!</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={isAddDialogOpen || !!editingItem} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingItem(null);
          setFormData({ name: "", quantity: "", price: "", categoryId: "", alertThreshold: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Stok Düzenle" : "Stok Ekle"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="stock-name">Ürün Adı *</Label>
              <Input
                id="stock-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Ayran"
                data-testid="input-stock-name"
              />
            </div>
            
            <div>
              <Label htmlFor="stock-category">Kategori</Label>
              <Select 
                value={formData.categoryId} 
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger data-testid="select-stock-category">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Kategori Yok</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="stock-quantity">Adet *</Label>
              <Input
                id="stock-quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
                data-testid="input-stock-quantity"
              />
            </div>
            
            <div>
              <Label htmlFor="stock-price">Fiyat (₺)</Label>
              <Input
                id="stock-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                data-testid="input-stock-price"
              />
            </div>
            
            <div>
              <Label htmlFor="stock-alert">Stok Uyarı Seviyesi</Label>
              <Input
                id="stock-alert"
                type="number"
                value={formData.alertThreshold}
                onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                placeholder="10"
                data-testid="input-stock-alert-threshold"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Stok bu seviyenin altına düştüğünde uyarı gösterilir
              </p>
            </div>
            
            <Button onClick={handleSave} className="w-full" data-testid="button-save-stock">
              {editingItem ? "Güncelle" : "Ekle"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
