type FloatingChipProps = {
  children: string;
  className?: string;
  tone?: "neutral" | "accent";
};

/**
 * Soft, raised "reaction" pill that floats around the hero — echoes the
 * multiplayer/collaboration idea from the design reference.
 *
 * Tones deliberately map onto the shared theme tokens (see `index.css`) so the
 * landing stays in step with the dashboard:
 *   accent -> `--primary`, the same coral as the app's primary buttons
 *   neutral -> `--secondary`, the theme's warm neutral surface
 */
export function FloatingChip({
  children,
  className,
  tone = "neutral",
}: FloatingChipProps) {
  const palette =
    tone === "accent"
      ? "bg-primary text-primary-foreground border-primary/60"
      : "bg-secondary text-secondary-foreground border-border";

  return (
    <span
      className={`absolute z-2 inline-flex items-center rounded-[14px] border px-[18px] py-[13px] text-[15px] font-medium whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.05),0_5px_12px_rgba(0,0,0,0.06)] select-none ${palette} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
