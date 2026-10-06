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
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Trash } from "lucide-react";
import { useState } from "react";
import { deleteApiKey } from "../api/apiKeys";

export function DeleteApiKeyDialog({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      toast.add({
        type: "success",
        title: "API key deleted",
      });

      void queryClient.invalidateQueries({
        queryKey: ["apiKeys"],
      });
    },
    onError: () => {
      toast.add({
        type: "error",
        title: "Couldn't delete API key",
        description: "Something went wrong. Please try again.",
      });
    },
    onSettled: () => {
      setOpen(false);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="destructive"
            size="icon-sm"
            aria-label={`Delete ${name}`}
          />
        }
      >
        <Trash />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Anything still sending alerts with
            this key will stop working.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => mutate(id)} disabled={isPending}>
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
