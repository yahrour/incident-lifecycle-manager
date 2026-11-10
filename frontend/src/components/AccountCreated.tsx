import { Link } from "react-router";
import { CheckCircle } from "lucide-react";

export function AccountCreated({ text }: { text: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-6 py-8">
      <p className="text-center font-serif text-base italic leading-relaxed text-foreground md:text-3xl">
        Incident Lifecycle <span className="text-primary">Manager</span>
      </p>

      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-lg border bg-white p-8 text-center">
        <CheckCircle className="size-12 text-primary" aria-hidden="true" />

        <h1 className="font-heading text-[26px] font-bold leading-[1.15] tracking-[-0.03em] text-foreground">
          Account created
        </h1>

        <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>

        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-[15px] font-semibold text-white no-underline transition-colors hover:bg-primary/90"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
