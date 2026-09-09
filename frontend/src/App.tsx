import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <div>
          <h1 className="font-bold text-7xl uppercase text-center">hello</h1>
        </div>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
