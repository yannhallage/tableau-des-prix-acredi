import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CalculatorPage from "./pages/Calculator";
import HistoryPage from "./pages/History";
import DailyRatesPage from "./pages/settings/DailyRates";
import ClientTypesPage from "./pages/settings/ClientTypes";
import MarginsPage from "./pages/settings/Margins";
import ProjectTypesPage from "./pages/settings/ProjectTypes";
import UsersPage from "./pages/settings/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !hasPermission(['admin'])) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Auth Redirect (for login page when already authenticated)
function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <AuthRedirect>
            <Login />
          </AuthRedirect>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calculator"
        element={
          <ProtectedRoute>
            <CalculatorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Only Routes */}
      <Route
        path="/settings/rates"
        element={
          <ProtectedRoute adminOnly>
            <DailyRatesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/clients"
        element={
          <ProtectedRoute adminOnly>
            <ClientTypesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/margins"
        element={
          <ProtectedRoute adminOnly>
            <MarginsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/projects"
        element={
          <ProtectedRoute adminOnly>
            <ProjectTypesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/users"
        element={
          <ProtectedRoute adminOnly>
            <UsersPage />
          </ProtectedRoute>
        }
      />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
