import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import aibotImage from "../assets/aibot.png";
import {
  buildKnowledgeContext,
  knowledgeSummary,
  startKnowledge,
  stopKnowledge,
  subscribeKnowledge,
} from "../ai/hostelKnowledge";

// Use multiple active Gemini 3.x variants so the app can automatically move to
// another model when one is temporarily overloaded or rate-limited.
const GEMINI_MODEL_FALLBACKS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.5-pro",
  "gemini-3.8-pro",
];

function renderFormattedText(text) {
  if (!text) return "";

  const parts = [];
  const regex = /(\*\*[^*]+\*\*)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(regex)) {
    const start = match.index;
    const end = start + match[0].length;

    if (start > lastIndex) {
      const segment = text.slice(lastIndex, start);
      const lines = segment.split("\n");
      lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) parts.push(<br key={`br-${start}-${lineIndex}`} />);
        if (line) parts.push(line);
      });
    }

    const boldText = match[0].slice(2, -2);
    parts.push(<strong key={`bold-${start}`}>{boldText}</strong>);
    lastIndex = end;
  }

  if (lastIndex < text.length) {
    const tail = text.slice(lastIndex);
    const lines = tail.split("\n");
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) parts.push(<br key={`tail-br-${lineIndex}`} />);
      if (line) parts.push(line);
    });
  }

  return parts;
}

const SYSTEM_RULES = `You are "Hostel AI", the assistant inside the GCE Keonjhar hostel management portal.

HOW TO ANSWER
- Answer ONLY from the LIVE STATISTICS and DETAILED RECORDS below. They are a real-time copy of the database, so they already include anything recently added or imported.
- LIVE STATISTICS are exact and cover every record. Use them for totals and counts. Never count rows by eye when a statistic exists.
- DETAILED RECORDS may show only the most relevant rows if a table is large. If a table says it is truncated, say so and give the exact count from the statistics.
- When asked for a list (for example "names of the girl students"), list every matching name, one per line, with no preamble. Use the "Female students" / "Male students" lines or filter the studentDirectory table.
- Match names loosely (case-insensitive, partial names, spelling variations) and say if more than one person matches.
- Combine tables when needed (for example fees + students + rooms). Records refer to students by name and registration number.
- If something is not in the data, say exactly what is missing. Never invent names, numbers, dates or amounts.
- Respect the signed-in user's role scope. If the data below does not contain what they ask about, explain that it is outside what their role can see.
- Be concise and professional. Use short lists. Use **bold** only for key values. Amounts are in rupees (₹) unless the data says otherwise.
- You can answer follow-up questions using the earlier messages in this conversation.`;

async function requestGeminiReply(contextText, history, userMessage) {
  // Deployed: call /api/gemini (serverless function holds GEMINI_API_KEY privately).
  // Local shortcut: if VITE_GEMINI_API_KEY is set in .env, call Google directly.
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const useDirect = typeof apiKey === "string" && apiKey.trim() !== "";

  const trimmedHistory = [...history];
  while (trimmedHistory.length && trimmedHistory[0].role !== "user") trimmedHistory.shift();
  const contents = [
    ...trimmedHistory.map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] })),
    { role: "user", parts: [{ text: userMessage }] },
  ];
  const systemInstruction = { parts: [{ text: `${SYSTEM_RULES}\n\n${contextText}` }] };

  const errors = [];

  for (const model of GEMINI_MODEL_FALLBACKS) {
    const url = useDirect
      ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
      : "/api/gemini";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(useDirect ? { "x-goog-api-key": apiKey } : {}),
        },
        body: JSON.stringify({
          ...(useDirect ? {} : { model }),
          systemInstruction,
          contents,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        const errorMessage = payload?.error?.message || "The AI service returned an error.";
        errors.push(`${model}: ${errorMessage}`);

        const isTemporaryFailure =
          response.status === 429 ||
          response.status === 500 ||
          response.status === 503 ||
          /high demand|temporar|rate limit|not available|unavailable|not found|not supported/i.test(errorMessage);

        if (!isTemporaryFailure) {
          throw new Error(errorMessage);
        }

        continue;
      }

      const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") || "";
      if (text.trim()) {
        return text.trim();
      }

      errors.push(`${model}: empty response`);
    } catch (error) {
      const message = error?.message || "The AI request failed.";
      errors.push(`${model}: ${message}`);
    }
  }

  throw new Error(
    errors.length
      ? `Gemini is temporarily unavailable. Last response: ${errors[errors.length - 1]}`
      : "Gemini is temporarily unavailable. Please try again shortly."
  );
}

export default function AIChatWidget() {
  const { user, profile, role, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [knowledge, setKnowledge] = useState({ collections: 0, records: 0, updatedAt: null });
  const chatBodyRef = useRef(null);
  const textareaRef = useRef(null);
  const storeRef = useRef(null);

  const roleLabel = useMemo(() => role || "Guest", [role]);

  useEffect(() => {
    if (!chatBodyRef.current) return;
    chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (open && textareaRef.current && !loading) {
      textareaRef.current.focus();
    }
  }, [open, loading, messages.length]);

  // Start the live knowledge store the first time the chat opens. After the
  // first load it only receives changes, so new/imported data appears here
  // automatically.
  useEffect(() => {
    if (!isAuthenticated || !role || !open) return undefined;
    const store = startKnowledge(user, profile, role);
    storeRef.current = store;
    if (!store) return undefined;
    setKnowledge(knowledgeSummary(store));
    return subscribeKnowledge(store, () => setKnowledge(knowledgeSummary(store)));
  }, [isAuthenticated, role, open, user, profile]);

  useEffect(() => {
    if (!isAuthenticated || !role) {
      stopKnowledge();
      storeRef.current = null;
      setKnowledge({ collections: 0, records: 0, updatedAt: null });
      setMessages([]);
      setInput("");
      setOpen(false);
      return;
    }

    setMessages([
      {
        role: "bot",
        text: `Hi! I stay in sync with your live hostel data, so new records and imports are available to me automatically. Ask me anything about what your ${role} account can see.`,
      },
    ]);
    setInput("");
    setOpen(false);
  }, [isAuthenticated, role, user?.uid]);

  if (!isAuthenticated || !role) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = trimmed;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }, { role: "bot", text: "Working on that…" }]);
    setLoading(true);

    try {
      const store = storeRef.current || startKnowledge(user, profile, role);
      if (!store) throw new Error("The live data connection is not available. Please sign in again.");
      storeRef.current = store;
      await store.ready;
      const context = buildKnowledgeContext(store, { user, profile, role }, userMessage);
      // Keep the last few turns so follow-up questions work.
      const history = messages
        .filter((m, i) => i > 0 && m.text && m.text !== "Working on that…")
        .slice(-8);
      const reply = await requestGeminiReply(context, history, userMessage);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "bot", text: reply };
        return next;
      });
    } catch (error) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "bot",
          text: error.message || "I couldn’t answer that right now. Please try again.",
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!loading && input.trim()) {
        const form = event.currentTarget.form;
        if (form) form.requestSubmit();
      }
    }
  }

  return (
    <div className="ai-chat-widget">
      <button
        type="button"
        className="ai-chat-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? "Close AI chat" : "Open AI chat"}
      >
        {open ? "✕" : <img src={aibotImage} alt="AI bot" className="ai-chat-icon" />}
      </button>

      {open && (
        <div className="ai-chat-panel" role="dialog" aria-label="Hostel AI assistant">
          <div className="ai-chat-header">
            <div>
              <strong>Hostel AI</strong>
              <span>
                {roleLabel}
                {knowledge.records > 0
                  ? ` · live: ${knowledge.records} records from ${knowledge.collections} collections`
                  : open ? " · syncing data…" : ""}
              </span>
            </div>
            <button type="button" className="ai-close-button" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </div>

          <div className="ai-chat-body" ref={chatBodyRef}>
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`ai-message ${message.role}`}>
                {renderFormattedText(message.text)}
              </div>
            ))}
          </div>

          <form className="ai-chat-form" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              rows={3}
              placeholder="Ask anything about your hostel data..."
              disabled={loading}
            />
            <button type="submit" className="btn btn-primary btn-block" disabled={loading || !input.trim()}>
              {loading ? "Thinking..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
