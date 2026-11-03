import logoSrc from "@/assets/favicon.ico";

export function LogoSvg({ className }: { className?: string }) {
  return (
    <img src={logoSrc} alt="Incident Lifecycle Manager" className={className} />
  );
}
