import { useMemo, useState } from "react";
import { Card, Pill, ProgressBar, inputCls } from "../../../components/dashboard/student/ui";
import { EmptyState } from "../../../components/ui/DataState";
import DataTable from "../../../components/ui/DataTable";
import { SmileIcon, MehIcon, FrownIcon, SparkleIcon } from "../../../components/dashboard/admin/icons";
import { useCollection } from "../../../hooks/useCollection";

const sentimentFilters = ["All Sentiments", "Positive", "Neutral", "Negative"];
const sentimentTone = { Positive: "teal", Neutral: "amber", Negative: "rose" };
const sentimentIcon = { Positive: <SmileIcon />, Neutral: <MehIcon />, Negative: <FrownIcon /> };

export default function Feedback() {
  const feedbackQuery = useCollection("feedback", { orderByField: "date" });
  const feedbackEntries = feedbackQuery.data;
  const [sentimentFilter, setSentimentFilter] = useState("All Sentiments");

  const counts = useMemo(() => {
    const base = { Positive: 0, Neutral: 0, Negative: 0 };
    feedbackEntries.forEach((f) => { base[f.sentiment] = (base[f.sentiment] ?? 0) + 1; });
    return base;
  }, [feedbackEntries]);

  const total = feedbackEntries.length;

  const filtered = useMemo(() => {
    if (sentimentFilter === "All Sentiments") return feedbackEntries;
    return feedbackEntries.filter((f) => f.sentiment === sentimentFilter);
  }, [feedbackEntries, sentimentFilter]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <SparkleIcon />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">Feedback overview</p>
            <p className="text-sm text-slate-500">Student feedback submitted institute-wide.</p>
          </div>
        </div>
      </Card>

      {total === 0 ? (
        <Card>
          <EmptyState icon={<SparkleIcon />} title="No feedback submitted yet" description="Feedback from students will show up here, broken down by sentiment." />
        </Card>
      ) : (
        <>
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

            <DataTable
              columns={[
                {
                  key: "studentName",
                  label: "Student",
                  sortable: true,
                  render: (f) => (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-ink">{f.studentName || "Anonymous"}</span>
                        <span className="text-xs text-slate-400">· {f.subject}</span>
                      </div>
                      <p className="text-sm text-slate-600">{f.message}</p>
                    </>
                  ),
                },
                { key: "date", label: "Date", sortable: true },
                {
                  key: "sentiment",
                  label: "Sentiment",
                  render: (f) =>
                    f.sentiment ? (
                      <Pill tone={f.sentiment === "Positive" ? "Resolved" : f.sentiment === "Negative" ? "Urgent" : "Normal"}>
                        {f.sentiment}
                      </Pill>
                    ) : (
                      "—"
                    ),
                },
              ]}
              rows={filtered}
              searchable={false}
              emptyTitle="No feedback matches this filter"
              pageSize={10}
            />
          </Card>
        </>
      )}
    </div>
  );
}
