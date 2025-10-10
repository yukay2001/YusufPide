import { useState } from "react";
import StockForm from "@/components/StockForm";
import DataTable from "@/components/DataTable";

export default function Stock() {
  //todo: remove mock functionality
  const [stockData] = useState([
    { name: "Kıymalı", quantity: "3" },
    { name: "Peynirli", quantity: "8" },
    { name: "Karışık", quantity: "2" },
    { name: "Sucuklu", quantity: "12" },
    { name: "Un", quantity: "1" },
  ]);

  const columns = [
    { header: "Ürün Adı", accessor: "name", align: "left" as const },
    { header: "Adet", accessor: "quantity", align: "right" as const },
  ];

  const handleAddStock = (data: { name: string; quantity: number }) => {
    console.log("Stock added:", data);
    //todo: remove mock functionality - implement actual stock addition
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Stok Yönetimi</h2>
      <StockForm onSubmit={handleAddStock} />
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Stok Listesi</h3>
        <DataTable columns={columns} data={stockData} emptyMessage="Henüz stok kaydı yok" />
      </div>
    </div>
  );
}
