import { QueryClient } from 'react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes – prevents refetch on window focus
      refetchOnWindowFocus: false,
    },
  },
});