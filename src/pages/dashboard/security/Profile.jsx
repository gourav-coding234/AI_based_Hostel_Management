import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { updateUserProfile } from "../../../firebase/firestore";
import { useProfilePhotoUpload } from "../../../hooks/useProfilePhotoUpload";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import ProfilePhotoControl from "../../../components/dashboard/ProfilePhotoControl";

function toFormState(profile) {
  return {
    name: profile?.name ?? "",
    phone: profile?.phone ?? "",
    gateAssigned: profile?.gateAssigned ?? "",
    shift: profile?.shift ?? "",
    photoURL: profile?.photoURL ?? "",
  };
}

export default function SecurityProfile() {
  const { user, profile, refreshProfile, setLocalProfilePhoto } = useAuth();
  const [form, setForm] = useState(() => toFormState(profile));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  const photoUpload = useProfilePhotoUpload(user, setLocalProfilePhoto, (photoURL) => set("photoURL", photoURL));

  async function handleSave(e) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const profileFields = { ...form };
      delete profileFields.photoURL;
      await updateUserProfile(user.uid, profileFields);
      await refreshProfile();
      setSuccess("Profile updated.");
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const displayName = profile?.name || user?.email?.split("@")[0] || "Security";

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card className="relative overflow-hidden bg-navy-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <ProfilePhotoControl photoURL={profile?.photoURL || form.photoURL} name={profile?.name} email={profile?.email} upload={photoUpload.upload} remove={photoUpload.remove} uploading={photoUpload.uploading} progress={photoUpload.progress} stage={photoUpload.stage} error={photoUpload.error} />
          <div>
            <h2 className="font-display text-xl font-semibold">{displayName}</h2>
            <p className="mt-0.5 text-sm text-slate-300">{profile?.email}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              {profile?.role && <Pill tone="General">{profile.role}</Pill>}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Edit your profile">
        <p className="-mt-2 mb-4 text-sm text-slate-500">
          Only you can see and change these details. Your email is managed by the admin office.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input type="text" required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Phone number">
              <input type="tel" placeholder="e.g. 98765 43210" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Gate usually assigned">
              <select value={form.gateAssigned} onChange={(e) => set("gateAssigned", e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                <option value="Main Gate">Main Gate</option>
                <option value="Back Gate">Back Gate</option>
              </select>
            </Field>
            <Field label="Usual shift">
              <select value={form.shift} onChange={(e) => set("shift", e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                <option value="Morning (6 AM – 2 PM)">Morning (6 AM – 2 PM)</option>
                <option value="Afternoon (2 PM – 10 PM)">Afternoon (2 PM – 10 PM)</option>
                <option value="Night (10 PM – 6 AM)">Night (10 PM – 6 AM)</option>
              </select>
            </Field>
          </div>

          {error && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p>}
          {success && <p className="rounded-xl bg-teal-500/10 px-4 py-2.5 text-sm text-teal-700">{success}</p>}

          <Button type="submit" disabled={saving || photoUpload.uploading} className="w-full sm:w-auto">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
