import DataTable from '../DataTable'

export default function DataTableExample() {
  const columns = [
    { header: "Tarih", accessor: "date", align: "left" as const },
    { header: "Ürün", accessor: "product", align: "left" as const },
    { header: "Adet", accessor: "quantity", align: "center" as const },
    { header: "Toplam (₺)", accessor: "total", align: "right" as const },
  ];

  const data = [
    { date: "10.10.2025 14:30", product: "Kıymalı", quantity: "2", total: "120.00" },
    { date: "10.10.2025 14:15", product: "Peynirli", quantity: "1", total: "55.00" },
    { date: "10.10.2025 13:45", product: "Karışık", quantity: "3", total: "210.00" },
  ];

  return <DataTable columns={columns} data={data} />
}
