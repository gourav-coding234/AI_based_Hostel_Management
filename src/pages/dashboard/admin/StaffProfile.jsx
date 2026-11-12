import { useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { updateUserProfile } from "../../../firebase/firestore";
import { useProfilePhotoUpload } from "../../../hooks/useProfilePhotoUpload";
import { Card, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { CameraIcon } from "../../../components/dashboard/security/icons";

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

function initials(value) {
  return (value || "U").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function StaffProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState(() => profileForm(profile));
  const [saving, setSaving] = useState(false);
  const photoUpload = useProfilePhotoUpload(user, refreshProfile, (photoURL) => setForm((current) => ({ ...current, photoURL })), profile?.role);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileRef = useRef(null);

  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function choosePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setSuccess("");
    await photoUpload.upload(file);
  }

  async function save(event) {
    event.preventDefault();
    if (!user) return;
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await updateUserProfile(user.uid, form);
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
          <div className="flex items-center gap-4">
            <div className="relative">
              {form.photoURL ? <img src={form.photoURL} alt="Profile" className="h-20 w-20 rounded-full object-cover ring-4 ring-slate-100" /> : <span className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-50 font-display text-2xl font-semibold text-teal-700 ring-4 ring-slate-100">{initials(form.name || profile?.email)}</span>}
              <button type="button" onClick={() => fileRef.current?.click()} disabled={photoUpload.uploading} aria-label="Change profile photo" className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white shadow"><CameraIcon /></button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={choosePhoto} />
            </div>
            <div><p className="font-medium text-ink">{form.name || profile?.email}</p><p className="text-sm text-slate-500">{profile?.role} · {profile?.email}</p>{form.photoURL && <button type="button" onClick={photoUpload.remove} disabled={photoUpload.uploading} className="mt-1 text-xs text-rose-700 underline disabled:opacity-50">Remove photo</button>}{photoUpload.uploading && <p role="status" className="text-xs text-teal-700">{photoUpload.stage === "Uploading photo" ? `Uploading photo… ${photoUpload.progress}%` : `${photoUpload.stage}…`}</p>}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><input className={inputCls} name="name" value={form.name} onChange={updateField} required /></Field>
            <Field label="Phone"><input className={inputCls} name="phone" type="tel" value={form.phone} onChange={updateField} /></Field>
            <Field label="Date of birth"><input className={inputCls} name="dob" type="date" value={form.dob} onChange={updateField} /></Field>
            <Field label="Blood group"><input className={inputCls} name="bloodGroup" value={form.bloodGroup} onChange={updateField} /></Field>
            <Field label="Address"><input className={inputCls} name="address" value={form.address} onChange={updateField} /></Field>
          </div>
          {(error || photoUpload.error) && <p role="alert" className="text-sm text-rose-600">{error || photoUpload.error}</p>}
          {success && <p role="status" className="text-sm text-teal-700">{success}</p>}
          <Button type="submit" disabled={saving || photoUpload.uploading}>{saving ? "Saving..." : "Save profile"}</Button>
        </form>
      </Card>
    </div>
  );
}
