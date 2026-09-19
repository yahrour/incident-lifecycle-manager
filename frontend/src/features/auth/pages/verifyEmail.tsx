import { useSearchParams } from "react-router";
import { useVerifyEmail } from "../hooks/useVerifyEmail";
import { useEffect } from "react";

export function VerifyEmail() {
  const { mutate, data, isSuccess, error } = useVerifyEmail();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  useEffect(() => {//use the mutation to post the request to backend }, [token]);
  if (isSuccess) {
    return <div>your email is verified</div>;
  }
}
