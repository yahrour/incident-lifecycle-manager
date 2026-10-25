import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useMutation } from "@tanstack/react-query";
import { Trash } from "lucide-react";
import { removeUnavailability } from "../../api/unavailability";
import { toast } from "@/components/ui/toast";
import { queryClient } from "@/lib/queryClient";
import { unavailabilityKeys } from "../../constants/query.keys";
import { parseApiError } from "@/utils/api";
import type { UnavailabilityStatus } from "@/types";

export function RemoveUnavailabilityButton({
  teamId,
  memberId,
  unavailabilityId,
  unavailabilityStatus,
}: {
  teamId: string;
  memberId: number;
  unavailabilityId: number;
  unavailabilityStatus: UnavailabilityStatus;
}) {
  const mutation = useMutation({
    mutationFn: (unavailabilityId: number) =>
      removeUnavailability({
        teamId,
        memberId,
        unavailabilityId,
      }),
    onSuccess: () => {
      toast.add({
        type: "success",
        title: "Unavailability removed",
        description: "The Unavailability was successfully removed",
      });
      void queryClient.invalidateQueries({
        queryKey: unavailabilityKeys.all,
      });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: "Failed to remove unavailability",
        description: parseApiError(error)[0],
      });
    },
  });

  const handleRemove = () => {
    mutation.mutate(unavailabilityId);
  };

  return (
    <Button
      variant="ghost"
      className="text-destructive! hover:bg-destructive/10! mx-auto block"
      onClick={handleRemove}
      disabled={mutation.isPending || unavailabilityStatus !== "PENDING"}
      size="sm"
    >
      {mutation.isPending ? <Spinner /> : <Trash />}
    </Button>
  );
}
