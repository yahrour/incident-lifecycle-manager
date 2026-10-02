// components/GoogleButton.tsx
import { GoogleLogin } from "@react-oauth/google";

type GoogleButtonProps = {
  onCredential: (credential: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
  loginHint?: string;
};

export function GoogleButton({
  onCredential,
  text = "continue_with",
  loginHint,
}: GoogleButtonProps) {
  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={({ credential }) => {
          if (credential) onCredential(credential);
        }}
        onError={() => console.error("Google login failed")}
        text={text}
        login_hint={loginHint}
        theme="outline"
        size="large"
        shape="rectangular"
        logo_alignment="center"
        width="320"
      />
    </div>
  );
}
