import logoSrc from "@/assets/favicon.ico";

export function LogoSvg({ className }: { className?: string })
{
  return <img src={logoSrc} alt="Better Incidents" className={className} />;
}
