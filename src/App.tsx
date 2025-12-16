import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { PermissionsProvider, usePermissionsContext, PERMISSIONS } from "@/contexts/PermissionsContext";
import { SidebarProvider } from "@/contexts/SidebarContext";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CalculatorPage from "./pages/Calculator";
import HistoryPage from "./pages/History";
import AnalyticsPage from "./pages/Analytics";
import DailyRatesPage from "./pages/settings/DailyRates";
import ClientTypesPage from "./pages/settings/ClientTypes";
import MarginsPage from "./pages/settings/Margins";
import ProjectTypesPage from "./pages/settings/ProjectTypes";
import UsersPage from "./pages/settings/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component with permission-based access
function ProtectedRoute({ 
  children, 
  requiredPermission 
}: { 
  children: React.ReactNode; 
  requiredPermission?: string;
}) {
  const { isAuthenticated } = useAuth();
  const { hasPermission, isLoading } = usePermissionsContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
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
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />

      {/* Permission-Based Routes */}
      <Route
        path="/settings/rates"
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.EDIT_DAILY_RATES}>
            <DailyRatesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/clients"
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.EDIT_CLIENT_TYPES}>
            <ClientTypesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/margins"
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.EDIT_MARGINS}>
            <MarginsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/projects"
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.EDIT_PROJECT_TYPES}>
            <ProjectTypesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/users"
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_USERS}>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_USAGE_HISTORY}>
            <AdminDashboard />
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
        <PermissionsProvider>
          <DataProvider>
            <SidebarProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </SidebarProvider>
          </DataProvider>
        </PermissionsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
