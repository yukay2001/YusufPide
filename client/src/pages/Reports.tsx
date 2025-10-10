import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Award, Calendar } from "lucide-react";

interface ProductStats {
  productId: string;
  productName: string;
  quantity: number;
  revenue?: number;
}

interface SalesStatistics {
  todaysMostPopular: ProductStats | null;
  bestSelling: ProductStats | null;
  leastSelling: ProductStats | null;
  allProducts: Array<ProductStats & { revenue: number }>;
}

export default function Reports() {
  const { data: stats, isLoading } = useQuery<SalesStatistics>({
    queryKey: ["/api/reports/sales-statistics"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Raporlar</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Raporlar</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Henüz satış verisi bulunmuyor.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold" data-testid="text-page-title">Raporlar</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-today-popular">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugünün En Popüler Ürünü</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.todaysMostPopular ? (
              <div>
                <div className="text-2xl font-bold" data-testid="text-today-popular-name">
                  {stats.todaysMostPopular.productName}
                </div>
                <p className="text-xs text-muted-foreground" data-testid="text-today-popular-quantity">
                  {stats.todaysMostPopular.quantity} adet satıldı
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Bugün satış yok</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-best-selling">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Çok Satan Ürün</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.bestSelling ? (
              <div>
                <div className="text-2xl font-bold" data-testid="text-best-selling-name">
                  {stats.bestSelling.productName}
                </div>
                <p className="text-xs text-muted-foreground" data-testid="text-best-selling-quantity">
                  {stats.bestSelling.quantity} adet satıldı
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Henüz satış yok</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-least-selling">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Az Satan Ürün</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.leastSelling ? (
              <div>
                <div className="text-2xl font-bold" data-testid="text-least-selling-name">
                  {stats.leastSelling.productName}
                </div>
                <p className="text-xs text-muted-foreground" data-testid="text-least-selling-quantity">
                  {stats.leastSelling.quantity} adet satıldı
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Henüz satış yok</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-all-products">
        <CardHeader>
          <CardTitle>Ürün Satış İstatistikleri</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.allProducts.length > 0 ? (
            <div className="space-y-4">
              {stats.allProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`row-product-${product.productId}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium" data-testid={`text-product-name-${product.productId}`}>
                        {product.productName}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`text-product-quantity-${product.productId}`}>
                        {product.quantity} adet
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" data-testid={`badge-product-revenue-${product.productId}`}>
                      {Number(product.revenue).toFixed(2)} ₺
                    </Badge>
                    {index === 0 && (
                      <TrendingUp className="h-5 w-5 text-green-600" data-testid="icon-trending-up" />
                    )}
                    {index === stats.allProducts.length - 1 && stats.allProducts.length > 1 && (
                      <TrendingDown className="h-5 w-5 text-red-600" data-testid="icon-trending-down" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Henüz satış verisi bulunmuyor.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
