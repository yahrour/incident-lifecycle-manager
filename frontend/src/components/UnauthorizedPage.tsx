import { Link } from "react-router";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center text-center">
        <span className="text-xs font-semibold tracking-widest text-[#a39a8b]">
          ERROR 401
        </span>
        <h1 className="mt-2 text-3xl font-bold text-[#2a2521]">Hold Up!</h1>
        <p className="mt-3 max-w-sm text-sm text-[#6b6459]">
          You need to be signed in to access this page.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button
            nativeButton={false}
            className=" bg-orange-600 text-white hover:bg-orange-700"
            render={
              <Link className="flex" to="/login">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            }
          ></Button>
        </div>
      </div>
    </div>
  );
}
