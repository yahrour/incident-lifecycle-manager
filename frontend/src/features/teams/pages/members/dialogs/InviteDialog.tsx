import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, UserPlus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { inviteSchema } from "@/features/teams/schemas/invite.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { createInvite } from "@/features/teams/api/invite";
import { toast } from "@/components/ui/toast";
import { useErrorToast } from "@/features/teams/hooks";

const EXPIRY_OPTIONS = [
  { value: 1, label: "1 hour" },
  { value: 12, label: "12 hours" },
  { value: 24, label: "24 hours" },
  { value: 48, label: "2 days" },
  { value: 72, label: "3 days" },
  { value: 168, label: "7 days" },
];

export function InviteDialog({ teamId }: { teamId: string }) {
  type InviteSchema = z.infer<typeof inviteSchema>;
  const form = useForm<InviteSchema>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      teamId,
      expiresIn: 72,
    },
  });

  const mutate = useMutation({
    mutationFn: createInvite,
    onSuccess: (res) => {
      if (res.success) {
        setInviteUrl(res.inviteLink);
      } else {
        toast.add({
          type: "error",
          title: "failed to create",
          description: "something went wrong creating the invite link",
        });
      }
    },
  });

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onSubmit = (data: InviteSchema) => {
    console.log("data: ", data);
    mutate.mutate(data);
  };

  useErrorToast(
    mutate.isError,
    "something went wrong creating the invite link",
    "failed to create"
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setInviteUrl(null);
      setCopied(false);
      form.reset();
    }
  };

  const copyLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="secondary" />}>
        <UserPlus />
        Invite engineer
      </DialogTrigger>

      <DialogContent className="max-w-lg!">
        {inviteUrl ? (
          <>
            <DialogHeader>
              <DialogTitle>Invite link ready</DialogTitle>
              <DialogDescription>
                Copy this link and send it to the engineer. They set their own
                password when they open it.
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-2">
              <Input
                readOnly
                value={inviteUrl}
                onFocus={(e) => e.target.select()}
                className="font-mono text-xs"
                aria-label="Invite link"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => void copyLink()}
              >
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This link only works for{" "}
              <span className="font-medium text-foreground">
                {form.getValues("email")}
              </span>
              .
            </p>

            <DialogFooter>
              <DialogClose render={<Button type="button" />}>Done</DialogClose>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invite an engineer</DialogTitle>
              <DialogDescription>
                Creates an invite link you can share. They set their own
                password when they open it.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                void form.handleSubmit(onSubmit)(e);
              }}
            >
              <FieldGroup>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email">Email *</FieldLabel>
                      <Input
                        {...field}
                        id="email"
                        aria-invalid={fieldState.invalid}
                        placeholder="e.g. alex@acme.com"
                        autoComplete="off"
                        autoFocus
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="specialty"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="specialty">Specialty</FieldLabel>
                      <Input
                        {...field}
                        id="specialty"
                        aria-invalid={fieldState.invalid}
                        placeholder="e.g. Backend"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="expiresIn"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="expiresIn">
                        Link expires in
                      </FieldLabel>
                      <Select
                        items={EXPIRY_OPTIONS}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="expiresIn"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPIRY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <DialogFooter className="mt-6">
                <DialogClose
                  render={<Button type="button" variant="outline" />}
                >
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Spinner /> : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
