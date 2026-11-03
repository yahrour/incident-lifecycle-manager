export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={`font-script text-[clamp(24px,2.3vw,30px)] leading-none tracking-[-0.02em] text-foreground ${className ?? ""}`}
    >
      Incident Lifecycle <span className="text-primary">Manager</span>
    </span>
  );
}
