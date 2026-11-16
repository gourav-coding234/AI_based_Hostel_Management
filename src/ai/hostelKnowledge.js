// Live "knowledge base" for the Hostel AI chatbot.
//
// The bot does not need retraining. Instead it keeps a real-time copy of the
// data the signed-in user is allowed to see:
//   * Firestore listeners (onSnapshot) load each collection ONCE, then receive
//     only the changed documents. A new student, fee, import or edit shows up
//     in the bot within a second, with no manual step.
//   * Collections that the role cannot read are skipped silently.
//   * Statistics (counts, totals, status breakdowns) are computed locally so
//     the AI never has to count a long list itself.
//
// Reads are cheap: one initial read per collection per browser session, then
// only changes. (The old widget re-read up to 10,000 documents on every
// question, which is what drained the free Firestore quota.)

import { collection, documentId, limit as fbLimit, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { mergeRegisteredStudents } from "../utils/hostelResidents";

const MAX_DOCS_PER_COLLECTION = 3000;
const READY_TIMEOUT_MS = 9000;
const CONTEXT_CHAR_BUDGET = 150_000;
const PER_COLLECTION_CHAR_CAP = 60_000;
const MAX_COLUMNS = 16;
const MAX_TEXT_LENGTH = 200;

// What each role may load. `where` filters are resolved per user. Rows that a
// role is not allowed to read are rejected by firestore.rules and skipped.
const ALL_STAFF_COLLECTIONS = [
  "students", "studentRegister", "users", "fees", "payments", "attendance",
  "complaints", "leaveRequests", "gatePasses", "visitors", "notices",
  "inventory", "inventoryRequests", "roomRequests", "blocks", "incidents",
  "feedback", "dutyRoster", "messMenu", "messReports", "emergencyContacts",
  "sosAlerts", "inOutLogs", "inOutStatus", "leaveLogs", "gateLogs",
];

function scopedSources(role, user, profile) {
  const uid = user?.uid;
  const linked = profile?.linkedStudentId;
  const mine = (studentId) => [["studentId", "==", studentId]];

  if (role === "Admin") {
    return [...ALL_STAFF_COLLECTIONS, "expenses"].map((name) => ({ name }));
  }
  if (role === "Warden") {
    return ALL_STAFF_COLLECTIONS.map((name) => ({ name }));
  }
  if (role === "Security") {
    return [
      { name: "gatePasses" }, { name: "visitors" }, { name: "attendance" },
      { name: "students" }, { name: "dutyRoster" }, { name: "incidents" },
      { name: "inOutStatus" }, { name: "emergencyContacts" }, { name: "messMenu" },
      { name: "leaveRequests", where: [["status", "==", "Approved"]] },
    ];
  }
  if (role === "Student" && uid) {
    return [
      // The room/allocation record is keyed by the signed-in student's UID.
      // Without this read, student questions about their room and profile
      // were missing from the chatbot context after the live-store change.
      { name: "students", where: [[documentId(), "==", uid]] },
      { name: "fees", where: mine(uid) }, { name: "attendance", where: mine(uid) },
      { name: "complaints", where: mine(uid) }, { name: "leaveRequests", where: mine(uid) },
      { name: "gatePasses", where: mine(uid) }, { name: "notices" },
      { name: "messMenu" }, { name: "emergencyContacts" },
    ];
  }
  if (role === "Parent" && linked) {
    return [
      // Parent links point to students/{uid}; load only that linked child's
      // allocation record so room/branch/year answers remain available.
      { name: "students", where: [[documentId(), "==", linked]] },
      { name: "fees", where: mine(linked) }, { name: "attendance", where: mine(linked) },
      { name: "complaints", where: mine(linked) }, { name: "leaveRequests", where: mine(linked) },
      { name: "gatePasses", where: mine(linked) }, { name: "notices" },
      { name: "messMenu" }, { name: "emergencyContacts" },
    ];
  }
  return [];
}

// ---------------------------------------------------------------- store ----

const DROP_KEYS = new Set([
  "__proto__", "photoURL", "avatar", "avatarUrl", "password", "token", "fcmToken",
  "createdBy", "updatedBy", "importedBy", "markedAt", "markedBy", "markedByName",
  "updatedAt", "statusUpdatedAt", "statusUpdatedBy", "createdByUid", "updatedByUid",
  "lastPaymentId", "roommates",
]);

let current = null; // { key, collections: Map(name -> Map(id -> data)), unsubs, ready, listeners, loaded }

function emit(store) {
  store.version += 1;
  store.listeners.forEach((fn) => {
    try { fn(store.version); } catch { /* ignore subscriber errors */ }
  });
}

/** Start (or reuse) the live knowledge store for this signed-in user. */
export function startKnowledge(user, profile, role) {
  const key = `${user?.uid || ""}:${role}:${profile?.linkedStudentId || ""}`;
  if (current && current.key === key) return current;
  stopKnowledge();
  if (!db || !role) return null;

  const store = {
    key, role, version: 0, collections: new Map(), skipped: new Set(),
    failures: new Map(), pending: new Set(), truncated: new Set(), timedOut: false,
    unsubs: [], listeners: new Set(), updatedAt: null,
    ready: null,
  };
  current = store;

  const sources = scopedSources(role, user, profile);
  const firstSnapshots = sources.map((source) => new Promise((resolve) => {
    store.pending.add(source.name);
    let settled = false;
    const done = () => {
      if (!settled) {
        settled = true;
        store.pending.delete(source.name);
        if (store.timedOut) store.timedOut = store.pending.size > 0;
        resolve();
      }
    };
    try {
      const constraints = [...(source.where || []).map(([f, op, v]) => where(f, op, v)), fbLimit(MAX_DOCS_PER_COLLECTION)];
      const unsub = onSnapshot(
        query(collection(db, source.name), ...constraints),
        (snap) => {
          const map = new Map();
          snap.docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
          store.collections.set(source.name, map);
          store.skipped.delete(source.name);
          store.failures.delete(source.name);
          if (snap.size >= MAX_DOCS_PER_COLLECTION) store.truncated.add(source.name);
          else store.truncated.delete(source.name);
          store.updatedAt = new Date();
          done();
          emit(store);
        },
        (error) => { // retain the reason so the bot does not silently present partial data as complete
          store.skipped.add(source.name);
          store.failures.set(source.name, error?.code || "read-failed");
          done();
          emit(store);
        },
      );
      store.unsubs.push(unsub);
    } catch {
      store.skipped.add(source.name);
      done();
    }
  }));

  store.ready = Promise.race([
    Promise.all(firstSnapshots),
    new Promise((resolve) => setTimeout(() => {
      store.timedOut = store.pending.size > 0;
      if (store.timedOut) emit(store);
      resolve();
    }, READY_TIMEOUT_MS)),
  ]);
  return store;
}

export function stopKnowledge() {
  if (!current) return;
  current.unsubs.forEach((fn) => { try { fn(); } catch { /* ignore */ } });
  current.listeners.clear();
  current = null;
}

export function subscribeKnowledge(store, fn) {
  store.listeners.add(fn);
  return () => store.listeners.delete(fn);
}

export function knowledgeSummary(store) {
  if (!store) return { collections: 0, records: 0, updatedAt: null, pending: 0, failed: 0, truncated: 0 };
  let records = 0;
  store.collections.forEach((m) => { records += m.size; });
  return {
    collections: store.collections.size,
    records,
    updatedAt: store.updatedAt,
    pending: store.pending.size,
    failed: store.failures.size,
    truncated: store.truncated.size,
  };
}

// ------------------------------------------------------------ utilities ----

const clean = (v) => (v == null ? "" : String(v).trim());
const normReg = (v) => clean(v).replace(/[^a-z0-9]/gi, "").toUpperCase();
const normEmail = (v) => clean(v).toLowerCase();

function isTimestamp(v) {
  return v && typeof v === "object" && typeof v.toDate === "function";
}

function flatten(record) {
  const out = {};
  for (const [k, v] of Object.entries(record || {})) {
    if (DROP_KEYS.has(k)) continue;
    if (v == null || v === "") continue;
    if (isTimestamp(v)) {
      try { out[k] = v.toDate().toISOString().slice(0, 16).replace("T", " "); } catch { /* skip */ }
    } else if (Array.isArray(v)) {
      const parts = v.slice(0, 6).map((x) => (x && typeof x === "object" ? Object.values(x).filter((y) => typeof y !== "object").join("/") : x));
      if (parts.length) out[k] = parts.join(", ");
    } else if (typeof v === "object") {
      for (const [k2, v2] of Object.entries(v)) {
        if (v2 != null && typeof v2 !== "object" && v2 !== "") out[`${k}.${k2}`] = v2;
      }
    } else if (typeof v === "string") {
      if (v.startsWith("data:")) continue; // embedded images
      out[k] = v.length > MAX_TEXT_LENGTH ? `${v.slice(0, MAX_TEXT_LENGTH)}…` : v;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function normalizeGender(value) {
  const g = clean(value).toLowerCase();
  if (["female", "f", "girl", "girls", "woman"].includes(g)) return "Female";
  if (["male", "m", "boy", "boys", "man"].includes(g)) return "Male";
  return "";
}

function genderFromHostel(value) {
  const h = clean(value).toLowerCase();
  if (h.includes("girl")) return "Female";
  if (h.includes("boy")) return "Male";
  return "";
}

// ---------------------------------------------------- student directory ----

function buildStudentDirectory(store) {
  const get = (name) => [...(store.collections.get(name)?.values() || [])];
  const students = get("students");
  const register = get("studentRegister");
  const studentUsers = get("users").filter((u) => clean(u.role) === "Student");

  // Same merge the admin Overview uses, so totals always match the dashboard.
  const merged = mergeRegisteredStudents(students, register);

  const byUid = new Map();
  const byEmail = new Map();
  const byReg = new Map();
  studentUsers.forEach((u) => {
    byUid.set(u.id, u);
    if (u.email) byEmail.set(normEmail(u.email), u);
    const reg = normReg(u.registrationNo || u.regNo);
    if (reg) byReg.set(reg, u);
  });

  const used = new Set();
  const rows = merged.map((rec) => {
    const account =
      byUid.get(clean(rec.accountUid || rec.userId || rec.uid || rec.id)) ||
      byEmail.get(normEmail(rec.email)) ||
      byReg.get(normReg(rec.regNo || rec.registrationNo || rec.registrationNumber));
    if (account) used.add(account.id);
    return toDirectoryRow(rec, account);
  });

  // Login accounts that exist but are not in the student roster yet.
  const extra = studentUsers.filter((u) => !used.has(u.id)).map((u) => toDirectoryRow(u, u, true));

  return { rows, extra, total: merged.length };
}

function toDirectoryRow(rec, account, accountOnly = false) {
  const pick = (...keys) => {
    for (const k of keys) {
      const v = clean(rec[k]) || clean(account?.[k]);
      if (v) return v;
    }
    return "";
  };
  const hostel = pick("hostel", "hostelType", "hostelResidence");
  const gender = normalizeGender(pick("gender")) || genderFromHostel(hostel);
  return {
    name: pick("name", "studentName"),
    regNo: pick("regNo", "registrationNo", "registrationNumber"),
    gender,
    hostel: hostel || (gender === "Female" ? "Girls Hostel" : gender === "Male" ? "Boys Hostel" : ""),
    room: pick("room"),
    bed: pick("bed"),
    floor: pick("floor"),
    wing: pick("wing", "block"),
    branch: pick("branch"),
    year: pick("year"),
    batch: pick("batch"),
    email: pick("email"),
    phone: pick("phone"),
    status: pick("status"),
    loginAccount: account ? "yes" : "no",
    ...(accountOnly ? { note: "login account only, not yet in roster" } : {}),
    createdAt: flatten({ createdAt: rec.createdAt || account?.createdAt }).createdAt || "",
  };
}

// ------------------------------------------------------------ statistics ----

const NUMERIC_SUM_FIELDS = ["total", "paid", "amount", "quantity", "available", "damaged", "occupiedBeds", "beds", "capacity"];
const SKIP_STAT_FIELDS = new Set(["id", "name", "email", "phone", "description", "message", "title", "studentName", "regNo", "registrationNo", "photoURL", "student", "note", "room", "bed"]);

function countBy(rows, field) {
  const map = new Map();
  rows.forEach((r) => {
    const v = clean(r[field]);
    if (v) map.set(v, (map.get(v) || 0) + 1);
  });
  return map;
}

function describeCounts(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}=${n}`).join(", ");
}

/** Generic stats that work for any collection, including ones added later. */
function collectionStats(name, flatRows) {
  const lines = [`${name}: ${flatRows.length} records`];
  if (!flatRows.length) return lines;

  const fields = new Set();
  flatRows.forEach((r) => Object.keys(r).forEach((k) => fields.add(k)));

  fields.forEach((field) => {
    if (SKIP_STAT_FIELDS.has(field) || /(Id|Uid|UID|Url|URL|At)$/.test(field) || field.includes(".")) return;
    const counts = countBy(flatRows, field);
    if (counts.size >= 2 && counts.size <= 12 && counts.size < flatRows.length) {
      lines.push(`  by ${field}: ${describeCounts(counts)}`);
    } else if (counts.size === 1 && flatRows.length > 1) {
      lines.push(`  all ${field}: ${[...counts.keys()][0]}`);
    }
  });

  NUMERIC_SUM_FIELDS.forEach((field) => {
    const nums = flatRows.map((r) => Number(r[field])).filter((n) => Number.isFinite(n));
    if (nums.length) lines.push(`  sum of ${field}: ${nums.reduce((a, b) => a + b, 0)} (over ${nums.length} records)`);
  });

  if (name === "fees") {
    const due = flatRows.reduce((sum, r) => sum + Math.max(0, (Number(r.total) || 0) - (Number(r.paid) || 0)), 0);
    lines.push(`  total outstanding due (total - paid): ${due}`);
  }
  return lines;
}

// ------------------------------------------------------- context builder ----

const ROUTES = [
  ["fees", /fee|due|paid|pay|pending|overdue|balance|amount|money|defaulter|receipt/i],
  ["payments", /payment|paid|receipt|collected|collection/i],
  ["attendance", /attend|present|absent|roll ?call|marked/i],
  ["complaints", /complain|issue|problem|grievance|maintenance/i],
  ["leaveRequests", /leave|vacation|home|permission/i],
  ["gatePasses", /gate ?pass|pass|exit|outing/i],
  ["visitors", /visitor|visit|guest|parent came/i],
  ["notices", /notice|announce|circular|news/i],
  ["inventory", /inventor|stock|furniture|item|equipment|bed|mattress|fan/i],
  ["blocks", /block|wing|capacity|occupan|vacan|beds?|floor/i],
  ["users", /warden|security|guard|parent|admin|staff|account|login|user|role/i],
  ["messMenu", /mess|menu|food|breakfast|lunch|dinner|meal/i],
  ["messReports", /mess|food/i],
  ["incidents", /incident|accident|fight|theft|report/i],
  ["sosAlerts", /sos|emergency|alert/i],
  ["emergencyContacts", /emergency|contact|phone number|helpline/i],
  ["feedback", /feedback|suggestion|review|rating/i],
  ["dutyRoster", /duty|roster|shift|guard/i],
  ["expenses", /expense|spend|spent|cost|bill/i],
  ["inOutLogs", /in.?out|entry|exit|movement|returned|left/i],
  ["leaveLogs", /leave log|returned|left/i],
];

const STOPWORDS = new Set(["the", "and", "for", "all", "list", "give", "show", "tell", "me", "who", "what", "how", "many", "are", "any", "with", "from", "that", "this", "only", "names", "name", "students", "student", "their", "have", "has", "does", "please", "about", "which", "when", "where", "there", "total", "number"]);

function queryTokens(question) {
  return [...new Set(clean(question).toLowerCase().split(/[^a-z0-9@.]+/).filter((t) => t.length >= 3 && !STOPWORDS.has(t)))];
}

function rowToLine(columns, flatRow) {
  return columns.map((c) => {
    const v = flatRow[c];
    return v == null || v === "" ? "-" : String(v).replace(/\s+/g, " ").replace(/\|/g, "/");
  }).join(" | ");
}

function chooseColumns(flatRows) {
  const freq = new Map();
  flatRows.forEach((r) => Object.keys(r).forEach((k) => {
    if (r[k] !== "" && r[k] != null) freq.set(k, (freq.get(k) || 0) + 1);
  }));
  return [...freq.entries()]
    .filter(([k]) => k !== "id")
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_COLUMNS)
    .map(([k]) => k);
}

function sortRecent(rows) {
  return [...rows].sort((a, b) => String(b.date || b.createdAt || "").localeCompare(String(a.date || a.createdAt || "")));
}

function renderTable(label, flatRows, tokens, charCap) {
  if (!flatRows.length) return { text: `### ${label}\n(no records)`, truncated: false };
  const columns = chooseColumns(flatRows);
  const header = `### ${label} — ${flatRows.length} records\ncolumns: ${columns.join(" | ")}`;

  const scored = flatRows.map((row, index) => {
    const text = Object.values(row).join(" ").toLowerCase();
    const hits = tokens.reduce((n, t) => n + (text.includes(t) ? 1 : 0), 0);
    return { row, index, hits };
  });
  // Rows that mention words from the question come first when space is tight.
  const ordered = scored.sort((a, b) => b.hits - a.hits || a.index - b.index);

  const lines = [];
  let used = header.length;
  let included = 0;
  for (const { row } of ordered) {
    const line = rowToLine(columns, row);
    if (used + line.length + 1 > charCap) break;
    lines.push(line);
    used += line.length + 1;
    included += 1;
  }
  const truncated = included < flatRows.length;
  const note = truncated ? `\n(showing the ${included} most relevant of ${flatRows.length} records; counts above are for ALL records)` : "";
  return { text: `${header}\n${lines.join("\n")}${note}`, truncated };
}

/** Build the full, current, role-scoped context for one question. */
export function buildKnowledgeContext(store, { user, profile, role }, question) {
  const name = profile?.name || user?.displayName || user?.email || "user";
  const tokens = queryTokens(question);
  const parts = [`Signed-in user: ${name} (${role}).`];

  const flat = new Map();
  store.collections.forEach((docs, collName) => {
    const rows = collName === "users"
      ? [...docs.values()].map((u) => ({ ...u, createdAt: u.createdAt }))
      : [...docs.values()];
    flat.set(collName, sortRecent(rows.map((r) => flatten(r))));
  });

  // Resolve student ids to readable names so the AI can join records.
  const idToName = new Map();
  [store.collections.get("students"), store.collections.get("users")].forEach((m) => {
    m?.forEach((doc, id) => {
      const label = [clean(doc.name), clean(doc.regNo || doc.registrationNo)].filter(Boolean).join(" ");
      if (label && !idToName.has(id)) idToName.set(id, label);
    });
  });
  flat.forEach((rows) => rows.forEach((r) => {
    ["studentId", "studentUid", "uid", "userId"].forEach((f) => {
      if (r[f] && idToName.has(r[f])) {
        r.student = r.student || idToName.get(r[f]);
        delete r[f];
      }
    });
  }));

  // 1) Headline statistics (always included, always exact).
  const statLines = [];
  const isStaff = role === "Admin" || role === "Warden";
  let directory = null;
  if (isStaff && (store.collections.has("students") || store.collections.has("studentRegister"))) {
    directory = buildStudentDirectory(store);
    const all = [...directory.rows, ...directory.extra];
    const byGender = countBy(all, "gender");
    const byHostel = countBy(all, "hostel");
    const byYear = countBy(all, "year");
    const byBranch = countBy(all, "branch");
    statLines.push(
      `Student directory total: ${directory.total} unique registered students (matches the admin overview).` +
        (directory.extra.length ? ` Plus ${directory.extra.length} student login account(s) not yet in the roster (listed with a note).` : ""),
      `  by gender: ${describeCounts(byGender) || "unknown"}`,
      `  by hostel: ${describeCounts(byHostel) || "unassigned"}`,
      `  by year: ${describeCounts(byYear) || "n/a"}`,
      `  by branch: ${describeCounts(byBranch) || "n/a"}`,
    );
    const names = (gender) => all.filter((s) => s.gender === gender).map((s) => s.name).filter(Boolean);
    const girls = names("Female");
    const boys = names("Male");
    if (all.length <= 1500) {
      statLines.push(`Female students (${girls.length}): ${girls.join(", ") || "none"}`);
      statLines.push(`Male students (${boys.length}): ${boys.join(", ") || "none"}`);
      const unknown = all.filter((s) => !s.gender).map((s) => s.name).filter(Boolean);
      if (unknown.length) statLines.push(`Gender not recorded (${unknown.length}): ${unknown.join(", ")}`);
    }
  }
  flat.forEach((rows, collName) => {
    if (collName === "students" || collName === "studentRegister") return;
    collectionStats(collName, rows).forEach((l) => statLines.push(l));
  });
  if (store.skipped.size) {
    statLines.push(`Not accessible to this role (do not guess): ${[...store.skipped].join(", ")}`);
  }
  const limitations = [];
  if (store.pending.size) limitations.push(`Initial reads still loading: ${[...store.pending].join(", ")}.`);
  if (store.truncated.size) limitations.push(`The per-collection safety limit (${MAX_DOCS_PER_COLLECTION}) was reached for: ${[...store.truncated].join(", ")}. Those totals are partial.`);
  if (store.failures.size) limitations.push(`These collections could not be read (${[...store.failures.entries()].map(([name, code]) => `${name}: ${code}`).join(", ")}). Do not treat missing data from them as zero.`);
  if (store.timedOut) limitations.push("The initial data sync took longer than expected; available records may be incomplete.");
  parts.push(`## LIVE STATISTICS (${limitations.length ? "computed from currently loaded records and may be incomplete" : "exact for the loaded database snapshot"})\n${statLines.join("\n")}${limitations.length ? `\n\n## DATA LIMITATIONS\n${limitations.join("\n")}` : ""}`);

  // 2) Detailed tables within a size budget, most relevant collections first.
  const routed = new Set(ROUTES.filter(([, re]) => re.test(question)).map(([c]) => c));
  const order = [];
  if (directory) order.push("__directory__");
  [...flat.keys()].forEach((c) => {
    if (c === "students" || c === "studentRegister") { if (!directory) order.push(c); return; }
    order.push(c);
  });
  order.sort((a, b) => {
    const rank = (c) => (routed.has(c) ? 0 : c === "__directory__" ? 1 : c === "users" ? 3 : 2);
    return rank(a) - rank(b);
  });

  let remaining = CONTEXT_CHAR_BUDGET;
  const omitted = [];
  const tables = [];
  for (const c of order) {
    const cap = Math.min(remaining, PER_COLLECTION_CHAR_CAP);
    if (cap < 1500) { omitted.push(c === "__directory__" ? "studentDirectory" : c); continue; }
    let rendered;
    if (c === "__directory__") {
      rendered = renderTable("studentDirectory (every student: roster + accounts merged)", sortRecent([...directory.rows, ...directory.extra]), tokens, cap);
    } else {
      rendered = renderTable(c, flat.get(c) || [], tokens, cap);
    }
    tables.push(rendered.text);
    remaining -= rendered.text.length;
  }
  if (omitted.length) tables.push(`(Tables omitted to save space: ${omitted.join(", ")} — their counts are in the statistics above.)`);
  parts.push(`## DETAILED RECORDS\n${tables.join("\n\n")}`);

  return parts.join("\n\n");
}
