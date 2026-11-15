import fs from "node:fs";

// Reads .env without printing secrets. Set FIREBASE_SMOKE_PARENT_* and
// FIREBASE_SMOKE_STUDENT_* in the shell for accounts allowed to read data.
for (const line of fs.readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}

const project = process.env.VITE_FIREBASE_PROJECT_ID;
const apiKey = process.env.VITE_FIREBASE_API_KEY;
if (!project || !apiKey) throw new Error("Set VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_API_KEY in .env.");
const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;

async function login(label, email, password) {
  if (!email || !password) throw new Error(`Set FIREBASE_SMOKE_${label.toUpperCase()}_EMAIL and _PASSWORD.`);
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`${label} login failed (${response.status}): ${body.error?.message || "unknown error"}`);
  return body;
}

async function firestore(token, path, method = "GET", body) {
  const response = await fetch(`${base}/${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json().catch(() => ({}));
  return { status: response.status, result };
}

async function query(token, collectionId, studentId) {
  const body = { structuredQuery: { from: [{ collectionId }], where: { fieldFilter: { field: { fieldPath: "studentId" }, op: "EQUAL", value: { stringValue: studentId } } } } };
  const response = await fetch(`${base}:runQuery`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, count: Array.isArray(data) ? data.filter((row) => row.document).length : 0, body: data };
}

async function queryNotices(token, studentProfile) {
  const values = ["Both", "Both Hostels", "All Hostels"];
  const rawHostel = [studentProfile.hostel, studentProfile.hostelType, studentProfile.gender, studentProfile.hostelResidence]
    .map((value) => String(value || "").trim().toLowerCase());
  if (rawHostel.some((value) => value.includes("girl") || value.includes("female") || value === "f")) values.push("Girls Hostel");
  if (rawHostel.some((value) => value.includes("boy") || value.includes("male") || value === "m")) values.push("Boys Hostel");
  const body = { structuredQuery: { from: [{ collectionId: "notices" }], where: { fieldFilter: { field: { fieldPath: "target" }, op: "IN", value: { arrayValue: { values: values.map((value) => ({ stringValue: value })) } } } } } };
  const response = await fetch(`${base}:runQuery`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, count: Array.isArray(data) ? data.filter((row) => row.document).length : 0, body: data };
}

function assertOk(label, result) {
  console.log(`${label}: HTTP ${result.status}${result.count === undefined ? "" : ` · ${result.count} records`}`);
  if (result.status !== 200) throw new Error(`${label} failed: ${JSON.stringify(result.body || result.result)}`);
}

async function runRole(label, email, password, role) {
  const auth = await login(label, email, password);
  const user = await firestore(auth.idToken, `users/${auth.localId}`);
  assertOk(`${label} profile`, user);
  if (!user.result.fields || user.result.fields.role?.stringValue !== role) throw new Error(`${label} account does not have the expected ${role} role.`);
  const linkedId = role === "Parent" ? user.result.fields.linkedStudentId?.stringValue : auth.localId;
  if (!linkedId) throw new Error("Parent profile is missing linkedStudentId.");
  const student = await firestore(auth.idToken, `students/${linkedId}`);
  assertOk(`${label} linked student profile`, student);
  const studentFields = Object.fromEntries(Object.entries(student.result.fields || {}).map(([key, value]) => [key, value.stringValue ?? value.integerValue ?? ""]));

  const checks = role === "Parent"
    ? ["attendance", "fees", "gatePasses", "leaveRequests", "complaints"]
    : ["attendance", "fees", "gatePasses", "leaveRequests", "complaints"];
  for (const collectionId of checks) assertOk(`${label} ${collectionId}`, await query(auth.idToken, collectionId, linkedId));
  assertOk(`${label} notices`, await queryNotices(auth.idToken, { ...user.result.fields, ...studentFields }));
  const contacts = await firestore(auth.idToken, "emergencyContacts?pageSize=100");
  // Firestore collection listing may return 404 when the collection has no records.
  console.log(`${label} emergency contacts: HTTP ${contacts.status}${contacts.status === 404 ? " · empty" : ""}`);
  if (![200, 404].includes(contacts.status)) throw new Error(`${label} emergency contacts failed: ${JSON.stringify(contacts.result)}`);
  const movement = await firestore(auth.idToken, `inOutStatus/${linkedId}`);
  // An absent movement document is a valid empty state, but permission errors are not.
  console.log(`${label} inOutStatus: HTTP ${movement.status}${movement.status === 404 ? " · empty" : ""}`);
  if (![200, 404].includes(movement.status)) throw new Error(`${label} inOutStatus failed: ${JSON.stringify(movement.result)}`);
  return { auth, linkedId };
}

const parent = await runRole("parent", process.env.FIREBASE_SMOKE_PARENT_EMAIL, process.env.FIREBASE_SMOKE_PARENT_PASSWORD, "Parent");
await runRole("student", process.env.FIREBASE_SMOKE_STUDENT_EMAIL, process.env.FIREBASE_SMOKE_STUDENT_PASSWORD, "Student");
console.log(`PASS · parent linked student ID ${parent.linkedId} · Firebase project ${project}`);
