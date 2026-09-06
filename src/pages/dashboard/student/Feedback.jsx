import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Card, Button, Field, inputCls, EmptyState } from "../../../components/dashboard/student/ui";
import { MegaphoneIcon } from "../../../components/dashboard/student/icons";
import { useStudentCollection } from "../../../hooks/useStudentCollection";
import { addDocument } from "../../../firebase/firestore";

const POSITIVE_WORDS = ["good", "great", "excellent", "happy", "love", "helpful", "clean", "nice", "amazing", "thank"];
const NEGATIVE_WORDS = ["bad", "poor", "terrible", "worst", "unhappy", "dirty", "broken", "slow", "rude", "problem", "issue"];

/**
 * Basic keyword-count heuristic — NOT a language model. Counts a fixed
 * word list against the message and picks whichever side has more hits;
 * ties (including zero hits either way) default to Neutral. Good enough to
 * bucket feedback for the admin/warden dashboards without pretending this
 * is real sentiment analysis.
 */
function guessSentiment(text) {
  const lower = text.toLowerCase();
  const score = POSITIVE_WORDS.reduce((s, w) => s + (lower.includes(w) ? 1 : 0), 0) -
    NEGATIVE_WORDS.reduce((s, w) => s + (lower.includes(w) ? 1 : 0), 0);
  if (score > 0) return "Positive";
  if (score < 0) return "Negative";
  return "Neutral";
}

export default function Feedback() {
  const { user, profile } = useAuth();
  const studentId = user?.uid || "";
  const myFeedback = useStudentCollection("feedback", studentId, { orderByField: "date" });

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submitFeedback(e) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await addDocument(
        "feedback",
        {
          studentId,
          studentName: profile?.name || user?.email,
          subject,
          message,
          sentiment: guessSentiment(message),
          date: new Date().toISOString().slice(0, 10),
        },
        studentId
      );
      setSubject("");
      setMessage("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      setError("Couldn't submit your feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Share feedback">
          <form onSubmit={submitFeedback} className="flex flex-col gap-4">
            <Field label="Subject">
              <input
                className={inputCls}
                placeholder="What's this about?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Field>
            <Field label="Message">
              <textarea
                className={`${inputCls} min-h-[110px] resize-none`}
                placeholder="Tell the hostel office what's working well or what could be better…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Field>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            {submitted && <p className="text-sm text-teal-600">Thanks — your feedback has been submitted.</p>}
            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Submitting…" : "Submit feedback"}
            </Button>
          </form>
        </Card>

        <Card title="Your feedback history">
          {myFeedback.loading ? (
            <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
          ) : myFeedback.items.length === 0 ? (
            <EmptyState icon={<MegaphoneIcon />} title="No feedback submitted yet" description="Anything you send will show up here." />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {myFeedback.items.map((f) => (
                <li key={f.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-ink">{f.subject}</p>
                  <p className="text-sm text-slate-500">{f.message}</p>
                  <p className="text-xs text-slate-300">{f.date}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
