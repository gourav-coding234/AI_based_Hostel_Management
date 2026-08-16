import { useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { updateUserProfile } from "../../../firebase/firestore";
import { fileToResizedDataUrl } from "../../../utils/image";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { CameraIcon } from "../../../components/dashboard/security/icons";

function initials(name, email) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

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
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState(() => toFormState(profile));
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setUploadingPhoto(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file, { maxSize: 256, quality: 0.85 });
      set("photoURL", dataUrl);
    } catch (err) {
      setError(err.message || "Couldn't process that photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await updateUserProfile(user.uid, form);
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
    <div className="flex flex-col gap-6">
      <Card className="bg-navy-950 text-white">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="relative shrink-0">
            {form.photoURL ? (
              <img src={form.photoURL} alt="" className="h-20 w-20 rounded-full object-cover ring-4 ring-white/10" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/20 font-display text-2xl font-semibold text-teal-200 ring-4 ring-white/10">
                {initials(profile?.name, profile?.email)}
              </span>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-white shadow-md transition-colors hover:bg-teal-400 disabled:opacity-60"
              aria-label="Change photo"
            >
              <CameraIcon />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">{displayName}</h2>
            <p className="mt-0.5 text-sm text-slate-300">{profile?.email}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              {profile?.role && <Pill tone="General">{profile.role}</Pill>}
            </div>
          </div>
        </div>
        {uploadingPhoto && <p className="mt-3 text-xs text-teal-300">Processing photo…</p>}
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

          <Button type="submit" disabled={saving || uploadingPhoto} className="w-full sm:w-auto">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
