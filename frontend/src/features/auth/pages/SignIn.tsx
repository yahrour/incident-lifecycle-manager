import { AuthCard } from "../components/AuthCard";
export default function SignIn() {
  return (
    <AuthCard>
      <h1>Sign in</h1>
      <form className="custom-form">
        <div className="flex text-left flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="email">
            Work email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-50"
          />
        </div>
        <div className="flex text-left flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-50"
          />
        </div>
        <button type="submit" className="app-button">
          Login
        </button>
      </form>
    </AuthCard>
  );
}
