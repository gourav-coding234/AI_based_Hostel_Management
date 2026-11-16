import { useCallback, useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { getDocument } from "../firebase/firestore";
import { readJsonResponse } from "../utils/readJsonResponse";
import { hostelForNoticeProfile, noticeQueryTargets } from "../utils/notices";

function millis(value) {
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (typeof value === "string") return Date.parse(value) || 0;
  return 0;
}

/**
 * Backup path used when the notices API is unavailable (for example the
 * server's Firebase Admin credentials are misconfigured). Firestore rules
 * already let a student/parent read the notices addressed to their hostel,
 * so the same list can be read directly from the browser.
 */
async function loadNoticesDirectly(profile) {
  let hostelProfile = profile || {};
  if (profile?.role === "Parent") {
    const linkedId = profile.linkedStudentId;
    if (!linkedId) throw new Error("Your parent account is not linked to a student yet. Contact the hostel office.");
    hostelProfile = (await getDocument("students", linkedId)) || {};
  }
  const targets = noticeQueryTargets(hostelProfile);
  if (!hostelForNoticeProfile(hostelProfile)) {
    // Without a hostel only institute-wide notices are safe to show.
    targets.splice(0, targets.length, "Both", "Both Hostels", "All Hostels");
  }
  const snapshot = await getDocs(query(collection(db, "notices"), where("target", "in", targets)));
  return snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }))
    .sort((a, b) => millis(b.date) - millis(a.date) || millis(b.createdAt) - millis(a.createdAt));
}

export function useAudienceNotices(enabled = true) {
  const { user, profile } = useAuth();
  const [state, setState] = useState({ loading: Boolean(enabled), data: [], error: "" });

  const reload = useCallback(async () => {
    if (!enabled || !user) {
      setState({ loading: false, data: [], error: "" });
      return;
    }
    setState((current) => ({ ...current, loading: true, error: "" }));
    let apiMessage = "";
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/student/notices", { headers: { Authorization: `Bearer ${token}` } });
      const result = await readJsonResponse(response, "The notice service returned an invalid response.");
      if (response.ok) {
        setState({ loading: false, data: Array.isArray(result.notices) ? result.notices : [], error: "" });
        return;
      }
      apiMessage = result.message || `Notices could not be loaded (${response.status}).`;
      // Auth/validation problems (4xx) are real answers; only fall back when the server itself is broken.
      if (response.status >= 400 && response.status < 500) throw new Error(apiMessage);
    } catch (error) {
      if (!apiMessage) apiMessage = error?.message || "Notices could not be loaded.";
      else if (error?.message === apiMessage) {
        setState({ loading: false, data: [], error: apiMessage });
        return;
      }
    }
    try {
      const data = await loadNoticesDirectly(profile);
      setState({ loading: false, data, error: "" });
    } catch (fallbackError) {
      console.error("Direct notice read failed after API error:", apiMessage, fallbackError);
      setState({ loading: false, data: [], error: apiMessage || fallbackError?.message || "Notices could not be loaded. Please try again." });
    }
  }, [enabled, user, profile]);

  useEffect(() => { reload(); }, [reload]);
  return { ...state, isEmpty: !state.loading && !state.error && state.data.length === 0, reload };
}
