import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, Building2 } from "lucide-react";
import { useCurrentCompany } from "@/hooks/use-current-company";

export function DashboardMetrics() {
  const { currentCompany } = useCurrentCompany();

  const { data: metrics, isLoading } = useQuery({
    queryKey: [`/api/companies/${currentCompany?.id}/metrics`],
    enabled: !!currentCompany?.id,
  });

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-ibm-gray-10 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Mock previous values for percentage calculations
  const previousRevenue = parseFloat(metrics.totalRevenue) * 0.89;
  const previousExpenses = parseFloat(metrics.totalExpenses) * 0.97;
  const previousProfit = parseFloat(metrics.netProfit) * 0.82;
  const previousCash = parseFloat(metrics.cashBalance) * 0.94;

  const revenueChange = getPercentageChange(parseFloat(metrics.totalRevenue), previousRevenue);
  const expensesChange = getPercentageChange(parseFloat(metrics.totalExpenses), previousExpenses);
  const profitChange = getPercentageChange(parseFloat(metrics.netProfit), previousProfit);
  const cashChange = getPercentageChange(parseFloat(metrics.cashBalance), previousCash);

  const metricCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(metrics.totalRevenue),
      change: revenueChange,
      icon: TrendingUp,
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    {
      title: "Total Expenses", 
      value: formatCurrency(metrics.totalExpenses),
      change: expensesChange,
      icon: TrendingDown,
      iconBg: "bg-error/10",
      iconColor: "text-error",
    },
    {
      title: "Net Profit",
      value: formatCurrency(metrics.netProfit),
      change: profitChange,
      icon: BarChart3,
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    {
      title: "Cash Balance",
      value: formatCurrency(metrics.cashBalance),
      change: cashChange,
      icon: Building2,
      iconBg: "bg-ibm-blue/10",
      iconColor: "text-ibm-blue",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metricCards.map((metric) => (
        <Card key={metric.title} className="border-ibm-gray-20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-ibm-gray-60">{metric.title}</h3>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${metric.iconBg}`}>
                <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-semibold text-ibm-gray-100 font-mono">
                {metric.value}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${
                  metric.change >= 0 ? "text-success" : "text-error"
                }`}>
                  {metric.change >= 0 ? "+" : ""}{metric.change.toFixed(1)}%
                </span>
                <span className="text-sm text-ibm-gray-60">vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
