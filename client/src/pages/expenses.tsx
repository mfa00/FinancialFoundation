import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, Receipt } from "lucide-react";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertExpenseSchema } from "@shared/schema";
import { z } from "zod";

const expenseFormSchema = insertExpenseSchema.extend({
  date: z.string().min(1, "Date is required"),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Invalid amount"),
  accountId: z.number({ required_error: "Account is required" }),
  description: z.string().min(1, "Description is required"),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

export default function Expenses() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { currentCompany } = useCurrentCompany();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: [`/api/companies/${currentCompany?.id}/expenses`],
    enabled: !!currentCompany?.id,
  });

  const { data: accounts } = useQuery({
    queryKey: [`/api/companies/${currentCompany?.id}/accounts`],
    enabled: !!currentCompany?.id,
  });

  const { data: vendors } = useQuery({
    queryKey: [`/api/companies/${currentCompany?.id}/vendors`],
    enabled: !!currentCompany?.id,
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/companies/${currentCompany?.id}/expenses`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${currentCompany?.id}/expenses`] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${currentCompany?.id}/accounts`] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Expense recorded",
        description: "The expense has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error recording expense",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: "",
      accountId: 0,
      description: "",
      reference: "",
      vendorId: undefined,
      status: "recorded",
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    const expenseData = {
      ...data,
      date: new Date(data.date).toISOString(),
      amount: parseFloat(data.amount).toFixed(2),
      createdBy: user!.id,
    };

    createExpenseMutation.mutate(expenseData);
  };

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

  const getAccountName = (accountId: number) => {
    const account = accounts?.find(acc => acc.id === accountId);
    return account ? `${account.code} - ${account.name}` : "Unknown Account";
  };

  const getVendorName = (vendorId: number | null) => {
    if (!vendorId) return "N/A";
    const vendor = vendors?.find(v => v.id === vendorId);
    return vendor ? vendor.name : "Unknown Vendor";
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      recorded: "bg-ibm-blue/10 text-ibm-blue",
      paid: "bg-success/10 text-success",
    };

    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-700";
  };

  // Filter expense accounts only
  const expenseAccounts = accounts?.filter(account => account.type === "expense");

  const filteredExpenses = expenses?.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || expense.status === statusFilter;
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
            Please select a company to view its expenses.
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
            <h1 className="text-2xl font-semibold text-ibm-gray-100">Expense Tracking</h1>
            <p className="text-ibm-gray-60">Record and manage business expenses</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-ibm-blue hover:bg-ibm-blue/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record New Expense</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="0.01"
                              placeholder="0.00" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expense Account</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select expense account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {expenseAccounts?.map((account) => (
                              <SelectItem key={account.id} value={account.id.toString()}>
                                {account.code} - {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vendorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor (Optional)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vendor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No vendor</SelectItem>
                            {vendors?.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                {vendor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Expense description..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Receipt number, invoice #, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createExpenseMutation.isPending}>
                      {createExpenseMutation.isPending ? "Recording..." : "Record Expense"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <Card className="border-ibm-gray-20">
          <CardHeader className="border-b border-ibm-gray-20">
            <div className="flex items-center justify-between">
              <CardTitle>Expenses</CardTitle>
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ibm-gray-60" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                {/* Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="recorded">Recorded</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between py-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-ibm-gray-10 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="w-48 h-4 bg-ibm-gray-10 rounded"></div>
                        <div className="w-32 h-3 bg-ibm-gray-10 rounded"></div>
                      </div>
                    </div>
                    <div className="w-24 h-4 bg-ibm-gray-10 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredExpenses && filteredExpenses.length > 0 ? (
              <div className="space-y-4">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between py-4 border-b border-ibm-gray-20 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-error/10 rounded-full flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-error" />
                      </div>
                      <div>
                        <div className="font-medium text-ibm-gray-100">{expense.description}</div>
                        <div className="text-sm text-ibm-gray-60 space-x-4">
                          <span>{getAccountName(expense.accountId)}</span>
                          <span>•</span>
                          <span>{getVendorName(expense.vendorId)}</span>
                          {expense.reference && (
                            <>
                              <span>•</span>
                              <span>Ref: {expense.reference}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold text-error">
                        -{formatCurrency(expense.amount)}
                      </div>
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-sm text-ibm-gray-60">{formatDate(expense.date)}</span>
                        <Badge variant="secondary" className={getStatusBadge(expense.status)}>
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-ibm-gray-60 mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "No expenses match your search criteria" 
                    : "No expenses found"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    Record Your First Expense
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
