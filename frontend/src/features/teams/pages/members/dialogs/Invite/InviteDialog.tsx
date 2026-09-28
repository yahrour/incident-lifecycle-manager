import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import {  useForm } from "react-hook-form";
import z from "zod";
import { inviteSchema } from "@/features/teams/schemas/invite.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import type { Team } from "@/features/teams/types";
import { InviteLink } from "./InviteLink";
import { InviteForm } from "./InviteForm";


export function InviteDialog({ team }: { team: Team }) {
  const inviteSchemaWithoutTeamId = inviteSchema.omit({ teamId: true });
  type InviteSchema = z.infer<typeof inviteSchemaWithoutTeamId>;
  const form = useForm<InviteSchema>({
    resolver: zodResolver(inviteSchemaWithoutTeamId),
    defaultValues: {
      inviteEmail: "",
      expiresIn: 72,
    },
  });

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => setInviteUrl(null), 200)
      setErrors([]);
      form.reset();
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="secondary" />}>
        <UserPlus />
        Invite engineer
      </DialogTrigger>

      <DialogContent className="max-w-lg!">
        {inviteUrl ? (
          <InviteLink url={inviteUrl} email={form.getValues("inviteEmail")} />
        ) : (
          <InviteForm team={team} setInviteUrl={setInviteUrl} errors={errors} setErrors={setErrors} />
        )}
      </DialogContent>
    </Dialog>
  );
}
