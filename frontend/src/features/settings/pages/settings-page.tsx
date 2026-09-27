import { ProfileForm } from "../components/ProfileForm";

const fakeUser = {
  email: "test@example.com",
  firstName: "John",
  lastName: "Doe",
  timezone: "",
};

export default function SettingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <ProfileForm user={fakeUser} />
    </div>
  );
}
