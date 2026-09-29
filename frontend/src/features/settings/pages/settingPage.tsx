import { ProfileForm } from "../components/ProfileForm";
import { useUserSettings } from "../hooks/useUserSettings";

export default function SettingsPage() {
  const { data: user, isLoading, isError } = useUserSettings();
  if (isLoading) return <p>Loading...</p>;
  if (isError || !user) return <p>Couldn't load your profile.</p>;
  return (
    <div>
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
        <h1 className="font-medium text-sm">Settings</h1>
      </div>

      <div className="w-full space-y-6 p-6">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
