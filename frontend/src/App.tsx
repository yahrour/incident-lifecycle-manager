import { ErrorBoundary } from "@/components/ErrorBoundary";
import AppRoutes from "@/routes/AppRoutes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/context/AuthProvider";

export default function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </TooltipProvider>
    </ErrorBoundary>
  );
}
