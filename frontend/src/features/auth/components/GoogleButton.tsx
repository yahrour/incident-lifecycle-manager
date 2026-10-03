import { Button } from "@/components/ui/button";
import googleLogo from "@/assets/google.svg";
import { env } from "@/config/env";

export function GoogleButton({ text = "Continue with Google" }) {
  const url = new URL(
    `${env.VITE_API_URL}/auth/google`,
    window.location.origin
  );

  return (
    <Button
      render={<a href={url.toString()} />}
      nativeButton={false}
      variant="outline"
      className="w-full gap-2"
    >
      <img src={googleLogo} alt="" className="size-5" />
      {text}
    </Button>
  );
}
