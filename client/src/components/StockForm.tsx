import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface StockFormProps {
  onSubmit: (data: { name: string; quantity: number }) => void;
}

export default function StockForm({ onSubmit }: StockFormProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && quantity) {
      onSubmit({
        name,
        quantity: Number(quantity),
      });
      setName("");
      setQuantity("");
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Stok Ekle</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label htmlFor="stock-name" className="text-sm">Ürün Adı</Label>
          <Input
            id="stock-name"
            data-testid="input-stock-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kıymalı"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="stock-quantity" className="text-sm">Adet</Label>
          <Input
            id="stock-quantity"
            data-testid="input-stock-quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            placeholder="10"
            className="mt-1.5"
          />
        </div>
        <div className="flex items-end">
          <Button 
            type="submit" 
            className="w-full"
            data-testid="button-add-stock"
          >
            Stok Ekle
          </Button>
        </div>
      </form>
    </Card>
  );
}
