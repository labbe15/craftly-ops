import { useEffect, useState, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";

// Lazy loading des pages
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const ClientForm = lazy(() => import("./pages/ClientForm"));
const ClientDetail = lazy(() => import("./pages/ClientDetail"));
const Items = lazy(() => import("./pages/Items"));
const ItemForm = lazy(() => import("./pages/ItemForm"));
const Quotes = lazy(() => import("./pages/Quotes"));
const QuoteForm = lazy(() => import("./pages/QuoteForm"));
const QuoteDetail = lazy(() => import("./pages/QuoteDetail"));
const Invoices = lazy(() => import("./pages/Invoices"));
const InvoiceForm = lazy(() => import("./pages/InvoiceForm"));
const InvoiceDetail = lazy(() => import("./pages/InvoiceDetail"));
const Agenda = lazy(() => import("./pages/Agenda"));
const EventForm = lazy(() => import("./pages/EventForm"));
const Reminders = lazy(() => import("./pages/Reminders"));
const ReminderSchedules = lazy(() => import("./pages/ReminderSchedules"));
const Settings = lazy(() => import("./pages/Settings"));
const Exports = lazy(() => import("./pages/Exports"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Composant de chargement simple
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />
              
              {session ? (
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/clients/new" element={<ClientForm />} />
                  <Route path="/clients/:id" element={<ClientDetail />} />
                  <Route path="/clients/:id/edit" element={<ClientForm />} />
                  <Route path="/items" element={<Items />} />
                  <Route path="/items/new" element={<ItemForm />} />
                  <Route path="/items/:id" element={<ItemForm />} />
                  <Route path="/quotes" element={<Quotes />} />
                  <Route path="/quotes/new" element={<QuoteForm />} />
                  <Route path="/quotes/:id" element={<QuoteDetail />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/invoices/new" element={<InvoiceForm />} />
                  <Route path="/invoices/:id" element={<InvoiceDetail />} />
                  <Route path="/agenda" element={<Agenda />} />
                  <Route path="/agenda/new" element={<EventForm />} />
                  <Route path="/agenda/:id" element={<EventForm />} />
                  <Route path="/reminders" element={<Reminders />} />
                  <Route path="/reminders/schedules" element={<ReminderSchedules />} />
                  <Route path="/exports" element={<Exports />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              ) : (
                <Route path="*" element={<Navigate to="/auth" />} />
              )}

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
