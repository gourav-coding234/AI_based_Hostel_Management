import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getDocument } from "../firebase/firestore";

/**
 * Loads the real student a Parent account is linked to, straight from
 * Firestore (`users/{linkedStudentId}` for identity + `students/{linkedStudentId}`
 * for room/bed). Every Parent dashboard page should use this instead of any
 * hardcoded child data — it's what makes "only see your own child" actually
 * true rather than just a UI label, since Firestore security rules (see
 * firestore.rules) enforce that a parent can only ever read documents whose
 * studentId matches this same linkedStudentId.
 *
 * Returns:
 *  - loading: still fetching
 *  - notLinked: this parent account has no linkedStudentId set yet (admin
 *    hasn't linked them to a student) — show a clear message, not empty data
 *  - error: the link points at an id that couldn't be read (deleted account,
 *    or a bad id from an old bulk import)
 *  - linkedStudentId, studentUser (name/email/hostelResidence), studentRecord
 *    (wing/room/bed/roommates)
 */
export function useLinkedStudent() {
  const { profile } = useAuth();
  const linkedStudentId = profile?.linkedStudentId || "";

  const [state, setState] = useState({
    loading: Boolean(linkedStudentId),
    studentUser: null,
    studentRecord: null,
    error: "",
  });

  useEffect(() => {
    let cancelled = false;

    if (!linkedStudentId) {
      setState({ loading: false, studentUser: null, studentRecord: null, error: "" });
      return undefined;
    }

    setState((s) => ({ ...s, loading: true, error: "" }));

    Promise.all([getDocument("users", linkedStudentId), getDocument("students", linkedStudentId)])
      .then(([studentUser, studentRecord]) => {
        if (cancelled) return;
        setState({
          loading: false,
          studentUser,
          studentRecord,
          error: studentUser ? "" : "This account isn't linked to a valid student. Contact the hostel office.",
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load linked student:", err);
        setState({ loading: false, studentUser: null, studentRecord: null, error: "Couldn't load your child's info. Please try again." });
      });

    return () => {
      cancelled = true;
    };
  }, [linkedStudentId]);

  return {
    linkedStudentId,
    notLinked: !linkedStudentId,
    ...state,
  };
}
