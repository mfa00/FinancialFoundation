import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function OutstandingItems() {
  // Mock data - in a real app, this would come from API calls
  const items = [
    {
      id: 1,
      type: "warning",
      title: "5 Overdue Invoices",
      subtitle: "Total: $23,450.00",
      action: "Review",
      href: "/invoices",
      icon: AlertTriangle,
      bgColor: "bg-warning/10",
      textColor: "text-warning",
      actionColor: "text-warning hover:text-orange-600",
    },
    {
      id: 2,
      type: "info",
      title: "Bank Reconciliation Due",
      subtitle: "Wells Fargo - November",
      action: "Start",
      href: "/bank-reconciliation",
      icon: Clock,
      bgColor: "bg-ibm-blue/10",
      textColor: "text-ibm-blue",
      actionColor: "text-ibm-blue hover:text-blue-700",
    },
    {
      id: 3,
      type: "success",
      title: "Monthly Reports Ready",
      subtitle: "P&L, Balance Sheet generated",
      action: "View",
      href: "/reports",
      icon: CheckCircle,
      bgColor: "bg-success/10",
      textColor: "text-success",
      actionColor: "text-success hover:text-green-700",
    },
  ];

  return (
    <Card className="border-ibm-gray-20">
      <CardHeader className="border-b border-ibm-gray-20">
        <h3 className="text-lg font-semibold text-ibm-gray-100">Outstanding Items</h3>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-3 rounded-lg ${item.bgColor}`}
          >
            <div className="flex items-center space-x-3">
              <item.icon className={`h-5 w-5 ${item.textColor}`} />
              <div>
                <div className="font-medium text-ibm-gray-100">{item.title}</div>
                <div className="text-sm text-ibm-gray-60">{item.subtitle}</div>
              </div>
            </div>
            <Link to={item.href}>
              <Button variant="ghost" size="sm" className={`font-medium text-sm ${item.actionColor}`}>
                {item.action}
              </Button>
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
