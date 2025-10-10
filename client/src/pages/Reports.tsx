import { useState } from "react";
import DateFilter from "@/components/DateFilter";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

export default function Reports() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  //todo: remove mock functionality
  const totalSales = 12450.00;
  const totalExpenses = 3200.00;
  const netProfit = totalSales - totalExpenses;

  const handleExport = () => {
    console.log("Exporting report...");
    //todo: remove mock functionality - implement actual report export
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
