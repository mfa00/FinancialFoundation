import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Eye, Edit, Send } from "lucide-react";
import { useCurrentCompany } from "@/hooks/use-current-company";

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { currentCompany } = useCurrentCompany();

  const { data: invoices, isLoading } = useQuery({
    queryKey: [`/api/companies/${currentCompany?.id}/invoices`],
    enabled: !!currentCompany?.id,
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "bg-ibm-gray-20 text-ibm-gray-70",
      sent: "bg-ibm-blue/10 text-ibm-blue",
      paid: "bg-success/10 text-success",
      overdue: "bg-error/10 text-error",
      cancelled: "bg-ibm-gray-20 text-ibm-gray-70",
    };

    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-700";
  };

  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!currentCompany) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-ibm-gray-100 mb-2">
            No Company Selected
          </h2>
          <p className="text-ibm-gray-60">
            Please select a company to view its invoices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-ibm-gray-20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ibm-gray-100">Invoices</h1>
            <p className="text-ibm-gray-60">Create and manage customer invoices</p>
          </div>
          
          <Button className="bg-ibm-blue hover:bg-ibm-blue/90">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <Card className="border-ibm-gray-20">
          <CardHeader className="border-b border-ibm-gray-20">
            <div className="flex items-center justify-between">
              <CardTitle>Invoices</CardTitle>
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ibm-gray-60" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between py-4">
                    <div className="space-y-2">
                      <div className="w-48 h-4 bg-ibm-gray-10 rounded"></div>
                      <div className="w-32 h-3 bg-ibm-gray-10 rounded"></div>
                    </div>
                    <div className="w-24 h-4 bg-ibm-gray-10 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredInvoices && filteredInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ibm-gray-20">
                      <th className="text-left py-3 px-4 font-semibold text-ibm-gray-100">Invoice #</th>
                      <th className="text-left py-3 px-4 font-semibold text-ibm-gray-100">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-ibm-gray-100">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-ibm-gray-100">Due Date</th>
                      <th className="text-right py-3 px-4 font-semibold text-ibm-gray-100">Amount</th>
                      <th className="text-center py-3 px-4 font-semibold text-ibm-gray-100">Status</th>
                      <th className="text-center py-3 px-4 font-semibold text-ibm-gray-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ibm-gray-20">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-ibm-gray-10 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-ibm-gray-100">
                            {invoice.invoiceNumber}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-ibm-gray-100">Customer Name</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-ibm-gray-100">{formatDate(invoice.date)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-ibm-gray-100">{formatDate(invoice.dueDate)}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-ibm-gray-100">
                          {formatCurrency(invoice.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="secondary" className={getStatusBadge(invoice.status)}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {invoice.status === "draft" && (
                              <Button variant="ghost" size="sm">
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-ibm-gray-60 mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "No invoices match your search criteria" 
                    : "No invoices found"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button>
                    Create Your First Invoice
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
