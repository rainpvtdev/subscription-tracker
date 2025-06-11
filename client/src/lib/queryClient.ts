import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      // Add cache control for GET requests
      cache: queryKey[1]?.cache === false ? 'no-store' : 'default',
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      // Suppress 401 error, do not log or throw
      return null;
    }
    try {
      await throwIfResNotOk(res);
    } catch (err: any) {
      // Only suppress 401 errors, rethrow others
      if (res.status === 401) {
        return null;
      }
      throw err;
    }
    return await res.json();
  };

export function isLoggedIn(user: any): boolean {
  return !!(user && typeof user === 'object' && (user.id || user.username || user.email));
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: true, // Refresh data when window regains focus
      staleTime: 30 * 1000, // Consider data stale after 30 seconds
      cacheTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
      retry: 1, // Retry failed requests once
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: false,
    },
  },
});
