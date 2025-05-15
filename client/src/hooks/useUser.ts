import { fetchCurrentUser } from "@/api";
import { useQuery } from "@tanstack/react-query";

export function useUser() {
  const query = useQuery({
    queryKey: ["user"],
    queryFn: fetchCurrentUser
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
}
