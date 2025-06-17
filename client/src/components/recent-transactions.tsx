import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { Link } from "wouter";

export function RecentTransactions() {
  const { currentCompany } = useCurrentCompany();

  const { data: journalEntries, isLoading } = useQuery({
    queryKey: [`/api/companies/${currentCompany?.id}/journal-entries`, { limit: 5 }],
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
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card className="border-ibm-gray-20">
        <CardHeader className="border-b border-ibm-gray-20">
          <h3 className="text-lg font-semibold text-ibm-gray-100">Recent Transactions</h3>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-3">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-ibm-gray-10 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-ibm-gray-10 rounded"></div>
                    <div className="w-24 h-3 bg-ibm-gray-10 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-20 h-4 bg-ibm-gray-10 rounded"></div>
                  <div className="w-16 h-3 bg-ibm-gray-10 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!journalEntries || journalEntries.length === 0) {
    return (
      <Card className="border-ibm-gray-20">
        <CardHeader className="border-b border-ibm-gray-20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ibm-gray-100">Recent Transactions</h3>
            <Link href="/journal-entries">
              <Button variant="ghost" size="sm" className="text-ibm-blue hover:text-blue-700">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-ibm-gray-60">No transactions found</p>
            <Link href="/journal-entries">
              <Button className="mt-4">Create First Transaction</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-ibm-gray-20">
      <CardHeader className="border-b border-ibm-gray-20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ibm-gray-100">Recent Transactions</h3>
          <Link href="/journal-entries">
            <Button variant="ghost" size="sm" className="text-ibm-blue hover:text-blue-700">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {journalEntries.map((entry) => {
            const totalAmount = parseFloat(entry.totalAmount);
            const isPositive = totalAmount > 0;
            
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between py-3 border-b border-ibm-gray-20 last:border-b-0"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isPositive ? "bg-success/10" : "bg-error/10"
                  }`}>
                    {isPositive ? (
                      <Plus className="h-4 w-4 text-success" />
                    ) : (
                      <Minus className="h-4 w-4 text-error" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-ibm-gray-100">{entry.description}</div>
                    <div className="text-sm text-ibm-gray-60">{entry.reference || entry.entryNumber}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-mono font-semibold ${
                    isPositive ? "text-success" : "text-error"
                  }`}>
                    {isPositive ? "+" : ""}{formatCurrency(entry.totalAmount)}
                  </div>
                  <div className="text-sm text-ibm-gray-60">{formatDate(entry.date)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
