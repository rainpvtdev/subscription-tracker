import { fetchCurrentUser } from "@/api";
import { useQuery } from "@tanstack/react-query";

export function useUser(enabled = false) {
  const query = useQuery({
    queryKey: ["user"],
    queryFn: fetchCurrentUser,
    enabled, // Only fetch when explicitly enabled
    retry: false,
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
}
