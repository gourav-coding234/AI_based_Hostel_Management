import { EmptyState } from "../student/ui";
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
export default function LinkedStudentStatus({ loading, notLinked, error }) {
  if (loading) {
    return <p className="py-10 text-center text-sm text-slate-400">Loading your child's info…</p>;
  }
  if (notLinked) {
    return (
      <EmptyState
        icon={<UserIcon />}
        title="Your account isn't linked to a student yet"
        description="Contact the hostel office — they'll link your account to your child's student record."
      />
    );
  }
  if (error) {
    return <EmptyState icon={<UserIcon />} title="Couldn't load your child's info" description={error} />;
  }
  return null;
}
