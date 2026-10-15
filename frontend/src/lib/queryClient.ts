import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (failureCount >= 3) return false;

        if (axios.isAxiosError(error)) {
          // network/timeout error
          if (!error.response) return true;

          const status = error.response.status;
          // retry only on server-side/transient errors
          return status >= 500 || status === 429;
        }

        return false;
      },
      staleTime: 30_000,
    },
  },
});
