import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, BookOpen, Building2 } from "lucide-react";
import { Link } from "wouter";

export function QuickActions() {
  const actions = [
    {
      name: "Create Invoice",
      href: "/invoices",
      icon: FileText,
      iconBg: "bg-ibm-blue/10",
      iconColor: "text-ibm-blue",
    },
    {
      name: "Add Expense",
      href: "/expenses",
      icon: Plus,
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    {
      name: "Journal Entry",
      href: "/journal-entries",
      icon: BookOpen,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
    },
    {
      name: "Reconcile",
      href: "/bank-reconciliation",
      icon: Building2,
      iconBg: "bg-error/10",
      iconColor: "text-error",
    },
  ];

  return (
    <Card className="border-ibm-gray-20">
      <CardHeader className="border-b border-ibm-gray-20">
        <h3 className="text-lg font-semibold text-ibm-gray-100">Quick Actions</h3>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action) => (
            <Link key={action.name} href={action.href}>
              <Button 
                variant="ghost" 
                className="flex flex-col items-center p-4 h-auto border border-ibm-gray-20 hover:bg-ibm-gray-10 transition-colors group"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${action.iconBg} group-hover:scale-110 transition-transform`}>
                  <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                </div>
                <span className="font-medium text-ibm-gray-100">{action.name}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
