import { toast } from "@/components/ui/toast";
import { useEffect } from "react";

export function useErrorToast(isError: boolean, message: string) {
  useEffect(() => {
    if (isError) {
      toast.add({
        type: "error",
        title: "failed to fetch",
        description: message,
      });
    }
  }, [isError, message]);
}
