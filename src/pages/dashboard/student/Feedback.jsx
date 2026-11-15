import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Button, Field, inputCls, EmptyState } from "../../../components/dashboard/student/ui";
import { MegaphoneIcon } from "../../../components/dashboard/student/icons";
import { LoadingState, ErrorState } from "../../../components/ui/DataState";

const CATEGORIES = ["Food/Mess", "Cleanliness", "Maintenance", "Security", "Warden/Staff", "Facilities", "Other"];
const API_URL = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/student/feedback`;

export default function Feedback() {
  const { user } = useAuth();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadHistory = useCallback(async () => {
    if (!user) { setLoading(false); setLoadError("Sign in to view your feedback."); return; }
    setLoading(true); setLoadError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || `Request failed (${response.status}).`);
      setRecords(Array.isArray(body.records) ? body.records : []);
    } catch (err) { setLoadError(err.message || "Feedback history could not be loaded."); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function submitFeedback(event) {
    event.preventDefault(); setError(""); setSuccess("");
    const trimmed = comment.trim();
    if (!trimmed || trimmed.length < 5 || trimmed.length > 1000) { setError("Comment must be between 5 and 1,000 characters."); return; }
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category, rating, comment: trimmed, anonymous }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || `Request failed (${response.status}).`);
      setComment(""); setSuccess("Thanks — your feedback has been submitted.");
      await loadHistory();
    } catch (err) { setError(err.message || "Feedback could not be saved. Please try again."); }
    finally { setSubmitting(false); }
  }

  return <div className="flex flex-col gap-6 animate-fade-in">
    <Card title="Share feedback">
      <form onSubmit={submitFeedback} className="flex flex-col gap-4">
        <Field label="Category"><select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Rating"><select className={inputCls} value={rating} onChange={(e) => setRating(Number(e.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? "" : "s"}</option>)}</select></Field>
        <Field label="Comment"><textarea required minLength={5} maxLength={1000} className={`${inputCls} min-h-[120px] resize-y`} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share what is working well or what should improve…" /><span className="text-xs text-slate-400">{comment.length}/1,000</span></Field>
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Submit anonymously</label>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        {success && <p role="status" className="text-sm text-teal-700">{success}</p>}
        <Button type="submit" disabled={submitting} className="self-start">{submitting ? "Submitting…" : "Submit feedback"}</Button>
      </form>
    </Card>
    <Card title="Your feedback history">
      {loading ? <LoadingState label="Loading your feedback…" /> : loadError ? <ErrorState message={loadError} onRetry={loadHistory} /> : records.length === 0 ? <EmptyState icon={<MegaphoneIcon />} title="No feedback submitted yet" description="Your submitted feedback will appear here." /> : (
        <ul className="flex flex-col divide-y divide-slate-100">{records.map((item) => <li key={item.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0"><p className="text-sm font-medium text-ink">{item.category || item.subject} · {item.rating ? `${item.rating}/5` : ""}</p><p className="text-sm text-slate-500">{item.comment || item.message}</p><p className="text-xs text-slate-400">{item.date} · {item.status || "Submitted"}</p></li>)}</ul>
      )}
    </Card>
  </div>;
}
