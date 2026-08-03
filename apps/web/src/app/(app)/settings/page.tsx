import { ChangePasswordForm } from "@/components/settings/change-password-form";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account.</p>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
