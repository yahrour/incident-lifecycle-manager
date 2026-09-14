import { ErrorBoundary } from "@/components/ErrorBoundary";
import AppRoutes from "@/routes/AppRoutes";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <AppRoutes />
      </TooltipProvider>
    </ErrorBoundary>
  );
}
