import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { cn } from "cn";
import { FileText, FileUp, Upload, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { importTeams } from "../../api/teams";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { parseApiError } from "@/utils/api";
import { queryClient } from "@/lib/queryClient";
import { teamKeys } from "@/features/organization/shared/constants";
import { env } from "@/config/env";
import {
  extractFileExtension,
  formatFileSize,
  isFileEmpty,
  isFileTooLarge,
  isValidFileFormat,
} from "../../utils";

type FileErrorCode = "INVALID_FILE_FORMAT" | "FILE_TOO_LARGE" | "FILE_EMPTY";

function validateFile(file: File): {
  valid: boolean;
  error: FileErrorCode | null;
} {
  if (!isValidFileFormat(extractFileExtension(file.name))) {
    return { valid: false, error: "INVALID_FILE_FORMAT" };
  }

  if (isFileEmpty(file.size)) {
    return { valid: false, error: "FILE_EMPTY" };
  }

  if (isFileTooLarge(file.size)) {
    return { valid: false, error: "FILE_TOO_LARGE" };
  }

  return { valid: true, error: null };
}

const FILE_ERRORS: Record<
  FileErrorCode,
  { title: string; description: string }
> = {
  INVALID_FILE_FORMAT: {
    title: "Invalid file format",
    description: "Only CSV and JSON files are supported.",
  },
  FILE_TOO_LARGE: {
    title: "File too large",
    description: `The file exceeds the ${formatFileSize(
      env.VITE_IMPORT_MAX_FILE_BYTES
    )} limit.`,
  },
  FILE_EMPTY: {
    title: "Empty file",
    description: "The selected file is empty.",
  },
};

function rejectMultipleFiles(count: number) {
  if (count <= 1) return false;
  toast.add({
    type: "error",
    title: "Too many files",
    description: "Only 1 file is supported.",
  });
  return true;
}

export function ImportTeamDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetFile = () => {
    setFile(null);
    setIsDragging(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const mutation = useMutation({
    mutationFn: importTeams,
    onSuccess: ({ data }) => {
      resetFile();
      onOpenChange(false);

      const { created, skipped } = data;
      const parts = [`${created} team${created === 1 ? "" : "s"} imported`];
      if (skipped > 0) {
        parts.push(`${skipped} already existing skipped`);
      }

      const title =
        created === 0 ? "Nothing to import" : "Teams imported successfully";
      const description =
        created === 0
          ? `All ${skipped} team${skipped === 1 ? "" : "s"} already exist${skipped === 1 ? "s" : ""}.`
          : parts.join(", ");

      toast.add({
        type: "success",
        title,
        description,
      });

      void queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: teamKeys.metrics() });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: "Couldn't import teams",
        description: parseApiError(error)[0],
      });
    },
  });

  const setOpen = (nextOpen: boolean) => {
    if (mutation.isPending) {
      return;
    }
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetFile();
    }
  };

  const handleSelectedFile = (selected: File) => {
    if (mutation.isPending) return;
    const result = validateFile(selected);
    if (!result.valid && result.error) {
      const info = FILE_ERRORS[result.error];
      toast.add({
        type: "error",
        title: info.title,
        description: info.description,
      });
      return;
    }
    setFile(selected);
  };

  const handleImport = () => {
    if (!file || mutation.isPending) return;

    const formData = new FormData();
    formData.append("file", file);

    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={!mutation.isPending}
      >
        <DialogHeader>
          <DialogTitle>Import teams</DialogTitle>
          <DialogDescription>
            Upload a JSON or CSV file. Existing teams are left untouched — only
            new teams are created.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="importFile">File</FieldLabel>
          <div
            role="button"
            tabIndex={0}
            onClick={() => !mutation.isPending && inputRef.current?.click()}
            onKeyDown={(event) => {
              if (
                (event.key === "Enter" || event.key === " ") &&
                !mutation.isPending
              ) {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              if (mutation.isPending) return;
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              if (mutation.isPending) return;
              const files = event.dataTransfer.files;
              if (!files || files.length === 0) return;

              if (rejectMultipleFiles(files.length)) return;

              handleSelectedFile(files[0]);
            }}
            className={cn(
              "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/30 hover:bg-muted/50"
            )}
          >
            {file ? (
              <>
                <FileText className="size-6 text-primary" />
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  {file.name}
                  <button
                    type="button"
                    aria-label="Remove file"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFile(null);
                      if (inputRef.current) {
                        inputRef.current.value = "";
                      }
                    }}
                    className={cn(
                      "cursor-pointer text-muted-foreground transition-colors hover:text-foreground",
                      mutation.isPending && "hidden"
                    )}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>

                <span className="text-xs text-muted-foreground">
                  {mutation.isPending ? (
                    formatFileSize(file.size)
                  ) : (
                    <>{formatFileSize(file.size)} · click to replace</>
                  )}
                </span>
              </>
            ) : (
              <>
                <Upload
                  className={cn(
                    "size-6",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span className="text-sm text-muted-foreground">
                  {isDragging
                    ? "Drop your file here"
                    : "Click to choose a file or drag and drop"}
                </span>
                <span className="text-xs text-muted-foreground">
                  JSON or CSV · up to{" "}
                  {formatFileSize(env.VITE_IMPORT_MAX_FILE_BYTES)}
                </span>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            id="importFile"
            type="file"
            accept=".json,.csv"
            className="hidden"
            name="file"
            onChange={(e) => {
              const files = e.currentTarget.files;
              if (!files || files.length === 0) return;

              if (rejectMultipleFiles(files.length)) return;

              handleSelectedFile(files[0]);
            }}
            disabled={mutation.isPending}
          />
          <FieldDescription>
            The file must contain name, description, rotation period (days),
            escalation timeout (minutes), and services.
          </FieldDescription>
        </Field>

        <DialogFooter className="mt-2">
          <DialogClose
            render={<Button type="button" variant="outline" />}
            disabled={mutation.isPending}
          >
            Cancel
          </DialogClose>
          <Button
            type="button"
            disabled={!file || mutation.isPending}
            onClick={handleImport}
          >
            {mutation.isPending ? (
              <>
                <Spinner />
                Importing
              </>
            ) : (
              <>
                <FileUp data-icon="inline-start" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
