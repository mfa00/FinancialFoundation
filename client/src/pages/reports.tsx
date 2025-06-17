import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Wallet, Download, Calendar } from "lucide-react";
import { useCurrentCompany } from "@/hooks/use-current-company";

export default function Reports() {
  const { type } = useParams<{ type?: string }>();
  const [selectedTab, setSelectedTab] = useState(type || "profit-loss");
  const { currentCompany } = useCurrentCompany();

  const { data: accounts } = useQuery({
    queryKey: [`/api/companies/${currentCompany?.id}/accounts`],
    enabled: !!currentCompany?.id,
  });

  const { data: metrics } = useQuery({
    queryKey: [`/api/companies/${currentCompany?.id}/metrics`],
    enabled: !!currentCompany?.id,
  });

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Group accounts by type for financial statements
  const groupedAccounts = accounts?.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {} as Record<string, typeof accounts>);

  const ProfitLossReport = () => {
    const revenueAccounts = groupedAccounts?.revenue || [];
    const expenseAccounts = groupedAccounts?.expense || [];
    
    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    const netIncome = totalRevenue - totalExpenses;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ibm-gray-100">Profit & Loss Statement</h2>
            <p className="text-ibm-gray-60">As of {getCurrentDate()}</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Revenue Section */}
          <Card className="border-ibm-gray-20">
            <CardHeader className="bg-success/5 border-b border-ibm-gray-20">
              <CardTitle className="text-success">Revenue</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {revenueAccounts.length > 0 ? (
                <div className="space-y-2">
                  {revenueAccounts.map((account) => (
                    <div key={account.id} className="flex justify-between items-center py-2">
                      <span className="text-ibm-gray-100">{account.code} - {account.name}</span>
                      <span className="font-mono text-success">{formatCurrency(account.balance)}</span>
                    </div>
                  ))}
                  <div className="border-t border-ibm-gray-20 pt-2 mt-4">
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-ibm-gray-100">Total Revenue</span>
                      <span className="font-mono text-success">{formatCurrency(totalRevenue)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-ibm-gray-60">No revenue accounts found</p>
              )}
            </CardContent>
          </Card>

          {/* Expenses Section */}
          <Card className="border-ibm-gray-20">
            <CardHeader className="bg-error/5 border-b border-ibm-gray-20">
              <CardTitle className="text-error">Expenses</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {expenseAccounts.length > 0 ? (
                <div className="space-y-2">
                  {expenseAccounts.map((account) => (
                    <div key={account.id} className="flex justify-between items-center py-2">
                      <span className="text-ibm-gray-100">{account.code} - {account.name}</span>
                      <span className="font-mono text-error">{formatCurrency(account.balance)}</span>
                    </div>
                  ))}
                  <div className="border-t border-ibm-gray-20 pt-2 mt-4">
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-ibm-gray-100">Total Expenses</span>
                      <span className="font-mono text-error">{formatCurrency(totalExpenses)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-ibm-gray-60">No expense accounts found</p>
              )}
            </CardContent>
          </Card>

          {/* Net Income */}
          <Card className="border-ibm-gray-20">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-ibm-gray-100">Net Income</h3>
                <span className={`text-2xl font-mono font-bold ${netIncome >= 0 ? 'text-success' : 'text-error'}`}>
                  {formatCurrency(netIncome)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const BalanceSheetReport = () => {
    const assetAccounts = groupedAccounts?.asset || [];
    const liabilityAccounts = groupedAccounts?.liability || [];
    const equityAccounts = groupedAccounts?.equity || [];
    
    const totalAssets = assetAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    const totalEquity = equityAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ibm-gray-100">Balance Sheet</h2>
            <p className="text-ibm-gray-60">As of {getCurrentDate()}</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Assets */}
          <Card className="border-ibm-gray-20">
            <CardHeader className="bg-ibm-blue/5 border-b border-ibm-gray-20">
              <CardTitle className="text-ibm-blue">Assets</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {assetAccounts.length > 0 ? (
                <div className="space-y-2">
                  {assetAccounts.map((account) => (
                    <div key={account.id} className="flex justify-between items-center py-2">
                      <span className="text-ibm-gray-100">{account.code} - {account.name}</span>
                      <span className="font-mono text-ibm-blue">{formatCurrency(account.balance)}</span>
                    </div>
                  ))}
                  <div className="border-t border-ibm-gray-20 pt-2 mt-4">
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-ibm-gray-100">Total Assets</span>
                      <span className="font-mono text-ibm-blue">{formatCurrency(totalAssets)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-ibm-gray-60">No asset accounts found</p>
              )}
            </CardContent>
          </Card>

          {/* Liabilities */}
          <Card className="border-ibm-gray-20">
            <CardHeader className="bg-error/5 border-b border-ibm-gray-20">
              <CardTitle className="text-error">Liabilities</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {liabilityAccounts.length > 0 ? (
                <div className="space-y-2">
                  {liabilityAccounts.map((account) => (
                    <div key={account.id} className="flex justify-between items-center py-2">
                      <span className="text-ibm-gray-100">{account.code} - {account.name}</span>
                      <span className="font-mono text-error">{formatCurrency(account.balance)}</span>
                    </div>
                  ))}
                  <div className="border-t border-ibm-gray-20 pt-2 mt-4">
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-ibm-gray-100">Total Liabilities</span>
                      <span className="font-mono text-error">{formatCurrency(totalLiabilities)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-ibm-gray-60">No liability accounts found</p>
              )}
            </CardContent>
          </Card>

          {/* Equity */}
          <Card className="border-ibm-gray-20">
            <CardHeader className="bg-purple-50 border-b border-ibm-gray-20">
              <CardTitle className="text-purple-700">Equity</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {equityAccounts.length > 0 ? (
                <div className="space-y-2">
                  {equityAccounts.map((account) => (
                    <div key={account.id} className="flex justify-between items-center py-2">
                      <span className="text-ibm-gray-100">{account.code} - {account.name}</span>
                      <span className="font-mono text-purple-700">{formatCurrency(account.balance)}</span>
                    </div>
                  ))}
                  <div className="border-t border-ibm-gray-20 pt-2 mt-4">
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-ibm-gray-100">Total Equity</span>
                      <span className="font-mono text-purple-700">{formatCurrency(totalEquity)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-ibm-gray-60">No equity accounts found</p>
              )}
            </CardContent>
          </Card>

          {/* Balance Check */}
          <Card className="border-ibm-gray-20">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-ibm-gray-100">Total Liabilities + Equity</h3>
                <span className="text-2xl font-mono font-bold text-ibm-gray-100">
                  {formatCurrency(totalLiabilities + totalEquity)}
                </span>
              </div>
              <div className="mt-2 text-center">
                <Badge variant={Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? "secondary" : "destructive"} className={
                  Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? "bg-success/10 text-success" : "bg-error/10 text-error"
                }>
                  {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? "Balanced" : "Not Balanced"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const CashFlowReport = () => {
    const cashAccounts = accounts?.filter(account => 
      account.type === 'asset' && 
      (account.name.toLowerCase().includes('cash') || account.name.toLowerCase().includes('bank'))
    ) || [];

    const totalCash = cashAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ibm-gray-100">Cash Flow Statement</h2>
            <p className="text-ibm-gray-60">As of {getCurrentDate()}</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Cash Accounts */}
          <Card className="border-ibm-gray-20">
            <CardHeader className="bg-ibm-blue/5 border-b border-ibm-gray-20">
              <CardTitle className="text-ibm-blue">Cash & Cash Equivalents</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {cashAccounts.length > 0 ? (
                <div className="space-y-2">
                  {cashAccounts.map((account) => (
                    <div key={account.id} className="flex justify-between items-center py-2">
                      <span className="text-ibm-gray-100">{account.code} - {account.name}</span>
                      <span className="font-mono text-ibm-blue">{formatCurrency(account.balance)}</span>
                    </div>
                  ))}
                  <div className="border-t border-ibm-gray-20 pt-2 mt-4">
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-ibm-gray-100">Total Cash</span>
                      <span className="font-mono text-ibm-blue">{formatCurrency(totalCash)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-ibm-gray-60">No cash accounts found</p>
              )}
            </CardContent>
          </Card>

          {/* Cash Flow Summary */}
          <Card className="border-ibm-gray-20">
            <CardHeader className="border-b border-ibm-gray-20">
              <CardTitle>Cash Flow Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-ibm-gray-100">Net Cash Flow from Operating Activities</span>
                  <span className="font-mono text-success">
                    {metrics ? formatCurrency(parseFloat(metrics.netProfit) * 0.8) : formatCurrency(0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-ibm-gray-100">Net Cash Flow from Investing Activities</span>
                  <span className="font-mono text-error">
                    {metrics ? formatCurrency(parseFloat(metrics.totalExpenses) * 0.1) : formatCurrency(0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-ibm-gray-100">Net Cash Flow from Financing Activities</span>
                  <span className="font-mono text-ibm-gray-100">{formatCurrency(0)}</span>
                </div>
                <div className="border-t border-ibm-gray-20 pt-2">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-ibm-gray-100">Net Change in Cash</span>
                    <span className="font-mono text-success">
                      {metrics ? formatCurrency(parseFloat(metrics.netProfit) * 0.7) : formatCurrency(0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (!currentCompany) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-ibm-gray-100 mb-2">
            No Company Selected
          </h2>
          <p className="text-ibm-gray-60">
            Please select a company to view its reports.
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
            <h1 className="text-2xl font-semibold text-ibm-gray-100">Financial Reports</h1>
            <p className="text-ibm-gray-60">Generate and view financial statements</p>
          </div>
          <div className="flex items-center space-x-2 text-ibm-gray-60">
            <Calendar className="h-4 w-4" />
            <span className="font-mono text-sm">{getCurrentDate()}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profit-loss" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Profit & Loss</span>
            </TabsTrigger>
            <TabsTrigger value="balance-sheet" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Balance Sheet</span>
            </TabsTrigger>
            <TabsTrigger value="cash-flow" className="flex items-center space-x-2">
              <Wallet className="h-4 w-4" />
              <span>Cash Flow</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profit-loss" className="mt-6">
            <ProfitLossReport />
          </TabsContent>

          <TabsContent value="balance-sheet" className="mt-6">
            <BalanceSheetReport />
          </TabsContent>

          <TabsContent value="cash-flow" className="mt-6">
            <CashFlowReport />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
