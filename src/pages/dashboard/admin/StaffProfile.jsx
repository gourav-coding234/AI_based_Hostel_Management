import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { updateUserProfile } from "../../../firebase/firestore";
import { useProfilePhotoUpload } from "../../../hooks/useProfilePhotoUpload";
import { Card, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import ProfilePhotoControl from "../../../components/dashboard/ProfilePhotoControl";

function profileForm(profile) {
  return {
    name: profile?.name || "",
    phone: profile?.phone || "",
    dob: profile?.dob || "",
    bloodGroup: profile?.bloodGroup || "",
    address: profile?.address || "",
    photoURL: profile?.photoURL || "",
  };
}

export default function StaffProfile() {
  const { user, profile, refreshProfile, setLocalProfilePhoto } = useAuth();
  const [form, setForm] = useState(() => profileForm(profile));
  const [saving, setSaving] = useState(false);
  const photoUpload = useProfilePhotoUpload(user, setLocalProfilePhoto, (photoURL) => setForm((current) => ({ ...current, photoURL })));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function save(event) {
    event.preventDefault();
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
    } catch (cause) {
      console.error("Failed to update profile:", cause);
      setError("Could not save your profile. Please try again.");
    } finally { setSaving(false); }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card title="My profile" subtitle="Update your personal details and profile photo.">
        <form onSubmit={save} className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-4">
            <ProfilePhotoControl photoURL={form.photoURL} name={form.name} email={profile?.email} upload={photoUpload.upload} remove={photoUpload.remove} uploading={photoUpload.uploading} progress={photoUpload.progress} stage={photoUpload.stage} error={photoUpload.error} />
            <div><p className="font-medium text-ink">{form.name || profile?.email}</p><p className="text-sm text-slate-500">{profile?.role} · {profile?.email}</p></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><input className={inputCls} name="name" value={form.name} onChange={updateField} required /></Field>
            <Field label="Phone"><input className={inputCls} name="phone" type="tel" value={form.phone} onChange={updateField} /></Field>
            <Field label="Date of birth"><input className={inputCls} name="dob" type="date" value={form.dob} onChange={updateField} /></Field>
            <Field label="Blood group"><input className={inputCls} name="bloodGroup" value={form.bloodGroup} onChange={updateField} /></Field>
            <Field label="Address"><input className={inputCls} name="address" value={form.address} onChange={updateField} /></Field>
          </div>
          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
          {success && <p role="status" className="text-sm text-teal-700">{success}</p>}
          <Button type="submit" disabled={saving || photoUpload.uploading}>{saving ? "Saving..." : "Save profile"}</Button>
        </form>
      </Card>
    </div>
  );
}
