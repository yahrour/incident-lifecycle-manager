import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { Copy, CopyCheck } from "lucide-react";
import { useState } from "react";

export function ApiKeyReveal({ apiKey }: { apiKey: string }) {
  const [copied, setCopied] = useState(false);

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      toast.add({
        type: "error",
        title: "failed to copy",
      });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>API Key Created</DialogTitle>
        <DialogDescription>
          Copy this key now. You won't be able to see it again.
        </DialogDescription>
      </DialogHeader>

      <div className="flex gap-2">
        <Input
          readOnly
          value={apiKey}
          onFocus={(e) => e.target.select()}
          className="font-mono text-xs"
          aria-label="API key"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => void copyKey()}
        >
          {copied ? <CopyCheck /> : <Copy />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Send it in the x-api-key header when posting alerts
      </p>
    </>
  );
}
