import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import ExpenseForm from "@/components/ExpenseForm";
import DataTable from "@/components/DataTable";
import DateFilter from "@/components/DateFilter";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: string;
}

export default function Expenses() {
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: activeSession } = useQuery<{ id: string; isActive: boolean; date: string } | null>({
    queryKey: ["/api/sessions/active"],
  });

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
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

  const createMutation = useMutation({
    mutationFn: async (data: { category: string; amount: string }) => {
      return await apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Gider eklendi" });
    },
    onError: () => {
      toast({ title: "Gider eklenemedi", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Gider silindi" });
    },
    onError: () => {
      toast({ title: "Silme başarısız", variant: "destructive" });
    },
  });

  const isReadOnly = activeSession?.date !== new Date().toISOString().split('T')[0];

  const columns = [
    { header: "Tarih", accessor: "date", align: "left" as const },
    { header: "Kategori", accessor: "category", align: "left" as const },
    { header: "Tutar (₺)", accessor: "amount", align: "right" as const },
    {
      header: "İşlem",
      align: "center" as const,
      render: (expense: Expense) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => deleteMutation.mutate(expense.id)}
          data-testid={`button-delete-expense-${expense.id}`}
          disabled={isReadOnly}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      ),
    },
  ];

  const formattedExpenses = expenses.map(expense => ({
    ...expense,
    date: new Date(expense.date).toLocaleString('tr-TR'),
    category: expense.category,
    amount: Number(expense.amount).toFixed(2),
  }));

  const handleAddExpense = (data: { category: string; amount: string }) => {
    createMutation.mutate(data);
  };

  const handleExport = () => {
    const csv = [
      ["Tarih", "Kategori", "Tutar"].join(","),
      ...formattedExpenses.map(e => [e.date, e.category, e.amount].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "giderler.csv";
    link.click();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gider</h2>
      
      {isReadOnly && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Geçmiş gün görüntülüyorsunuz. Sadece satış ve gider kayıtlarını görüntüleyebilirsiniz.
          </p>
        </div>
      )}
      
      {!isReadOnly && <ExpenseForm onSubmit={handleAddExpense} />}
      
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
        {isLoading ? (
          <div className="p-6 border rounded-md">
            <p className="text-center text-muted-foreground">Yükleniyor...</p>
          </div>
        ) : (
          <DataTable columns={columns} data={formattedExpenses} emptyMessage="Henüz gider kaydı yok" />
        )}
      </div>
    </div>
  );
}
