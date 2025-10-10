import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Edit2, FolderPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category } from "@shared/schema";

export default function Products() {
  const { toast } = useToast();
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Product form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  
  // Category form state
  const [categoryName, setCategoryName] = useState("");

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Product mutations
  const createProductMutation = useMutation({
    mutationFn: async (data: { name: string; price: string; categoryId?: string }) => {
      return await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Ürün eklendi" });
      resetProductForm();
      setIsProductDialogOpen(false);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; price: string; categoryId?: string }) => {
      return await apiRequest("PUT", `/api/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Ürün güncellendi" });
      resetProductForm();
      setIsProductDialogOpen(false);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Ürün silindi" });
    },
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return await apiRequest("POST", "/api/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Kategori oluşturuldu" });
      resetCategoryForm();
      setIsCategoryDialogOpen(false);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string }) => {
      return await apiRequest("PUT", `/api/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Kategori güncellendi" });
      resetCategoryForm();
      setIsCategoryDialogOpen(false);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Kategori silindi" });
    },
  });

  const resetProductForm = () => {
    setName("");
    setPrice("");
    setCategoryId("");
    setEditingProduct(null);
  };

  const resetCategoryForm = () => {
    setCategoryName("");
    setEditingCategory(null);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name,
      price,
      categoryId: categoryId || undefined,
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, ...productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, name: categoryName });
    } else {
      createCategoryMutation.mutate({ name: categoryName });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price);
    setCategoryId(product.categoryId || "");
    setIsProductDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setIsCategoryDialogOpen(true);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    return category?.name || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ürün Yönetimi</h2>
        <div className="flex gap-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
            setIsCategoryDialogOpen(open);
            if (!open) resetCategoryForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-manage-categories">
                <FolderPlus className="w-4 h-4 mr-2" />
                Kategori Yönet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Kategori Düzenle" : "Yeni Kategori"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Kategori Adı</Label>
                  <Input
                    id="category-name"
                    data-testid="input-category-name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Yemek, İçecek, vb."
                    required
                  />
                </div>
                <Button type="submit" className="w-full" data-testid="button-save-category">
                  {editingCategory ? "Güncelle" : "Oluştur"}
                </Button>
              </form>

              {categoriesLoading ? (
                <p className="text-center text-muted-foreground">Yükleniyor...</p>
              ) : categories.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <Label>Mevcut Kategoriler</Label>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-2 border rounded" data-testid={`category-item-${category.id}`}>
                        <span>{category.name}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditCategory(category)}
                            data-testid={`button-edit-category-${category.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCategoryMutation.mutate(category.id)}
                            data-testid={`button-delete-category-${category.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>

          <Dialog open={isProductDialogOpen} onOpenChange={(open) => {
            setIsProductDialogOpen(open);
            if (!open) resetProductForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-product">
                <Plus className="w-4 h-4 mr-2" />
                Ürün Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Ürün Düzenle" : "Yeni Ürün"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="product-name">Ürün Adı</Label>
                  <Input
                    id="product-name"
                    data-testid="input-product-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Kıymalı Pide"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="product-price">Fiyat (₺)</Label>
                  <Input
                    id="product-price"
                    data-testid="input-product-price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="150"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="product-category">Kategori (İsteğe Bağlı)</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger data-testid="select-product-category">
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" " data-testid="select-category-none">Kategorisiz</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id} data-testid={`select-category-${category.id}`}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" data-testid="button-save-product">
                  {editingProduct ? "Güncelle" : "Ekle"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {productsLoading ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">Yükleniyor...</p>
        </Card>
      ) : products.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">Henüz ürün eklenmemiş</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="p-4" data-testid={`product-card-${product.id}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  {getCategoryName(product.categoryId) && (
                    <p className="text-sm text-muted-foreground">{getCategoryName(product.categoryId)}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditProduct(product)}
                    data-testid={`button-edit-${product.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteProductMutation.mutate(product.id)}
                    data-testid={`button-delete-${product.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="text-2xl font-bold">{product.price} ₺</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
