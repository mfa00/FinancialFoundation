import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./lib/auth";
import { ProtectedRoute } from "./components/protected-route";
import { Sidebar } from "./components/sidebar";
import { AddCompanyDialog } from "./components/add-company-dialog";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Dashboard from "@/pages/dashboard";
import ChartOfAccounts from "@/pages/chart-of-accounts";
import JournalEntries from "@/pages/journal-entries";
import Invoices from "@/pages/invoices";
import Expenses from "@/pages/expenses";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

function AppLayout() {
  const [isAddCompanyDialogOpen, setIsAddCompanyDialogOpen] = useState(false);

  return (
    <div className="flex h-screen bg-ibm-gray-10">
      <Sidebar onAddCompany={() => setIsAddCompanyDialogOpen(true)} />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
        <Route path="/journal-entries" element={<JournalEntries />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reports/:type?" element={<Reports />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AddCompanyDialog 
        open={isAddCompanyDialogOpen} 
        onOpenChange={setIsAddCompanyDialogOpen} 
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router>
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          </Router>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
