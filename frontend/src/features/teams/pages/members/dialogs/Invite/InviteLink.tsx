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

export function InviteLink({ url, email }: { url: string; email: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
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
        <DialogTitle>Invite link ready</DialogTitle>
        <DialogDescription>
          Copy this link and send it to the engineer.
        </DialogDescription>
      </DialogHeader>

      <div className="flex gap-2">
        <Input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="font-mono text-xs"
          aria-label="Invite link"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => void copyLink()}
        >
          {copied ? <CopyCheck /> : <Copy />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        This link only works for{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>
    </>
  );
}
