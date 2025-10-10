import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import StockForm from "@/components/StockForm";
import DataTable from "@/components/DataTable";

interface StockItem {
  id: string;
  name: string;
  quantity: number;
}

export default function Stock() {
  const { data: stock = [], isLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/stock"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; quantity: number }) => {
      return await apiRequest("POST", "/api/stock", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock"] });
    },
  });

  const columns = [
    { header: "Ürün Adı", accessor: "name", align: "left" as const },
    { header: "Adet", accessor: "quantity", align: "right" as const },
  ];

  const formattedStock = stock.map(item => ({
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
    </div>
  );
}
