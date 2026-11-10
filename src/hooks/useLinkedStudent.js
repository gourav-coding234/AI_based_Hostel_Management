import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getDocument } from "../firebase/firestore";
import { DEMO_STUDENT_ID, getDemoDocument, isDemoMode } from "../data/demoFixtures";
import { readErrorMessage } from "../firebase/readErrorMessage";
import { publishReadStatus } from "../firebase/readStatusEvents";

/**
 * Loads the real student a Parent account is linked to, straight from
 * Firestore. Every Parent dashboard page should use this instead of any
 * hardcoded child data — it's what makes "only see your own child" actually
 * true rather than just a UI label, since Firestore security rules (see
 * firestore.rules) enforce that a parent can only ever read documents whose
 * studentId matches this same linkedStudentId.
 *
 * Reads ONLY `students/{linkedStudentId}` — the one document the rules let a
 * linked parent read. Parents have no read access to `users/{studentId}`
 * (deliberately, see firestore.rules), so `studentUser` is derived from the
 * Student Directory record rather than the users collection.
 *
 * Returns:
 *  - loading: still fetching
 *  - notLinked: this parent account has no linkedStudentId set yet (admin
 *    hasn't linked them to a student) — show a clear message, not empty data
 *  - notFound: linkedStudentId is set but there is no student record for it
 *    (deleted account, or a bad id from an old bulk import)
 *  - error: a message for either notFound or a Firestore read failure
 *  - linkedStudentId, studentUser ({ id, name, email, hostelResidence } —
 *    identity fields from the directory record, "" when absent), studentRecord
 *    (wing/room/bed/roommates)
 */
export function useLinkedStudent() {
  const { profile } = useAuth();
  const linkedStudentId = profile?.linkedStudentId || "";

  const [state, setState] = useState({
    loading: Boolean(linkedStudentId),
    studentUser: null,
    studentRecord: null,
    notFound: false,
    error: "",
  });

  useEffect(() => {
    let cancelled = false;

    if (isDemoMode()) {
      const studentRecord = getDemoDocument("students", DEMO_STUDENT_ID);
      setState({
        loading: false,
        studentUser: { id: DEMO_STUDENT_ID, name: studentRecord.name, email: "student1@demo.hostel.test", hostelResidence: studentRecord.hostelResidence },
        studentRecord,
        notFound: false,
        error: "",
      });
      return undefined;
    }

    if (!linkedStudentId) {
      setState({ loading: false, studentUser: null, studentRecord: null, notFound: false, error: "" });
      return undefined;
    }

    setState((s) => ({ ...s, loading: true, error: "", notFound: false }));

    const statusKey = `linked-student:${linkedStudentId}`;
    getDocument("students", linkedStudentId)
      .then((studentRecord) => {
        if (cancelled) return;
        publishReadStatus(statusKey, "", "students (parent link)");
        if (!studentRecord) {
          setState({
            loading: false,
            studentUser: null,
            studentRecord: null,
            notFound: true,
            error: "We couldn't find the student record your account is linked to. Contact the hostel office.",
          });
          return;
        }
        setState({
          loading: false,
          studentUser: {
            id: linkedStudentId,
            name: studentRecord.name || "",
            email: studentRecord.email || "",
            hostelResidence: studentRecord.hostelResidence || studentRecord.wing || "",
          },
          studentRecord,
          notFound: false,
          error: "",
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load linked student:", err);
        const message = readErrorMessage(err, "Couldn't load your child's info. Please try again.");
        publishReadStatus(statusKey, message, "students (parent link)");
        setState({
          loading: false,
          studentUser: null,
          studentRecord: null,
          notFound: false,
          error: message,
        });
      });

    return () => {
      cancelled = true;
      publishReadStatus(`linked-student:${linkedStudentId}`);
    };
  }, [linkedStudentId]);

  return {
    linkedStudentId,
    notLinked: !linkedStudentId,
    ...state,
  };
}
