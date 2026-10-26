import { ProfileForm } from "../components/profile/ProfileForm";
import { Spinner } from "@/components/ui/spinner";
import { useUserSettings } from "../hooks/useUserSettings";
import { CircleAlert } from "lucide-react";
import { TeamsSettings } from "../components/teams/TeamsSettings";
import { Page } from "@/components/Page";

export default function SettingsPage() {
  const { data: user, isLoading, isError } = useUserSettings();
  if (isLoading) {
    return (
      <div className="flex min-h-75 items-center justify-center">
        <Spinner className="size-5" />
      </div>
    );
  }
  if (isError || !user) {
    return (
      <div className="flex min-h-75 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
          <CircleAlert className="mx-auto size-10 text-destructive" />

          <h2 className="mt-4 font-medium">Couldn't load your profile</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Something went wrong while loading your settings. Please try again
            later.
          </p>
        </div>
      </div>
    );
  }
  return (
    <Page header={<h1 className="font-medium text-sm">Settings</h1>}>
      <ProfileForm user={user} />
      {user.role === "SRE" && <TeamsSettings />}
    </Page>
  );
}
