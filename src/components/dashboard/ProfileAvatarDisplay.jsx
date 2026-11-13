import ProfileAvatar from "./ProfileAvatar";

/** Read-only profile portrait; photo editing is disabled until reliable storage is available. */
export default function ProfileAvatarDisplay({ name, email, photoURL = "", className = "" }) {
  const label = String(name || email || "User").trim();
  const initials = label.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";

  return (
    <div className={`h-24 w-24 shrink-0 overflow-hidden rounded-full bg-teal-50 ring-4 ring-slate-100 ${className}`}>
      <ProfileAvatar
        src={photoURL}
        initials={initials}
        className="h-full w-full object-cover"
        fallbackClassName="flex h-full w-full items-center justify-center font-display text-2xl font-semibold text-teal-700"
      />
    </div>
  );
}
