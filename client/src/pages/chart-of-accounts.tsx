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
import { Plus, Search, Filter } from "lucide-react";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAccountSchema } from "@shared/schema";
import { z } from "zod";

const accountFormSchema = insertAccountSchema.extend({
  code: z.string().min(1, "Account code is required"),
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
});

type AccountFormData = z.infer<typeof accountFormSchema>;

export default function ChartOfAccounts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const { currentCompany } = useCurrentCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: [`/api/companies/${currentCompany?.id}/accounts`],
    enabled: !!currentCompany?.id,
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: AccountFormData) => {
      const response = await apiRequest("POST", `/api/companies/${currentCompany?.id}/accounts`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${currentCompany?.id}/accounts`] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Account created",
        description: "The account has been added to your chart of accounts.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating account",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "asset",
      description: "",
      companyId: currentCompany?.id,
    },
  });

  const onSubmit = (data: AccountFormData) => {
    createAccountMutation.mutate({ ...data, companyId: currentCompany!.id });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const getAccountTypeBadge = (type: string) => {
    const variants = {
      asset: "bg-ibm-blue/10 text-ibm-blue",
      liability: "bg-error/10 text-error",
      equity: "bg-purple-100 text-purple-700",
      revenue: "bg-success/10 text-success",
      expense: "bg-warning/10 text-warning",
    };

    return variants[type as keyof typeof variants] || "bg-gray-100 text-gray-700";
  };

  const filteredAccounts = accounts?.filter((account) => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || account.type === filterType;
    return matchesSearch && matchesType;
  });

  if (!currentCompany) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-ibm-gray-100 mb-2">
            No Company Selected
          </h2>
          <p className="text-ibm-gray-60">
            Please select a company to view its chart of accounts.
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
            <h1 className="text-2xl font-semibold text-ibm-gray-100">Chart of Accounts</h1>
            <p className="text-ibm-gray-60">Manage your company's account structure</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-ibm-blue hover:bg-ibm-blue/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Cash in Bank" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="asset">Asset</SelectItem>
                            <SelectItem value="liability">Liability</SelectItem>
                            <SelectItem value="equity">Equity</SelectItem>
                            <SelectItem value="revenue">Revenue</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
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
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Account description..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createAccountMutation.isPending}>
                      {createAccountMutation.isPending ? "Creating..." : "Create Account"}
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
              <CardTitle>Accounts</CardTitle>
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ibm-gray-60" />
                  <Input
                    placeholder="Search accounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                {/* Filter */}
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="asset">Assets</SelectItem>
                    <SelectItem value="liability">Liabilities</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expenses</SelectItem>
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
                    <div className="space-y-2">
                      <div className="w-48 h-4 bg-ibm-gray-10 rounded"></div>
                      <div className="w-32 h-3 bg-ibm-gray-10 rounded"></div>
                    </div>
                    <div className="w-24 h-4 bg-ibm-gray-10 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredAccounts && filteredAccounts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ibm-gray-20">
                      <th className="text-left py-3 px-4 font-semibold text-ibm-gray-100">Account</th>
                      <th className="text-left py-3 px-4 font-semibold text-ibm-gray-100">Type</th>
                      <th className="text-right py-3 px-4 font-semibold text-ibm-gray-100">Balance</th>
                      <th className="text-center py-3 px-4 font-semibold text-ibm-gray-100">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ibm-gray-20">
                    {filteredAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-ibm-gray-10 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-ibm-gray-100">
                              {account.code} - {account.name}
                            </div>
                            {account.description && (
                              <div className="text-sm text-ibm-gray-60">{account.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className={getAccountTypeBadge(account.type)}>
                            {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-ibm-gray-100">
                          {formatCurrency(account.balance)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={account.isActive ? "secondary" : "outline"} className={
                            account.isActive ? "bg-success/10 text-success" : "bg-gray-100 text-gray-500"
                          }>
                            {account.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-ibm-gray-60 mb-4">
                  {searchTerm || filterType !== "all" 
                    ? "No accounts match your search criteria" 
                    : "No accounts found"}
                </p>
                {!searchTerm && filterType === "all" && (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    Create Your First Account
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
