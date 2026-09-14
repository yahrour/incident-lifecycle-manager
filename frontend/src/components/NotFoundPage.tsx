import { Link } from "react-router";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  const user = {
    id: "#1",
    name: "Tobi",
    email: "tobi@acme.com",
    role: "manager" as "manager" | "engineer",
    team: "Acme Cloud",
  };

  const homePath = user
    ? user.role === "manager"
      ? "/manager/overview"
      : "/engineer/my-shift"
    : "/login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2efe9] px-4">
      <div className="flex flex-col items-center text-center">
        <span className="text-xs font-semibold tracking-widest text-[#a39a8b]">
          ERROR 404
        </span>
        <h1 className="mt-2 text-3xl font-bold text-[#2a2521]">
          This page went off-call
        </h1>
        <p className="mt-3 max-w-sm text-sm text-[#6b6459]">
          This route isn't on-call right now. It may have moved, or the link's
          gone stale.
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Button
            nativeButton={false}
            className=" bg-orange-600 text-white hover:bg-orange-700"
            render={
              <Link className="flex" to={homePath}>
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            }
          ></Button>
        </div>
      </div>
    </div>
  );
}
