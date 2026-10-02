import { GoogleLogin } from "@react-oauth/google";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { googleLogin } from "../api/authApi";

export default function GoogleAuthButton() {
  const navigate = useNavigate();

  const { mutate } = useMutation({
    mutationFn: googleLogin,
    onSuccess: () => navigate("/"),
  });

  return (
    <GoogleLogin
      onSuccess={({ credential }) => mutate(credential)}
      onError={() => console.error("Google login failed")}
      text="continue_with"
    />
  );
}
