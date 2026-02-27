import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { lazy, Suspense } from "react";

const Dashboard      = lazy(() => import("./pages/Dashboard"));
const Clients        = lazy(() => import("./pages/Clients"));
const ClientDetail   = lazy(() => import("./pages/ClientDetail"));
const Deliverables   = lazy(() => import("./pages/Deliverables"));
const Invoices       = lazy(() => import("./pages/Invoices"));
const Tasks          = lazy(() => import("./pages/Tasks"));
const ContentPipeline = lazy(() => import("./pages/ContentPipeline"));
const GhlSync        = lazy(() => import("./pages/GhlSync"));
const Notifications  = lazy(() => import("./pages/Notifications"));
const Reports        = lazy(() => import("./pages/Reports"));
const Team           = lazy(() => import("./pages/Team"));
const PortalAdmin    = lazy(() => import("./pages/PortalAdmin"));
const Portal         = lazy(() => import("./pages/Portal"));
const Settings       = lazy(() => import("./pages/Settings"));
const Login          = lazy(() => import("./pages/Login"));
const Register       = lazy(() => import("./pages/Register"));
const NotFound       = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,        // data stays fresh for 1 min — no refetch on every tab switch
      gcTime: 5 * 60_000,       // keep unused cache for 5 min
      refetchOnWindowFocus: false, // don't refetch when user alt-tabs back
      retry: 1,                 // only 1 retry on error instead of 3
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={null}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
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
                    <Route path="/ghl-sync" element={<GhlSync />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/portal-admin" element={<PortalAdmin />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
