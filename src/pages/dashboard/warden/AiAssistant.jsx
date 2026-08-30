import { useState } from "react";
import { Card, Button, inputCls } from "../../../components/dashboard/student/ui";
import { SparkleIcon, ChatIcon, SendIcon, SearchIcon } from "../../../components/dashboard/warden/icons";
import {
  aiAssistantSuggestions,
  aiAssistantReplies,
  wings,
  allComplaints,
  studentFees,
} from "../../../data/wardenMock";

// ---------------------------------------------------------------------------
// UI-only demo: replies and search results come from local mock data with
// simple keyword matching. Nothing here calls a real AI service — it's a
// front-end stand-in so this screen can be reviewed before a backend exists.
// ---------------------------------------------------------------------------

const FALLBACK_REPLY =
  "I don't have live data for that yet in this preview, but once connected I'll be able to answer from real hostel records — try one of the suggested questions instead.";

function craftReply(question) {
  const q = question.toLowerCase();
  const found = aiAssistantReplies.find((r) => r.match.some((kw) => q.includes(kw)));
  return found ? found.reply : FALLBACK_REPLY;
}

function runSmartSearch(query) {
  const q = query.toLowerCase();

  if (q.includes("vacant") || q.includes("available room")) {
    return {
      label: "Vacant beds by wing",
      headers: ["Wing", "Vacant", "Rooms"],
      rows: wings.map((w) => {
        const vacant = w.rooms.reduce((n, r) => n + r.beds.filter((b) => b.status === "vacant").length, 0);
        return { cols: [w.name, `${vacant} vacant beds`, `${w.rooms.length} rooms`] };
      }),
    };
  }
  if (q.includes("complaint")) {
    const pending = allComplaints.filter((c) => c.status !== "Resolved");
    return {
      label: "Students with pending complaints",
      headers: ["Student", "Room", "Complaint", "Status"],
      rows: pending.map((c) => ({ cols: [c.student, c.room, c.title, c.status] })),
    };
  }
  if (q.includes("fee") || q.includes("unpaid") || q.includes("overdue") || q.includes("due")) {
    const due = studentFees.filter((f) => f.status !== "Paid");
    return {
      label: "Students with overdue or partial fees",
      headers: ["Student", "Room", "Paid", "Total", "Status"],
      rows: due.map((f) => ({ cols: [f.name, f.room, `₹${f.paid.toLocaleString("en-IN")}`, `₹${f.total.toLocaleString("en-IN")}`, f.status] })),
    };
  }
  return null;
}

function AssistantPanel() {
  const [messages, setMessages] = useState([
    { from: "ai", text: "Hi! Ask me about occupancy, complaints, fees, or hostel rules for your wings." },
  ]);
  const [input, setInput] = useState("");

  function send(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const reply = craftReply(trimmed);
    setMessages((m) => [...m, { from: "warden", text: trimmed }, { from: "ai", text: reply }]);
    setInput("");
  }

  return (
    <Card title="Chat with the assistant">
      <div className="flex h-[420px] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === "warden" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.from === "warden" ? "bg-navy-950 text-white" : "bg-slate-100 text-ink"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {aiAssistantSuggestions.map((s) => (
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

function SmartSearchPanel() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  function handleSearch(e) {
    e.preventDefault();
    setResult(runSmartSearch(query));
    setSearched(true);
  }

  return (
    <Card title="Natural language search">
      <p className="-mt-2 mb-4 text-sm text-slate-500">
        Search your wings' records in plain English — no filters or forms needed.
      </p>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          className={inputCls}
          placeholder='Try "Show vacant rooms" or "List overdue fees"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" className="shrink-0">
          <SearchIcon /> Search
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {["Show vacant rooms", "Find students with pending complaints", "List overdue fees"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQuery(s);
              setResult(runSmartSearch(s));
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

export default function WardenAiAssistant() {
  const [tab, setTab] = useState("assistant");

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
              <p className="text-sm text-slate-500">Ask questions in plain language or search your wings' records instantly.</p>
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

      {tab === "assistant" ? <AssistantPanel /> : <SmartSearchPanel />}
    </div>
  );
}
