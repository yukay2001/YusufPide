import { useState } from "react";
import SalesForm from "@/components/SalesForm";
import DataTable from "@/components/DataTable";
import DateFilter from "@/components/DateFilter";

export default function Sales() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  //todo: remove mock functionality
  const [salesData] = useState([
    { date: "10.10.2025 14:30", product: "Kıymalı", quantity: "2", total: "120.00" },
    { date: "10.10.2025 14:15", product: "Peynirli", quantity: "1", total: "55.00" },
    { date: "10.10.2025 13:45", product: "Karışık", quantity: "3", total: "210.00" },
    { date: "10.10.2025 12:30", product: "Kıymalı", quantity: "1", total: "60.00" },
  ]);

  const columns = [
    { header: "Tarih", accessor: "date", align: "left" as const },
    { header: "Ürün", accessor: "product", align: "left" as const },
    { header: "Adet", accessor: "quantity", align: "center" as const },
    { header: "Toplam (₺)", accessor: "total", align: "right" as const },
  ];

  const handleAddSale = (data: { productName: string; quantity: number; price: number }) => {
    console.log("Sale added:", data);
    //todo: remove mock functionality - implement actual sale addition
  };

  const handleExport = () => {
    console.log("Exporting sales data...");
    //todo: remove mock functionality - implement actual CSV export
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Satış</h2>
      <SalesForm onSubmit={handleAddSale} />
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Satış Listesi</h3>
        <DateFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onClear={() => { setDateFrom(""); setDateTo(""); }}
          onExport={handleExport}
        />
        <DataTable columns={columns} data={salesData} emptyMessage="Henüz satış kaydı yok" />
      </div>
    </div>
  );
}
