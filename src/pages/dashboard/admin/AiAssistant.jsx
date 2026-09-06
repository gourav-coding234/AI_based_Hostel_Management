import { useState } from "react";
import { Card, Button, inputCls } from "../../../components/dashboard/student/ui";
import { SparkleIcon, ChatIcon, SendIcon, SearchIcon } from "../../../components/dashboard/admin/icons";
import { useCollections } from "../../../hooks/useCollection";

// ---------------------------------------------------------------------------
// This is a keyword-matched Q&A over LIVE Firestore data (blocks, complaints,
// fees) — not a real language model, and not canned demo replies. It only
// ever reports numbers pulled from the real collections passed in as props.
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  "How many beds are vacant in each block?",
  "Find students with pending complaints",
  "List unpaid hostel fees",
];

const FALLBACK_REPLY =
  "I can currently answer questions about bed vacancy, open complaints, and unpaid fees — try one of the suggested questions, or check the relevant dashboard page for anything else.";

function craftReply(question, { blocks, complaints, fees }) {
  const q = question.toLowerCase();

  if (q.includes("vacant") || q.includes("available room") || q.includes("empty bed")) {
    if (blocks.length === 0) return "No blocks have been added yet, so I don't have occupancy data to report.";
    const totalVacant = blocks.reduce((sum, b) => sum + Math.max((b.totalBeds || 0) - (b.occupiedBeds || 0), 0), 0);
    const byBlock = blocks.map((b) => `${Math.max((b.totalBeds || 0) - (b.occupiedBeds || 0), 0)} in ${b.name}`).join(", ");
    return `Across all blocks there are ${totalVacant} vacant beds right now — ${byBlock}.`;
  }
  if (q.includes("pending complaint") || q.includes("open complaint")) {
    const open = complaints.filter((c) => c.status !== "Resolved");
    if (open.length === 0) return "There are no open complaints right now.";
    const oldest = open[0];
    return `There are ${open.length} open complaint${open.length === 1 ? "" : "s"} institute-wide, including "${oldest.title}" (${oldest.block || "—"}, filed ${oldest.date}).`;
  }
  if (q.includes("unpaid") || q.includes("due") || q.includes("fee")) {
    const outstanding = fees.reduce((sum, f) => sum + Math.max((Number(f.total) || 0) - (Number(f.paid) || 0), 0), 0);
    if (outstanding === 0) return "There are no outstanding fee balances recorded right now.";
    const top = [...fees].sort((a, b) => (b.total - b.paid) - (a.total - a.paid))[0];
    return `Total outstanding fees across the institute are ₹${outstanding.toLocaleString("en-IN")}. Top balance: ${top.studentName}, ₹${((top.total || 0) - (top.paid || 0)).toLocaleString("en-IN")} due.`;
  }
  return FALLBACK_REPLY;
}

function runSmartSearch(query, { blocks, complaints, fees }) {
  const q = query.toLowerCase();

  if (q.includes("vacant") || q.includes("available room")) {
    return {
      label: "Vacant rooms by block",
      rows: blocks.map((b) => ({
        cols: [b.name, `${Math.max((b.totalBeds || 0) - (b.occupiedBeds || 0), 0)} vacant beds`, `${b.totalBeds || 0} total`],
      })),
      headers: ["Block", "Vacant", "Capacity"],
    };
  }
  if (q.includes("complaint")) {
    const pending = complaints.filter((c) => c.status !== "Resolved");
    return {
      label: "Students with pending complaints",
      rows: pending.map((c) => ({ cols: [c.studentName, c.block || "—", c.title, c.status] })),
      headers: ["Student", "Block", "Complaint", "Status"],
    };
  }
  if (q.includes("fee") || q.includes("unpaid") || q.includes("due")) {
    const defaulters = fees
      .map((f) => ({ ...f, due: (Number(f.total) || 0) - (Number(f.paid) || 0) }))
      .filter((f) => f.due > 0)
      .sort((a, b) => b.due - a.due);
    return {
      label: "Unpaid hostel fees",
      rows: defaulters.map((f) => ({ cols: [f.studentName, f.block || "—", `₹${f.due.toLocaleString("en-IN")}`, f.dueDate || "—"] })),
      headers: ["Student", "Block", "Due", "Due date"],
    };
  }
  return null;
}

function AssistantPanel({ liveData }) {
  const [messages, setMessages] = useState([
    { from: "ai", text: "Hi! I'm the hostel assistant. Ask me about bed vacancy, open complaints, or unpaid fees — I answer from the live database." },
  ]);
  const [input, setInput] = useState("");

  function send(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const reply = craftReply(trimmed, liveData);
    setMessages((m) => [...m, { from: "admin", text: trimmed }, { from: "ai", text: reply }]);
    setInput("");
  }

  return (
    <Card title="Chat with the assistant">
      <div className="flex h-[420px] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === "admin" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.from === "admin" ? "bg-navy-950 text-white" : "bg-slate-100 text-ink"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-teal-300 hover:text-teal-700"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mt-3 flex gap-2"
        >
          <input
            className={inputCls}
            placeholder="Ask about occupancy, complaints, fees, rules…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" className="shrink-0">
            <SendIcon /> Send
          </Button>
        </form>
      </div>
    </Card>
  );
}

function SmartSearchPanel({ liveData }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  function handleSearch(e) {
    e.preventDefault();
    setResult(runSmartSearch(query, liveData));
    setSearched(true);
  }

  return (
    <Card title="Natural language search">
      <p className="-mt-2 mb-4 text-sm text-slate-500">
        Search hostel records in plain English — no filters or forms needed.
      </p>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          className={inputCls}
          placeholder='Try "Show vacant rooms" or "List unpaid hostel fees"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" className="shrink-0">
          <SearchIcon /> Search
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {["Show vacant rooms", "Find students with pending complaints", "List unpaid hostel fees"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQuery(s);
              setResult(runSmartSearch(s, liveData));
              setSearched(true);
            }}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-teal-300 hover:text-teal-700"
          >
            {s}
          </button>
        ))}
      </div>

      {searched && (
        <div className="mt-6">
          {result ? (
            <>
              <p className="mb-3 text-sm font-semibold text-ink">{result.label}</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-400">
                      {result.headers.map((h) => (
                        <th key={h} className="pb-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.rows.map((r, i) => (
                      <tr key={i}>
                        {r.cols.map((c, j) => (
                          <td key={j} className={`py-2.5 ${j === 0 ? "font-medium text-ink" : "text-slate-500"}`}>{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">
              No matching records for that phrase yet — try mentioning "vacant", "complaints", or "fees".
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

export default function AiAssistant() {
  const [tab, setTab] = useState("assistant");
  const { data: liveData } = useCollections({
    blocks: { name: "blocks" },
    complaints: { name: "complaints" },
    fees: { name: "fees" },
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <SparkleIcon />
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">AI Hostel Assistant &amp; Smart Search</p>
              <p className="text-sm text-slate-500">Ask questions in plain language or search institute records instantly.</p>
            </div>
          </div>
          <div className="flex gap-1 rounded-full bg-slate-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setTab("assistant")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors ${
                tab === "assistant" ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink"
              }`}
            >
              <ChatIcon /> Assistant
            </button>
            <button
              type="button"
              onClick={() => setTab("search")}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors ${
                tab === "search" ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink"
              }`}
            >
              <SearchIcon /> Smart search
            </button>
          </div>
        </div>
      </Card>

      {tab === "assistant" ? <AssistantPanel liveData={liveData} /> : <SmartSearchPanel liveData={liveData} />}
    </div>
  );
}
