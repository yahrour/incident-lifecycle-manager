import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return false;
        }
        if (failureCount >= 3) return false;
        return true;
      },
      staleTime: 30_000,
    },
  },
});
