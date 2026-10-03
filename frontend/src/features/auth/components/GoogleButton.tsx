import { Button } from "@/components/ui/button";
import googleLogo from "@/assets/google.svg";

export function GoogleButton({ text = "Continue with Google" }) {
  const url = new URL(
    "http://localhost:3000/api/v1/auth/google",
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
