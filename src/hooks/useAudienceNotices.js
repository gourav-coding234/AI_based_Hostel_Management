import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { readJsonResponse } from "../utils/readJsonResponse";

export function useAudienceNotices(enabled = true) {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: Boolean(enabled), data: [], error: "" });

  const reload = useCallback(async () => {
    if (!enabled || !user) {
      setState({ loading: false, data: [], error: "" });
      return;
    }
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/student/notices", { headers: { Authorization: `Bearer ${token}` } });
      const result = await readJsonResponse(response, "The notice service returned an invalid response.");
      if (!response.ok) throw new Error(result.message || `Notices could not be loaded (${response.status}).`);
      setState({ loading: false, data: Array.isArray(result.notices) ? result.notices : [], error: "" });
    } catch (error) {
      setState({ loading: false, data: [], error: error?.message || "Notices could not be loaded. Please try again." });
    }
  }, [enabled, user]);

  useEffect(() => { reload(); }, [reload]);
  return { ...state, isEmpty: !state.loading && !state.error && state.data.length === 0, reload };
}
