import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import type { User, Company } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  companies: (Company & { role: string })[];
  currentCompanyId: number | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  switchCompany: (companyId: number) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<(Company & { role: string })[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setUser(data.user);
      setCompanies(data.companies || []);
      setCurrentCompanyId(data.currentCompanyId || null);
    }
  }, [data]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      setCompanies(data.companies || []);
      setCurrentCompanyId(data.currentCompanyId || null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      setCompanies([]);
      setCurrentCompanyId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      setUser(null);
      setCompanies([]);
      setCurrentCompanyId(null);
      queryClient.clear();
    },
  });

  const switchCompanyMutation = useMutation({
    mutationFn: async (companyId: number) => {
      const response = await apiRequest("POST", `/api/companies/${companyId}/switch`);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentCompanyId(data.currentCompanyId);
      queryClient.invalidateQueries();
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (userData: any) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const switchCompany = async (companyId: number) => {
    await switchCompanyMutation.mutateAsync(companyId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        companies,
        currentCompanyId,
        login,
        register,
        logout,
        switchCompany,
        isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
