import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DateFilter from "@/components/DateFilter";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

interface Sale {
  id: string;
  date: string;
  total: string;
}

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: string;
}

export default function Reports() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: sales = [] } = useQuery<Sale[]>({
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

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      const url = `/api/expenses${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      return response.json();
    },
  });

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const netProfit = totalSales - totalExpenses;

  const handleExport = () => {
    const salesRows = sales.map(s => `Satış,${new Date(s.date).toLocaleString('tr-TR')},${s.total}`);
    const expenseRows = expenses.map(e => `Gider,${new Date(e.date).toLocaleString('tr-TR')},${e.amount}`);
    const csv = [
      "Tür,Tarih,Tutar",
      ...salesRows,
      ...expenseRows,
      "",
      `Toplam Satış,,${totalSales.toFixed(2)}`,
      `Toplam Gider,,${totalExpenses.toFixed(2)}`,
      `Net Kâr,,${netProfit.toFixed(2)}`,
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "rapor.csv";
    link.click();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Rapor</h2>
      
      <DateFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClear={() => { setDateFrom(""); setDateTo(""); }}
        onExport={handleExport}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Toplam Satış</span>
            <DollarSign className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold text-green-600" data-testid="total-sales">
            {totalSales.toFixed(2)} ₺
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Seçili dönem için toplam satış
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Toplam Gider</span>
            <TrendingDown className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold text-red-600" data-testid="total-expenses">
            {totalExpenses.toFixed(2)} ₺
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Seçili dönem için toplam gider
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Net Kâr</span>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="net-profit">
            {netProfit.toFixed(2)} ₺
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Satış - Gider farkı
          </p>
        </Card>
      </div>
    </div>
  );
}
