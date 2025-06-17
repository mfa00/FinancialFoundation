import { useAuth } from "@/lib/auth";

export function useCurrentUser() {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}
