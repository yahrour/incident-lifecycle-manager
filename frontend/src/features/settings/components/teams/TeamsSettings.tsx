import { useState } from "react";
import { Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportTeamDialog } from "./ExportTeamDialog";

type ActiveDialog = "import" | "export" | null;

export function Row({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 p-4">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-foreground [&_svg]:size-5"
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export function TeamsSettings() {
  const [dialog, setDialog] = useState<ActiveDialog>(null);

  return (
    <section className="w-full bg-card space-y-6 p-4 rounded-xl">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Import & export</h2>
        <p className="text-sm text-muted-foreground">
          Move your teams between environments.
        </p>
      </header>

      <div className="space-y-2">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Teams
        </h3>
        <div className="divide-y divide-border overflow-hidden rounded-lg border">
          <Row
            icon={<FileDown />}
            title="Export teams"
            description="Download your teams as JSON or CSV."
            action={
              <Button
                variant="outline"
                aria-label="Export teams"
                onClick={() => setDialog("export")}
              >
                <Download aria-hidden="true" data-icon="inline-start" />
                Export
              </Button>
            }
          />
        </div>
      </div>

      <ExportTeamDialog
        open={dialog === "export"}
        onOpenChange={(open) => setDialog(open ? "export" : null)}
      />
    </section>
  );
}
