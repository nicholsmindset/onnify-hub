import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/clerk-react";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Deliverables from "./pages/Deliverables";
import Invoices from "./pages/Invoices";
import Tasks from "./pages/Tasks";
import ContentPipeline from "./pages/ContentPipeline";
import ContentRequests from "./pages/ContentRequests";
import ClientOnboarding from "./pages/ClientOnboarding";
import ClientReportsPage from "./pages/ClientReports";
import SlaSettings from "./pages/SlaSettings";
import RetainerSettings from "./pages/RetainerSettings";
import GhlSync from "./pages/GhlSync";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import PortalAdmin from "./pages/PortalAdmin";
import Portal from "./pages/Portal";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables");
}

const App = () => (
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/login/*" element={<Login />} />
                <Route path="/register/*" element={<Register />} />
                <Route path="/portal" element={<Portal />} />

                {/* Protected app routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/clients/:id" element={<ClientDetail />} />
                    <Route path="/deliverables" element={<Deliverables />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/content" element={<ContentPipeline />} />
                    <Route path="/content-requests" element={<ContentRequests />} />
                    <Route path="/clients/:id/onboarding" element={<ClientOnboarding />} />
                    <Route path="/client-reports" element={<ClientReportsPage />} />
                    <Route path="/settings/sla" element={<SlaSettings />} />
                    <Route path="/settings/retainer" element={<RetainerSettings />} />
                    <Route path="/ghl-sync" element={<GhlSync />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/portal-admin" element={<PortalAdmin />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
