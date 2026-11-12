import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { updateUserProfile } from "../../../firebase/firestore";
import { useProfilePhotoUpload } from "../../../hooks/useProfilePhotoUpload";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import { UserIcon } from "../../../components/dashboard/student/icons";
import ProfilePhotoControl from "../../../components/dashboard/ProfilePhotoControl";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function toFormState(profile) {
  return {
    name: profile?.name ?? "",
    dob: profile?.dob ?? "",
    phone: profile?.phone ?? "",
    bloodGroup: profile?.bloodGroup ?? "",
    address: profile?.address ?? "",
    emergencyContactName: profile?.emergencyContactName ?? "",
    emergencyContactPhone: profile?.emergencyContactPhone ?? "",
    bio: profile?.bio ?? "",
    photoURL: profile?.photoURL ?? "",
  };
}

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState(() => toFormState(profile));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  const photoUpload = useProfilePhotoUpload(user, refreshProfile, (photoURL) => set("photoURL", photoURL), profile?.role);

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

  const displayName = profile?.name || user?.email?.split("@")[0] || "Student";
  const memberSince = profile?.createdAt?.toDate
    ? profile.createdAt.toDate().toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card className="relative overflow-hidden bg-navy-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <ProfilePhotoControl photoURL={form.photoURL} name={profile?.name} email={profile?.email} upload={photoUpload.upload} remove={photoUpload.remove} uploading={photoUpload.uploading} progress={photoUpload.progress} stage={photoUpload.stage} error={photoUpload.error} />
          <div>
            <h2 className="font-display text-xl font-semibold">{displayName}</h2>
            <p className="mt-0.5 text-sm text-slate-300">{profile?.email}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              {profile?.role && <Pill tone="General">{profile.role}</Pill>}
              {profile?.hostelResidence && <Pill tone="Normal">{profile.hostelResidence}</Pill>}
              {memberSince && <span className="text-xs text-slate-400">Member since {memberSince}</span>}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Edit your profile">
        <p className="-mt-2 mb-4 text-sm text-slate-500">
          Only you can see and change these details. Your email, role and hostel block are managed by the warden/admin office.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Date of birth">
              <input
                type="date"
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone number">
              <input
                type="tel"
                placeholder="e.g. 98765 43210"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Blood group">
              <select value={form.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Home address">
            <textarea
              rows={2}
              placeholder="Permanent / home address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Emergency contact name">
              <input
                type="text"
                placeholder="Parent / guardian name"
                value={form.emergencyContactName}
                onChange={(e) => set("emergencyContactName", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Emergency contact phone">
              <input
                type="tel"
                placeholder="Their phone number"
                value={form.emergencyContactPhone}
                onChange={(e) => set("emergencyContactPhone", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="About (optional)">
            <textarea
              rows={3}
              placeholder="Anything you'd like to add — hobbies, interests, etc."
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {error && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p>}
          {success && <p className="rounded-xl bg-teal-500/10 px-4 py-2.5 text-sm text-teal-700">{success}</p>}

          <Button type="submit" disabled={saving || photoUpload.uploading} className="w-full sm:w-auto">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Card>

      <Card title="Account details">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</p>
            <p className="mt-1 text-sm text-ink">{profile?.email || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Role</p>
            <p className="mt-1 text-sm text-ink">{profile?.role || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hostel block</p>
            <p className="mt-1 text-sm text-ink">{profile?.hostelResidence || "Not assigned yet"}</p>
          </div>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <UserIcon /> These are set by the admin/warden office. Contact them if anything here looks wrong.
        </p>
      </Card>
    </div>
  );
}
