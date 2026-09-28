import { toast } from "@/components/ui/toast";
import { useEffect } from "react";

export function useErrorToast(
  isError: boolean,
  message: string,
  title = "failed to fetch"
) {
  useEffect(() => {
    if (isError) {
      toast.add({
        type: "error",
        title,
        description: message,
      });
    }
  }, [isError, message, title]);
}
