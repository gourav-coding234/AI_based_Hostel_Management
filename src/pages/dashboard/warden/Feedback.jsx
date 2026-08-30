import { useMemo, useState } from "react";
import { Card, Pill, ProgressBar, inputCls } from "../../../components/dashboard/student/ui";
import { SmileIcon, MehIcon, FrownIcon, SparkleIcon } from "../../../components/dashboard/warden/icons";
import { feedbackEntries } from "../../../data/wardenMock";

const sentimentFilters = ["All Sentiments", "Positive", "Neutral", "Negative"];

const sentimentTone = { Positive: "teal", Neutral: "amber", Negative: "rose" };
const sentimentIcon = { Positive: <SmileIcon />, Neutral: <MehIcon />, Negative: <FrownIcon /> };

export default function Feedback() {
  const [sentimentFilter, setSentimentFilter] = useState("All Sentiments");

  const counts = useMemo(() => {
    const base = { Positive: 0, Neutral: 0, Negative: 0 };
    feedbackEntries.forEach((f) => { base[f.sentiment] = (base[f.sentiment] ?? 0) + 1; });
    return base;
  }, []);

  const total = feedbackEntries.length;

  const filtered = useMemo(() => {
    if (sentimentFilter === "All Sentiments") return feedbackEntries;
    return feedbackEntries.filter((f) => f.sentiment === sentimentFilter);
  }, [sentimentFilter]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <SparkleIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">AI feedback analysis</p>
            <p className="text-sm text-slate-500">Feedback from students in your wings, automatically scored by sentiment.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {["Positive", "Neutral", "Negative"].map((s) => (
          <div key={s} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                s === "Positive" ? "bg-teal-500/10 text-teal-600" : s === "Neutral" ? "bg-amber-400/15 text-amber-600" : "bg-rose-500/10 text-rose-600"
              }`}>
                {sentimentIcon[s]}
              </span>
              <span className="font-display text-2xl font-semibold text-ink">{counts[s]}</span>
            </div>
            <p className="mt-4 text-sm font-medium text-ink">{s}</p>
            <div className="mt-2">
              <ProgressBar value={counts[s]} max={total} tone={sentimentTone[s]} />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">{Math.round((counts[s] / total) * 100)}% of all feedback</p>
          </div>
        ))}
      </div>

      <Card title="Feedback entries">
        <div className="mb-4">
          <select className={`${inputCls} sm:w-56`} value={sentimentFilter} onChange={(e) => setSentimentFilter(e.target.value)}>
            {sentimentFilters.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No feedback matches this filter.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {filtered.map((f) => (
              <li key={f.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{f.student}</p>
                    <span className="text-xs text-slate-400">· {f.wing} · {f.category}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{f.comment}</p>
                  <p className="mt-1 text-xs text-slate-300">{f.date}</p>
                </div>
                <Pill tone={f.sentiment === "Positive" ? "Resolved" : f.sentiment === "Negative" ? "Urgent" : "Normal"}>
                  {f.sentiment}
                </Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
