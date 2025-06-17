import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  List, 
  BookOpen, 
  Building2, 
  FileText, 
  Users, 
  Receipt, 
  TrendingUp, 
  BarChart3, 
  Wallet,
  Settings,
  LogOut
} from "lucide-react";
import { CompanySwitcher } from "./company-switcher";
import { useAuth } from "@/lib/auth";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  onAddCompany?: () => void;
}

export function Sidebar({ onAddCompany }: SidebarProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { user } = useCurrentUser();

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      current: location === "/",
    },
    {
      name: "Accounting",
      items: [
        {
          name: "Chart of Accounts",
          href: "/chart-of-accounts",
          icon: List,
          current: location === "/chart-of-accounts",
        },
        {
          name: "Journal Entries",
          href: "/journal-entries",
          icon: BookOpen,
          current: location === "/journal-entries",
        },
        {
          name: "Bank Reconciliation",
          href: "/bank-reconciliation",
          icon: Building2,
          current: location === "/bank-reconciliation",
        },
      ],
    },
    {
      name: "Sales",
      items: [
        {
          name: "Invoices",
          href: "/invoices",
          icon: FileText,
          current: location === "/invoices",
        },
        {
          name: "Customers",
          href: "/customers",
          icon: Users,
          current: location === "/customers",
        },
      ],
    },
    {
      name: "Expenses",
      items: [
        {
          name: "Expense Tracking",
          href: "/expenses",
          icon: Receipt,
          current: location === "/expenses",
        },
        {
          name: "Vendors",
          href: "/vendors",
          icon: Building2,
          current: location === "/vendors",
        },
      ],
    },
    {
      name: "Reports",
      items: [
        {
          name: "Profit & Loss",
          href: "/reports/profit-loss",
          icon: TrendingUp,
          current: location === "/reports/profit-loss",
        },
        {
          name: "Balance Sheet",
          href: "/reports/balance-sheet",
          icon: BarChart3,
          current: location === "/reports/balance-sheet",
        },
        {
          name: "Cash Flow",
          href: "/reports/cash-flow",
          icon: Wallet,
          current: location === "/reports/cash-flow",
        },
      ],
    },
  ];

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className="w-64 bg-white border-r border-ibm-gray-20 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-ibm-gray-20">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-ibm-gray-100">AccuBooks Pro</h1>
          <Button variant="ghost" size="sm" className="text-ibm-gray-60 hover:text-ibm-gray-100">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Company Switcher */}
        <CompanySwitcher onAddCompany={onAddCompany} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((section) => (
          <div key={section.name} className="space-y-1">
            {section.href ? (
              <Link href={section.href}>
                <Button
                  variant={section.current ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    section.current 
                      ? "bg-ibm-blue text-white hover:bg-ibm-blue/90" 
                      : "text-ibm-gray-70 hover:bg-ibm-gray-10"
                  }`}
                >
                  <section.icon className="mr-3 h-4 w-4" />
                  {section.name}
                </Button>
              </Link>
            ) : (
              <>
                <div className="pt-4">
                  <h3 className="px-3 text-xs font-semibold text-ibm-gray-60 uppercase tracking-wider mb-2">
                    {section.name}
                  </h3>
                  {section.items?.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={item.current ? "secondary" : "ghost"}
                        className={`w-full justify-start ${
                          item.current 
                            ? "bg-ibm-blue text-white hover:bg-ibm-blue/90" 
                            : "text-ibm-gray-70 hover:bg-ibm-gray-10"
                        }`}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </Button>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile Footer */}
      {user && (
        <div className="p-4 border-t border-ibm-gray-20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-ibm-gray-60 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {getUserInitials(user.firstName, user.lastName)}
            </div>
            <div className="flex-1">
              <div className="font-medium text-ibm-gray-100">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-sm text-ibm-gray-60 capitalize">{user.role}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-ibm-gray-60 hover:text-ibm-gray-100"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
