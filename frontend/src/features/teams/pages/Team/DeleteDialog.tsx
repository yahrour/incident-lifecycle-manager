import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { deleteTeam } from "../../api/teamsApi";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Trash } from "lucide-react";

export function DeleteDialog({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      toast.add({
        type: "success",
        title: "team deleted",
      });

      void queryClient.invalidateQueries({
        queryKey: ["teams"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["teamsMetrics"]
      })

      void navigate("/manager/teams", { replace: true });
    },
    onError: () => {
      toast.add({
        type: "error",
        title: "failed to delete",
        description: "something went wrong when deleting the team",
      });
    },
    onSettled: () => {
      setOpen(false);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <Trash data-icon="inline-start" />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the team.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => mutate(teamId)}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner />
                <span>Deleting...</span>
              </>
            ) : (
              "Continue"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
