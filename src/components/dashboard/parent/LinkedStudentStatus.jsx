import { Button, EmptyState } from "../student/ui";
import { UserIcon } from "./icons";

/**
 * Renders the right placeholder for a Parent page when there's no usable
 * linked-student data yet (not linked / still loading / link is broken).
 * Returns null when none of those apply, so a page can do:
 *
 *   const linked = useLinkedStudent();
 *   const status = <LinkedStudentStatus {...linked} />;
 *   if (status) return status;
 *   // ...render real content using linked.studentUser / linked.studentRecord
 */
export default function LinkedStudentStatus({ loading, notLinked, notFound, error, refresh }) {
  if (loading) {
    return <p className="py-10 text-center text-sm text-slate-400">Loading your child's info…</p>;
  }
  if (notLinked) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <EmptyState icon={<UserIcon />} title="Your account isn't linked to a student yet" description="Contact the hostel office. They'll link your account to your child's student record." />
        {refresh && <Button variant="outline" onClick={refresh}>Refresh link</Button>}
      </div>
    );
  }
  if (notFound) {
    return <div className="flex flex-col items-center gap-3 py-8"><EmptyState icon={<UserIcon />} title="Linked student profile unavailable" description={error || "Your linked child has no room profile yet. Ask the hostel office to repair the link."} />{refresh && <Button variant="outline" onClick={refresh}>Refresh student link</Button>}</div>;
  }
  if (error) {
    return <div className="flex flex-col items-center gap-3 py-8"><EmptyState icon={<UserIcon />} title="Couldn't load your child's info" description={error} />{refresh && <Button variant="outline" onClick={refresh}>Retry</Button>}</div>;
  }
  return null;
}
