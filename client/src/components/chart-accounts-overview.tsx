import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { Link } from "react-router-dom";

export function ChartAccountsOverview() {
  const { currentCompany } = useCurrentCompany();

  const { data: accounts, isLoading } = useQuery({
    queryKey: [`/api/companies/${currentCompany?.id}/accounts`],
    enabled: !!currentCompany?.id,
  });

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

  if (isLoading) {
    return (
      <Card className="border-ibm-gray-20">
        <CardHeader className="border-b border-ibm-gray-20">
          <h3 className="text-lg font-semibold text-ibm-gray-100">Chart of Accounts Overview</h3>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="space-y-2">
                  <div className="w-48 h-4 bg-ibm-gray-10 rounded"></div>
                  <div className="w-32 h-3 bg-ibm-gray-10 rounded"></div>
                </div>
                <div className="w-24 h-4 bg-ibm-gray-10 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <Card className="border-ibm-gray-20">
        <CardHeader className="border-b border-ibm-gray-20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ibm-gray-100">Chart of Accounts Overview</h3>
            <div className="flex items-center space-x-4">
              <Link to="/chart-of-accounts">
                <Button variant="ghost" size="sm" className="text-ibm-blue hover:text-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Account
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-ibm-gray-60 mb-4">No accounts found</p>
            <Link to="/chart-of-accounts">
              <Button>Set Up Chart of Accounts</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show only first 5 accounts
  const displayAccounts = accounts.slice(0, 5);

  return (
    <Card className="border-ibm-gray-20">
      <CardHeader className="border-b border-ibm-gray-20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ibm-gray-100">Chart of Accounts Overview</h3>
          <div className="flex items-center space-x-4">
            <Link to="/chart-of-accounts">
              <Button variant="ghost" size="sm" className="text-ibm-blue hover:text-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </Link>
            <Link to="/chart-of-accounts">
              <Button variant="ghost" size="sm" className="text-ibm-blue hover:text-blue-700">
                View All
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
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
              {displayAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-ibm-gray-10 transition-colors">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-ibm-gray-100">
                        {account.code} - {account.name}
                      </div>
                      <div className="text-sm text-ibm-gray-60">{account.description}</div>
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
      </CardContent>
    </Card>
  );
}
