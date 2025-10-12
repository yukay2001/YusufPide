import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import NewSales from "@/pages/NewSales";
import Orders from "@/pages/Orders";
import KitchenDisplay from "@/pages/KitchenDisplay";
import Products from "@/pages/Products";
import Expenses from "@/pages/Expenses";
import Stock from "@/pages/Stock";
import Reports from "@/pages/Reports";
import Login from "@/pages/Login";
import ThemeToggle from "@/components/ThemeToggle";
import SessionSelector from "@/components/SessionSelector";
import StockAlertNotifications from "@/components/StockAlertNotifications";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, ShoppingCart, TrendingDown, Package, FileText, TagIcon, Utensils, UtensilsCrossed, LogOut, Users as UsersIcon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import Users from "@/pages/Users";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Dashboard} />
      <Route path="/sales" component={NewSales} />
      <Route path="/orders" component={Orders} />
      <Route path="/kitchen" component={KitchenDisplay} />
      <Route path="/products" component={Products} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/stock" component={Stock} />
      <Route path="/reports" component={Reports} />
      <Route path="/users" component={Users} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Çıkış başarısız");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/login");
    }
  });

  const allNavItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard" },
    { path: "/sales", label: "Satış", icon: ShoppingCart, permission: "sales" },
    { path: "/orders", label: "Siparişler", icon: Utensils, permission: "orders" },
    { path: "/kitchen", label: "Mutfak", icon: UtensilsCrossed, permission: "kitchen" },
    { path: "/products", label: "Ürünler", icon: TagIcon, permission: "products" },
    { path: "/expenses", label: "Gider", icon: TrendingDown, permission: "expenses" },
    { path: "/stock", label: "Stok", icon: Package, permission: "stock" },
    { path: "/reports", label: "Rapor", icon: FileText, permission: "reports" },
    { path: "/users", label: "Kullanıcılar", icon: UsersIcon, permission: "users" },
  ];

  const navItems = user
    ? allNavItems.filter(item => user.permissions.includes(item.permission))
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Router />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Pideci Yönetim Paneli</h1>
              {user && (
                <p className="text-sm text-muted-foreground mt-1">
                  Hoş geldiniz, <span className="font-medium">{user.username}</span> ({user.roleName})
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {user?.roleName !== "Mutfak" && <SessionSelector />}
              {user?.roleName !== "Mutfak" && <StockAlertNotifications />}
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Çıkış
              </Button>
            </div>
          </div>
          <nav className="flex gap-2 flex-wrap">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover-elevate active-elevate-2"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Router />
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
