import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface SalesFormProps {
  onSubmit: (data: { productName: string; quantity: number; price: number }) => void;
}

export default function SalesForm({ onSubmit }: SalesFormProps) {
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productName && quantity && price) {
      onSubmit({
        productName,
        quantity: Number(quantity),
        price: Number(price),
      });
      setProductName("");
      setQuantity("1");
      setPrice("");
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Satış Ekle</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <Label htmlFor="product-name" className="text-sm">Ürün Adı</Label>
          <Input
            id="product-name"
            data-testid="input-product-name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Kıymalı"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="quantity" className="text-sm">Adet</Label>
          <Input
            id="quantity"
            data-testid="input-quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="price" className="text-sm">Birim Fiyat (₺)</Label>
          <Input
            id="price"
            data-testid="input-price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="mt-1.5"
          />
        </div>
        <div className="flex items-end">
          <Button 
            type="submit" 
            className="w-full"
            data-testid="button-add-sale"
          >
            Satışı Kaydet
          </Button>
        </div>
      </form>
    </Card>
  );
}
