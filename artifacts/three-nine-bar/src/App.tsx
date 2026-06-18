import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { MainLayout } from "@/components/layout/main-layout";

// Pages
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import IngredientsPage from "@/pages/ingredients";
import ProductsPage from "@/pages/products";
import RecipesPage from "@/pages/recipes";
import SalesPage from "@/pages/sales";
import WastingPage from "@/pages/wasting";
import StockOpnamePage from "@/pages/stock-opname";
import ReportsPage from "@/pages/reports";
import UsersPage from "@/pages/users";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && user && adminOnly && user.role !== 'admin') {
      setLocation("/");
    }
  }, [user, isLoading, adminOnly, setLocation]);

  if (isLoading || !user) {
    return <div className="min-h-screen w-full flex items-center justify-center text-primary bg-background">Loading...</div>;
  }

  return (
    <MainLayout>
      <Component />
    </MainLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/ingredients" component={() => <ProtectedRoute component={IngredientsPage} adminOnly />} />
      <Route path="/products" component={() => <ProtectedRoute component={ProductsPage} adminOnly />} />
      <Route path="/recipes" component={() => <ProtectedRoute component={RecipesPage} adminOnly />} />
      <Route path="/sales" component={() => <ProtectedRoute component={SalesPage} />} />
      <Route path="/wasting" component={() => <ProtectedRoute component={WastingPage} />} />
      <Route path="/stock-opname" component={() => <ProtectedRoute component={StockOpnamePage} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={ReportsPage} adminOnly />} />
      <Route path="/users" component={() => <ProtectedRoute component={UsersPage} adminOnly />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Always dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
