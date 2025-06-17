import { useState } from "react";
import { Switch, Route } from "wouter";
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
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/chart-of-accounts" component={ChartOfAccounts} />
        <Route path="/journal-entries" component={JournalEntries} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/reports/:type?" component={Reports} />
        <Route component={NotFound} />
      </Switch>
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
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
