import { useNavigate, useSearchParams } from "react-router";
import useValidateInvite from "../hooks/useInvite";
export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  return <h1>hi there </h1>;
}
