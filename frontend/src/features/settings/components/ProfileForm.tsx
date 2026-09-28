import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";

type ProfileFormProps = {
  user: {
    email: string;
    firstName: string;
    lastName: string;
    timezone: string;
  };
};

export function ProfileForm({ user }: ProfileFormProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Personal information</FieldLegend>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="firstName">First name</FieldLabel>
                <Input id="firstName" defaultValue={user.firstName} />
              </Field>
              <Field>
                <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                <Input id="lastName" defaultValue={user.lastName} />
              </Field>
            </div>
          </FieldSet>
          <FieldSeparator />
          <FieldSet>
            <FieldLegend>Work email</FieldLegend>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" value={user.email} disabled />
              <FieldDescription>Your email can't be changed.</FieldDescription>
            </Field>
          </FieldSet>
        </FieldGroup>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button type="submit" className="w-full">
          Save changes
        </Button>
      </CardFooter>
    </Card>
  );
}
