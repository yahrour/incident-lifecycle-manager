import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ApiKeyForm } from "./ApiKeyForm";
import { ApiKeyReveal } from "./ApiKeyReveal";

export function CreateApiKeyDialog() {
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => setCreatedKey(null), 200);
      setErrors([]);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="cursor-pointer">
            <Plus data-icon="inline-start" />
            Create API key
          </Button>
        }
      ></DialogTrigger>

      <DialogContent className="max-w-lg!">
        {createdKey ? (
          <ApiKeyReveal apiKey={createdKey} />
        ) : (
          <ApiKeyForm
            setCreatedKey={setCreatedKey}
            errors={errors}
            setErrors={setErrors}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
