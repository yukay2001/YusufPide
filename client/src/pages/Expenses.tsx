import { useState } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import DataTable from "@/components/DataTable";
import DateFilter from "@/components/DateFilter";

export default function Expenses() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  //todo: remove mock functionality
  const [expensesData] = useState([
    { date: "10.10.2025 10:00", category: "Elektrik", amount: "500.00" },
    { date: "09.10.2025 15:30", category: "Un alımı", amount: "1,200.00" },
    { date: "08.10.2025 09:00", category: "Kira", amount: "3,000.00" },
  ]);

  const columns = [
    { header: "Tarih", accessor: "date", align: "left" as const },
    { header: "Kategori", accessor: "category", align: "left" as const },
    { header: "Tutar (₺)", accessor: "amount", align: "right" as const },
  ];

  const handleAddExpense = (data: { category: string; amount: number }) => {
    console.log("Expense added:", data);
    //todo: remove mock functionality - implement actual expense addition
  };

  const handleExport = () => {
    console.log("Exporting expenses data...");
    //todo: remove mock functionality - implement actual CSV export
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gider</h2>
      <ExpenseForm onSubmit={handleAddExpense} />
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Gider Listesi</h3>
        <DateFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onClear={() => { setDateFrom(""); setDateTo(""); }}
          onExport={handleExport}
        />
        <DataTable columns={columns} data={expensesData} emptyMessage="Henüz gider kaydı yok" />
      </div>
    </div>
  );
}
