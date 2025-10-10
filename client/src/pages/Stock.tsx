import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import StockForm from "@/components/StockForm";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface StockItem {
  id: string;
  name: string;
  quantity: number;
}

export default function Stock() {
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");

  const { data: stock = [], isLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/stock"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; quantity: number }) => {
      return await apiRequest("POST", "/api/stock", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      toast({ title: "Stok eklendi" });
    },
    onError: () => {
      toast({ title: "Hata oluştu", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; quantity: number } }) => {
      return await apiRequest("PUT", `/api/stock/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
      setEditingItem(null);
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
    setEditName(item.name);
    setEditQuantity(item.quantity.toString());
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editName.trim()) {
      toast({ title: "Ürün adı gerekli", variant: "destructive" });
      return;
    }
    
    const quantity = Number(editQuantity);
    if (isNaN(quantity) || quantity < 0) {
      toast({ title: "Geçerli bir adet girin", variant: "destructive" });
      return;
    }

    updateMutation.mutate({
      id: editingItem.id,
      data: { name: editName, quantity }
    });
  };

  const columns = [
    { header: "Ürün Adı", accessor: "name", align: "left" as const },
    { header: "Adet", accessor: "quantity", align: "right" as const },
    {
      header: "İşlem",
      align: "center" as const,
      render: (item: StockItem) => (
        <div className="flex justify-center gap-2">
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
      ),
    },
  ];

  const formattedStock = stock.map(item => ({
    ...item,
    name: item.name,
    quantity: item.quantity.toString(),
  }));

  const handleAddStock = (data: { name: string; quantity: number }) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Stok Yönetimi</h2>
      <StockForm onSubmit={handleAddStock} />
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Stok Listesi</h3>
        {isLoading ? (
          <div className="p-6 border rounded-md">
            <p className="text-center text-muted-foreground">Yükleniyor...</p>
          </div>
        ) : (
          <DataTable columns={columns} data={formattedStock} emptyMessage="Henüz stok kaydı yok" />
        )}
      </div>

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stok Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-name">Ürün Adı</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                data-testid="input-edit-stock-name"
              />
            </div>
            <div>
              <Label htmlFor="edit-quantity">Adet</Label>
              <Input
                id="edit-quantity"
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                data-testid="input-edit-stock-quantity"
              />
            </div>
            <Button onClick={handleSaveEdit} className="w-full" data-testid="button-save-stock">
              Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
