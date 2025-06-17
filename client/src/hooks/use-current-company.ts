import { useAuth } from "@/lib/auth";

export function useCurrentCompany() {
  const { companies, currentCompanyId, switchCompany } = useAuth();
  
  const currentCompany = companies.find(company => company.id === currentCompanyId);
  
  return {
    currentCompany,
    companies,
    switchCompany,
    hasCompanies: companies.length > 0,
  };
}
