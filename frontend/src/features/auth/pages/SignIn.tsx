import { FieldGroup, Field, FieldLabel } from "../../../components/ui/field";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

import { AuthCard } from "../components/AuthCard";
export default function SignIn() {
  return (
    <AuthCard>
      <h1>Sign in</h1>
      <form>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Work email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
        </FieldGroup>
        <Button className="w-full" type="submit">
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
