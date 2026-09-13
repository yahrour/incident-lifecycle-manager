import { AuthCard } from "../components/AuthCard";
import { Field } from "../components/Field";
export default function SignIn() {
  return (
    <AuthCard>
      <h1>Sign in</h1>
      <form className="custom-form">
        <Field
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
        />
        <button type="submit" className="app-button">
          Login
        </button>
      </form>
    </AuthCard>
  );
}
