import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { updateUserProfile } from "../../../firebase/firestore";
import { useProfilePhotoUpload } from "../../../hooks/useProfilePhotoUpload";
import { Card, Pill, Button, Field, inputCls } from "../../../components/dashboard/student/ui";
import ProfilePhotoControl from "../../../components/dashboard/ProfilePhotoControl";
import { useLinkedStudent } from "../../../hooks/useLinkedStudent";

function toFormState(profile) {
  return {
    name: profile?.name ?? "",
    phone: profile?.phone ?? "",
    address: profile?.address ?? "",
    relationToStudent: profile?.relationToStudent ?? "",
    photoURL: profile?.photoURL ?? "",
  };
}

export default function ParentProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const { studentUser, studentRecord, notLinked, loading: linkLoading, error: linkError } = useLinkedStudent();
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

  const displayName = profile?.name || user?.email?.split("@")[0] || "Parent";

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card className="relative overflow-hidden bg-navy-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl"
        />
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <ProfilePhotoControl photoURL={form.photoURL} name={profile?.name} email={profile?.email} upload={photoUpload.upload} remove={photoUpload.remove} uploading={photoUpload.uploading} progress={photoUpload.progress} stage={photoUpload.stage} error={photoUpload.error} />
          <div>
            <h2 className="font-display text-xl font-semibold">{displayName}</h2>
            <p className="mt-0.5 text-sm text-slate-300">{profile?.email}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              {profile?.role && <Pill tone="General">{profile.role}</Pill>}
              {studentUser?.name && <Pill tone="Normal">Parent of {studentUser.name}</Pill>}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Edit your profile">
        <p className="-mt-2 mb-4 text-sm text-slate-500">
          Only you can see and change these details. Your email and which student you're linked to are managed by the admin office.
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

          <Field label="Relation to student">
            <select value={form.relationToStudent} onChange={(e) => set("relationToStudent", e.target.value)} className={inputCls}>
              <option value="">Select…</option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Guardian">Guardian</option>
              <option value="Other">Other</option>
            </select>
          </Field>

          <Field label="Home address">
            <textarea
              rows={2}
              placeholder="Your address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
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

      <Card title="Linked student">
        {linkLoading ? (
          <p className="text-sm text-slate-400">Loading your child's info…</p>
        ) : notLinked ? (
          <p className="text-sm text-slate-500">
            Your account isn't linked to a student yet. Contact the hostel office.
          </p>
        ) : linkError ? (
          <p className="text-sm text-slate-500">{linkError}</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Name</p>
                <p className="mt-1 text-sm text-ink">{studentUser?.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</p>
                <p className="mt-1 text-sm text-ink">{studentUser?.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Room</p>
                <p className="mt-1 text-sm text-ink">
                  {studentRecord?.room ? `${studentRecord.room}${studentRecord.wing ? `, ${studentRecord.wing}` : ""}` : "Not yet allotted"}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Your account is linked to this student by the admin office. Contact them if this looks wrong.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
