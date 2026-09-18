import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { createTeamSchema } from "../schemas";
import { toast } from "@/components/ui/toast";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useState } from "react";
import {
  DEFAULT_ESCALATION_TIMEOUT_MINUTES,
  DEFAULT_ROTATION_PERIOD_DAYS,
} from "../constants";

const teams = [
  {
    team: "platform",
    services: ["api-gateway", "auth", "payments"],
    members: 8,
    rotation: "7",
    onCallNow: "Sarah Chen",
    escalates: "Platform Lead",
  },
  {
    team: "frontend",
    services: ["web-app", "mobile-app"],
    members: 6,
    rotation: "Daily",
    onCallNow: "James Wilson",
    escalates: "Frontend Lead",
  },
  {
    team: "data",
    services: ["data-pipeline", "analytics", "warehouse"],
    members: 5,
    rotation: 9,
    onCallNow: "Maya Patel",
    escalates: "Data Lead",
  },
];
type Team = (typeof teams)[0];

export function Teams() {
  return (
    <div>
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
        <h1 className="font-medium text-sm">Teams</h1>
        <span className="text-muted-foreground text-xs">3 teams</span>
      </div>
      <div className="mt-2 p-4 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-xs opacity-50">
            Organize engineers into teams to manage on-call rotations
          </p>
          <CreateTeamDialog />
        </div>
        <TeamsTable teams={teams} />
      </div>
    </div>
  );
}

function TeamsTable({ teams }: { teams: Team[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="uppercase">
          <TableHead className="w-2/5">team</TableHead>
          <TableHead>services</TableHead>
          <TableHead className="w-15">members</TableHead>
          <TableHead>rotation</TableHead>
          <TableHead>on-call now</TableHead>
          <TableHead>escalates</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {teams.map((team) => (
          <TableRow
            key={team.team}
            className="w-full cursor-pointer"
            onClick={() => (window.location.href = `/teams/${team.team}`)}
          >
            <TableCell className="font-medium text-sm flex-1">
              {team.team}
            </TableCell>
            <TableCell className="text-xs text-left text-muted-foreground">
              {team.services.join(" • ")}
            </TableCell>
            <TableCell className="text-xs text-right">{team.members}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              every {team.rotation} days
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {team.onCallNow}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {team.escalates}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CreateTeamDialog() {
  const [open, setOpen] = useState(false);

  type CreateTeamInput = z.input<typeof createTeamSchema>;
  type CreateTeamOutput = z.output<typeof createTeamSchema>;
  const form = useForm<CreateTeamInput, unknown, CreateTeamOutput>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      escalationTimeoutMinutes: DEFAULT_ESCALATION_TIMEOUT_MINUTES,
      timezone: null,
      rotationPeriodDays: DEFAULT_ROTATION_PERIOD_DAYS,
    },
  });

  const onSubmit = (data: z.infer<typeof createTeamSchema>) => {
    console.log("data: ", data);
    form.reset();
    setOpen(false);
    toast.add({
      title: "Team created",
    });
  };

  const timezones = Intl.supportedValuesOf("timeZone");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="cursor-pointer">
            <Plus data-icon="inline-start" />
            Create team
          </Button>
        }
      ></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a team</DialogTitle>
          <DialogDescription>
            A team owns services and a single on-call rotation.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            void form.handleSubmit(onSubmit)(event);
          }}
          className="space-y-4"
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="teamName">Team name *</FieldLabel>
                  <Input
                    {...field}
                    id="teamName"
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. Platform Infrastructure"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                    {...field}
                    id="description"
                    aria-invalid={fieldState.invalid}
                    placeholder="What does this team own or respond to?"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="rotationStartDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="rotationStartDate">
                      Rotation start date
                    </FieldLabel>
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button
                            variant="outline"
                            data-empty={!field.value}
                            className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                          />
                        }
                      >
                        <CalendarIcon />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="timezone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                    <Combobox
                      items={timezones}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <ComboboxInput
                        placeholder="Select timezone"
                        className="w-full"
                      />

                      <ComboboxContent>
                        <ComboboxEmpty>No timezone found.</ComboboxEmpty>

                        <ComboboxList>
                          {(tz: string) => (
                            <ComboboxItem key={tz} value={tz}>
                              {tz.replaceAll("_", " ")}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="rotationPeriodDays"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="rotationPeriodDays">
                      Rotation period (days)
                    </FieldLabel>
                    <Input
                      {...field}
                      id="rotationPeriodDays"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                      type="number"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="escalationTimeoutMinutes"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="escalationTimeoutMinutes">
                      Escalation timeout (minutes)
                    </FieldLabel>
                    <Input
                      {...field}
                      id="escalationTimeoutMinutes"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                      type="number"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="webhookUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="webhookurl">
                    Discord webhook URL
                  </FieldLabel>
                  <Input
                    {...field}
                    id="webhookurl"
                    aria-invalid={fieldState.invalid}
                    placeholder="Paste your Discord webhook URL"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <Field orientation="horizontal" className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Submit</Button>
          </Field>
        </form>
      </DialogContent>
    </Dialog>
  );
}
