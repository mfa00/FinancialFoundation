import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus } from "lucide-react";
import { useCurrentCompany } from "@/hooks/use-current-company";

interface CompanySwitcherProps {
  onAddCompany?: () => void;
}

export function CompanySwitcher({ onAddCompany }: CompanySwitcherProps) {
  const { currentCompany, companies, switchCompany } = useCurrentCompany();

  const getCompanyInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getCompanyColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500", 
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500"
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  if (!currentCompany) {
    return (
      <div className="p-3 bg-ibm-gray-10 rounded-lg">
        <div className="text-center text-ibm-gray-60">
          No company selected
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-3 bg-ibm-gray-10 hover:bg-ibm-gray-20 transition-colors h-auto"
        >
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getCompanyColor(currentCompany.name)}`}>
              {getCompanyInitials(currentCompany.name)}
            </div>
            <div className="text-left">
              <div className="font-medium text-ibm-gray-100">{currentCompany.name}</div>
              <div className="text-sm text-ibm-gray-60">{currentCompany.industry || "Business"}</div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-ibm-gray-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="start">
        <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => switchCompany(company.id)}
            className={`flex items-center space-x-3 p-3 ${
              company.id === currentCompany.id ? "bg-ibm-gray-10" : ""
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getCompanyColor(company.name)}`}>
              {getCompanyInitials(company.name)}
            </div>
            <div className="flex-1">
              <div className="font-medium text-ibm-gray-100">{company.name}</div>
              <div className="text-sm text-ibm-gray-60">{company.industry || "Business"}</div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddCompany} className="flex items-center space-x-3 p-3 text-blue-600">
          <Plus className="h-4 w-4" />
          <span className="font-medium">Add New Company</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
