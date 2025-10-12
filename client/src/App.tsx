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
import ThemeToggle from "@/components/ThemeToggle";
import SessionSelector from "@/components/SessionSelector";
import StockAlertNotifications from "@/components/StockAlertNotifications";
import { LayoutDashboard, ShoppingCart, TrendingDown, Package, FileText, TagIcon, Utensils, UtensilsCrossed } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/sales" component={NewSales} />
      <Route path="/orders" component={Orders} />
      <Route path="/kitchen" component={KitchenDisplay} />
      <Route path="/products" component={Products} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/stock" component={Stock} />
      <Route path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/sales", label: "Satış", icon: ShoppingCart },
    { path: "/orders", label: "Siparişler", icon: Utensils },
    { path: "/kitchen", label: "Mutfak", icon: UtensilsCrossed },
    { path: "/products", label: "Ürünler", icon: TagIcon },
    { path: "/expenses", label: "Gider", icon: TrendingDown },
    { path: "/stock", label: "Stok", icon: Package },
    { path: "/reports", label: "Rapor", icon: FileText },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 z-50 border-b bg-card">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                <h1 className="text-2xl font-bold">Pideci Yönetim Paneli</h1>
                <div className="flex items-center gap-4 flex-wrap">
                  <SessionSelector />
                  <StockAlertNotifications />
                  <ThemeToggle />
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
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
