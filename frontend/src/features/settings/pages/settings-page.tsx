import { ProfileForm } from "../components/ProfileForm";

const fakeUser = {
  email: "test@example.com",
  firstName: "John",
  lastName: "Doe",
  timezone: "",
  speciality: "frontend",
};

export default function SettingPage() {
  return (
    <div>
      <div className="bg-white flex items-center gap-2 px-4 py-3 border-b">
        <h1 className="font-medium text-sm">Settings</h1>
      </div>

      <div className="w-full space-y-6 p-6">
        <ProfileForm user={fakeUser} />
      </div>
    </div>
  );
}
