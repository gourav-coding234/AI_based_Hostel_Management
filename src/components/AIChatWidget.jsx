import { useEffect, useMemo, useRef, useState } from "react";
import { collection, doc, getDoc, getDocs, limit as fbLimit, query, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import aibotImage from "../assets/aibot.png";

// Use multiple active Gemini 3.x variants so the app can automatically move to
// another model when one is temporarily overloaded or rate-limited.
const GEMINI_MODEL_FALLBACKS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.5-pro",
  "gemini-3.8-pro",
];

const ROLE_SCOPE_TEXT = {
  Admin: "This user may ask about all hostel-wide records and aggregated operational data.",
  Warden: "This user may ask about all records for their hostel block and the wider warden dashboard data, but not unrelated student private details outside their scope.",
  Student: "This user may ask only about their own profile, room, fees, attendance, complaints, leave requests, gate passes, and notices relevant to their hostel group.",
  Parent: "This user may ask only about their linked child, including fees, attendance, complaints, leave requests, gate passes, and notices relevant to that child.",
  Security: "This user may ask only about visitors, gate pass checks, attendance, and operational security logs.",
};

const BLOCKED_KEYS = new Set([
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",
  "importedBy",
  "markedAt",
  "markedBy",
  "markedByName",
  "__proto__",
]);

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

function sanitizeRecord(record) {
  if (!record || typeof record !== "object") return record;

  const next = {};
  for (const [key, value] of Object.entries(record)) {
    if (BLOCKED_KEYS.has(key)) continue;

    if (Array.isArray(value)) {
      next[key] = value.slice(0, 4).map((item) => sanitizeRecord(item));
      continue;
    }

    if (value && typeof value === "object" && !("toDate" in value)) {
      next[key] = sanitizeRecord(value);
      continue;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      next[key] = value;
    }
  }

  return next;
}

function toPreviewText(label, rows) {
  if (!rows || rows.length === 0) return `${label}: no records found.`;

  const preview = rows.slice(0, 4).map((item) => {
    const cleaned = sanitizeRecord(item);
    return JSON.stringify(cleaned);
  });

  return `${label}: ${preview.join(" | ")}`;
}

async function fetchCollectionDocs(collectionName, filters = [], limitCount = 25) {
  const ref = collection(db, collectionName);
  const constraints = [...filters.map(([field, op, value]) => where(field, op, value)), fbLimit(limitCount)];
  const queryRef = query(ref, ...constraints);
  const snap = await getDocs(queryRef);
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

async function buildRoleScopedContext(user, profile, role) {
  const name = profile?.name || user?.displayName || user?.email || "user";
  const uid = user?.uid;
  const linkedStudentId = profile?.linkedStudentId;

  const contextParts = [
    `User identity: ${name} (${role})`,
    `Allowed scope: ${ROLE_SCOPE_TEXT[role] || "This user may ask only about data relevant to their own account."}`,
  ];

  try {
    if (role === "Admin" || role === "Warden") {
      const blocks = await fetchCollectionDocs("blocks");
      const students = await fetchCollectionDocs("students");
      const fees = await fetchCollectionDocs("fees");
      const notices = await fetchCollectionDocs("notices");
      const attendance = await fetchCollectionDocs("attendance");
      const complaints = await fetchCollectionDocs("complaints");
      const leaveRequests = await fetchCollectionDocs("leaveRequests");
      const gatePasses = await fetchCollectionDocs("gatePasses");
      const visitors = await fetchCollectionDocs("visitors");

      contextParts.push(
        toPreviewText("blocks", blocks),
        toPreviewText("students", students),
        toPreviewText("fees", fees),
        toPreviewText("notices", notices),
        toPreviewText("attendance", attendance),
        toPreviewText("complaints", complaints),
        toPreviewText("leaveRequests", leaveRequests),
        toPreviewText("gatePasses", gatePasses),
        toPreviewText("visitors", visitors),
      );
    }

    if (role === "Student") {
      const studentSnap = await getDoc(doc(db, "students", uid));
      const student = studentSnap.exists() ? { id: studentSnap.id, ...studentSnap.data() } : null;

      const myFees = await fetchCollectionDocs("fees", [["studentId", "==", uid]]);
      const myAttendance = await fetchCollectionDocs("attendance", [["studentId", "==", uid]]);
      const myComplaints = await fetchCollectionDocs("complaints", [["studentId", "==", uid]]);
      const myLeaveRequests = await fetchCollectionDocs("leaveRequests", [["studentId", "==", uid]]);
      const myGatePasses = await fetchCollectionDocs("gatePasses", [["studentId", "==", uid]]);
      const relevantNotices = await fetchCollectionDocs("notices", [["target", "==", profile?.hostelResidence || ""]], 20);

      contextParts.push(
        `studentRecord: ${student ? JSON.stringify(sanitizeRecord(student)) : "not found"}`,
        toPreviewText("myFees", myFees),
        toPreviewText("myAttendance", myAttendance),
        toPreviewText("myComplaints", myComplaints),
        toPreviewText("myLeaveRequests", myLeaveRequests),
        toPreviewText("myGatePasses", myGatePasses),
        toPreviewText("relevantNotices", relevantNotices),
      );
    }

    if (role === "Parent") {
      const targetStudentId = linkedStudentId || profile?.linkedStudentId;
      if (!targetStudentId) {
        contextParts.push("linkedStudentId: not assigned");
      } else {
        const studentSnap = await getDoc(doc(db, "students", targetStudentId));
        const student = studentSnap.exists() ? { id: studentSnap.id, ...studentSnap.data() } : null;

        const childFees = await fetchCollectionDocs("fees", [["studentId", "==", targetStudentId]]);
        const childAttendance = await fetchCollectionDocs("attendance", [["studentId", "==", targetStudentId]]);
        const childComplaints = await fetchCollectionDocs("complaints", [["studentId", "==", targetStudentId]]);
        const childLeaveRequests = await fetchCollectionDocs("leaveRequests", [["studentId", "==", targetStudentId]]);
        const childGatePasses = await fetchCollectionDocs("gatePasses", [["studentId", "==", targetStudentId]]);

        contextParts.push(
          `linkedStudentId: ${targetStudentId}`,
          `studentRecord: ${student ? JSON.stringify(sanitizeRecord(student)) : "not found"}`,
          toPreviewText("childFees", childFees),
          toPreviewText("childAttendance", childAttendance),
          toPreviewText("childComplaints", childComplaints),
          toPreviewText("childLeaveRequests", childLeaveRequests),
          toPreviewText("childGatePasses", childGatePasses),
        );
      }
    }

    if (role === "Security") {
      const gatePasses = await fetchCollectionDocs("gatePasses");
      const visitors = await fetchCollectionDocs("visitors");
      const attendance = await fetchCollectionDocs("attendance");
      contextParts.push(
        toPreviewText("gatePasses", gatePasses),
        toPreviewText("visitors", visitors),
        toPreviewText("attendance", attendance),
      );
    }

    return contextParts.join("\n\n");
  } catch (error) {
    console.error("AI context load failed:", error);
    return `User identity: ${name} (${role})\n\nAllowed scope: ${ROLE_SCOPE_TEXT[role] || "role-limited access"}\n\nAI context unavailable: ${error.message || "unknown error"}.`;
  }
}

async function requestGeminiReply(contextText, userMessage) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Add VITE_GEMINI_API_KEY to your .env file to enable the AI assistant.");
  }

  const prompt = `
You are the hostel AI assistant for this project.
Use only the data in the context below. Do not invent facts.
If the user asks for information outside their allowed scope, politely state that they can only access their own or their role-approved dataset.
If the data is missing, say so clearly.

ROLE-SCOPED CONTEXT:
${contextText}

USER QUESTION:
${userMessage}

Answer in a concise, helpful, and professional way.
`;

  const errors = [];

  for (const model of GEMINI_MODEL_FALLBACKS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 800,
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
  const chatBodyRef = useRef(null);
  const textareaRef = useRef(null);

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

  useEffect(() => {
    if (!isAuthenticated || !role) {
      setMessages([]);
      setInput("");
      setOpen(false);
      return;
    }

    setMessages([
      {
        role: "bot",
        text: `Hi! I can answer hostel questions based on your ${role} Firebase data and role access.`,
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
      const context = await buildRoleScopedContext(user, profile, role);
      const reply = await requestGeminiReply(context, userMessage);
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
              <span>{roleLabel}</span>
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
              placeholder="Ask about your own hostel data..."
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
