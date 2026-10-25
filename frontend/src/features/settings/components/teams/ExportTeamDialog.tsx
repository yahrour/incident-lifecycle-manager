import { useState } from "react";
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
import { FileDown, FileJson, FileSpreadsheet } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import type { ExportFileFormat } from "../../types";
import { exportTeams } from "../../api/teams";

const FORMATS = [
  {
    value: "json",
    label: "JSON",
    description: "Structured, best for tooling and re-import.",
    icon: FileJson,
  },
  {
    value: "csv",
    label: "CSV",
    description: "Spreadsheet-friendly, opens in Excel or Sheets.",
    icon: FileSpreadsheet,
  },
] as const;

export function ExportTeamDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [format, setFormat] = useState<ExportFileFormat>("json");

  const setOpen = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setFormat("json");
    }
  };

  const mutation = useMutation({
    mutationFn: () => exportTeams(format),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export teams</DialogTitle>
          <DialogDescription>
            Download all your teams with their services and rotation settings.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="exportFormat">File format</FieldLabel>
          <div
            id="exportFormat"
            role="radiogroup"
            aria-label="File format"
            className="grid grid-cols-2 gap-3"
          >
            {FORMATS.map((option) => {
              const Icon = option.icon;
              const selected = format === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setFormat(option.value)}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-input hover:bg-muted/50"
                  )}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Icon
                      className={cn(
                        "size-4",
                        selected ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    {option.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
          <FieldDescription>
            The export includes name, description, rotation period (days),
            escalation timeout (minutes), and services.
          </FieldDescription>
        </Field>

        <DialogFooter className="mt-2">
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            disabled={!format}
            onClick={() => mutation.mutate()}
          >
            <FileDown data-icon="inline-start" />
            Download {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
