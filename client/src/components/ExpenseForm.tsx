import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface ExpenseFormProps {
  onSubmit: (data: { category: string; amount: string }) => void;
}

export default function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category && amount) {
      onSubmit({
        category,
        amount: Number(amount).toFixed(2),
      });
      setCategory("");
      setAmount("");
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Gider Ekle</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label htmlFor="category" className="text-sm">Kategori</Label>
          <Input
            id="category"
            data-testid="input-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Elektrik / Un alımı"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="amount" className="text-sm">Tutar (₺)</Label>
          <Input
            id="amount"
            data-testid="input-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="mt-1.5"
          />
        </div>
        <div className="flex items-end">
          <Button 
            type="submit" 
            variant="destructive"
            className="w-full"
            data-testid="button-add-expense"
          >
            Gideri Kaydet
          </Button>
        </div>
      </form>
    </Card>
  );
}
