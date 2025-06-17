import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Search, Filter } from "lucide-react";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertJournalEntrySchema, insertJournalEntryLineSchema } from "@shared/schema";
import { z } from "zod";

const journalEntryFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  reference: z.string().optional(),
  lines: z.array(z.object({
    accountId: z.number({ required_error: "Account is required" }),
    description: z.string().optional(),
    debitAmount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Invalid debit amount"),
    creditAmount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Invalid credit amount"),
  })).min(2, "At least 2 lines are required"),
});

type JournalEntryFormData = z.infer<typeof journalEntryFormSchema>;

export default function JournalEntries() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { currentCompany } = useCurrentCompany();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: journalEntries, isLoading } = useQuery({
    queryKey: [`/api/companies/${currentCompany?.id}/journal-entries`],
    enabled: !!currentCompany?.id,
  });

  const { data: accounts } = useQuery({
    queryKey: [`/api/companies/${currentCompany?.id}/accounts`],
    enabled: !!currentCompany?.id,
  });

  const createJournalEntryMutation = useMutation({
    mutationFn: async (data: { entry: any; lines: any[] }) => {
      const response = await apiRequest("POST", `/api/companies/${currentCompany?.id}/journal-entries`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${currentCompany?.id}/journal-entries`] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${currentCompany?.id}/accounts`] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Journal entry created",
        description: "The journal entry has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating journal entry",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<JournalEntryFormData>({
    resolver: zodResolver(journalEntryFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: "",
      reference: "",
      lines: [
        { accountId: 0, description: "", debitAmount: "0.00", creditAmount: "0.00" },
        { accountId: 0, description: "", debitAmount: "0.00", creditAmount: "0.00" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const onSubmit = (data: JournalEntryFormData) => {
    const totalDebits = data.lines.reduce((sum, line) => sum + parseFloat(line.debitAmount), 0);
    const totalCredits = data.lines.reduce((sum, line) => sum + parseFloat(line.creditAmount), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      toast({
        title: "Entry not balanced",
        description: "Total debits must equal total credits.",
        variant: "destructive",
      });
      return;
    }

    // Filter out lines with zero amounts
    const validLines = data.lines.filter(line => 
      parseFloat(line.debitAmount) > 0 || parseFloat(line.creditAmount) > 0
    );

    if (validLines.length < 2) {
      toast({
        title: "Invalid entry",
        description: "At least 2 lines with amounts are required.",
        variant: "destructive",
      });
      return;
    }

    const entry = {
      date: new Date(data.date).toISOString(),
      description: data.description,
      reference: data.reference,
      totalAmount: totalDebits.toFixed(2),
      status: "posted",
    };

    const lines = validLines.map(line => ({
      accountId: line.accountId,
      description: line.description || "",
      debitAmount: parseFloat(line.debitAmount).toFixed(2),
      creditAmount: parseFloat(line.creditAmount).toFixed(2),
    }));

    createJournalEntryMutation.mutate({ entry, lines });
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

  const filteredEntries = journalEntries?.filter((entry) => {
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.entryNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
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
            Please select a company to view its journal entries.
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
            <h1 className="text-2xl font-semibold text-ibm-gray-100">Journal Entries</h1>
            <p className="text-ibm-gray-60">Record double-entry transactions</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-ibm-blue hover:bg-ibm-blue/90">
                <Plus className="mr-2 h-4 w-4" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Journal Entry</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      name="reference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Reference number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Entry description..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Journal Lines</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ accountId: 0, description: "", debitAmount: "0.00", creditAmount: "0.00" })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Line
                      </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-ibm-gray-10">
                          <tr>
                            <th className="text-left p-3 font-medium">Account</th>
                            <th className="text-left p-3 font-medium">Description</th>
                            <th className="text-right p-3 font-medium">Debit</th>
                            <th className="text-right p-3 font-medium">Credit</th>
                            <th className="text-center p-3 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fields.map((field, index) => (
                            <tr key={field.id} className="border-t">
                              <td className="p-3">
                                <FormField
                                  control={form.control}
                                  name={`lines.${index}.accountId`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                        <FormControl>
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select account" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {accounts?.map((account) => (
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
                              </td>
                              <td className="p-3">
                                <FormField
                                  control={form.control}
                                  name={`lines.${index}.description`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input placeholder="Line description" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </td>
                              <td className="p-3">
                                <FormField
                                  control={form.control}
                                  name={`lines.${index}.debitAmount`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          step="0.01" 
                                          min="0"
                                          placeholder="0.00" 
                                          className="text-right"
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </td>
                              <td className="p-3">
                                <FormField
                                  control={form.control}
                                  name={`lines.${index}.creditAmount`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          step="0.01" 
                                          min="0"
                                          placeholder="0.00" 
                                          className="text-right"
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </td>
                              <td className="p-3 text-center">
                                {fields.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => remove(index)}
                                    className="text-error hover:text-error/80"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createJournalEntryMutation.isPending}>
                      {createJournalEntryMutation.isPending ? "Creating..." : "Create Entry"}
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
              <CardTitle>Journal Entries</CardTitle>
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ibm-gray-60" />
                  <Input
                    placeholder="Search entries..."
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                    <SelectItem value="reversed">Reversed</SelectItem>
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
            ) : filteredEntries && filteredEntries.length > 0 ? (
              <div className="space-y-4">
                {filteredEntries.map((entry) => (
                  <div key={entry.id} className="border border-ibm-gray-20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium text-ibm-gray-100">{entry.description}</h3>
                          <div className="flex items-center space-x-4 text-sm text-ibm-gray-60">
                            <span>{entry.entryNumber}</span>
                            <span>{formatDate(entry.date)}</span>
                            {entry.reference && <span>Ref: {entry.reference}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-mono font-semibold text-ibm-gray-100">
                            {formatCurrency(entry.totalAmount)}
                          </div>
                          <Badge variant={entry.status === "posted" ? "secondary" : "outline"} className={
                            entry.status === "posted" ? "bg-success/10 text-success" : 
                            entry.status === "draft" ? "bg-warning/10 text-warning" : 
                            "bg-error/10 text-error"
                          }>
                            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Journal Lines */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-ibm-gray-10">
                          <tr>
                            <th className="text-left p-2 font-medium">Account</th>
                            <th className="text-left p-2 font-medium">Description</th>
                            <th className="text-right p-2 font-medium">Debit</th>
                            <th className="text-right p-2 font-medium">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.lines.map((line) => (
                            <tr key={line.id} className="border-t border-ibm-gray-20">
                              <td className="p-2">{getAccountName(line.accountId)}</td>
                              <td className="p-2">{line.description}</td>
                              <td className="p-2 text-right font-mono">
                                {parseFloat(line.debitAmount) > 0 ? formatCurrency(line.debitAmount) : ""}
                              </td>
                              <td className="p-2 text-right font-mono">
                                {parseFloat(line.creditAmount) > 0 ? formatCurrency(line.creditAmount) : ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-ibm-gray-60 mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "No journal entries match your search criteria" 
                    : "No journal entries found"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    Create Your First Journal Entry
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
