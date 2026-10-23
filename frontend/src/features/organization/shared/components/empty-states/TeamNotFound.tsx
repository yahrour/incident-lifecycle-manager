import { Link } from "react-router";

export function TeamNotFound() {
  return (
    <div>
      <div className="bg-card flex items-center gap-2 px-4 py-3 border-b">
        <Link to="/manager/teams" className="font-medium text-sm">
          Teams
        </Link>
      </div>
      <div className="h-32 mt-2 p-4 space-y-4 flex justify-center items-center">
        <h1>team doesn't exist</h1>
      </div>
    </div>
  );
}
