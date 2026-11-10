import * as student from "./studentMock";
import * as admin from "./adminMock";
import * as warden from "./wardenMock";
import * as security from "./securityMock";
import { demoRoomRecord } from "./parentDemoFallback";

export const DEMO_STUDENT_ID = "demo-student-2201";

export function isDemoMode() {
  if (typeof window === "undefined") return false;
  const requested = new URLSearchParams(window.location.search).get("demo");
  if (requested === "1") window.localStorage.setItem("hostel-demo-mode", "1");
  if (requested === "0") window.localStorage.removeItem("hostel-demo-mode");
  return window.localStorage.getItem("hostel-demo-mode") === "1";
}

const studentRows = warden.studentDirectory.map((s, index) => ({
  ...s,
  email: `student${index + 1}@demo.hostel.test`,
  studentId: s.id,
  registrationNo: `23011040${String(50 + index).slice(-2)}`,
  room: s.room || "B-204",
  bed: `Bed ${(index % 3) + 1}`,
  hostelResidence: s.wing || "B Wing",
  status: "Active",
}));

const fees = warden.studentFees.map((f, index) => ({
  ...f,
  studentId: index === 0 ? DEMO_STUDENT_ID : f.id,
  total: index === 0 ? 45000 : f.total,
  paid: index === 0 ? 30000 : f.paid,
  amount: index === 0 ? 45000 : f.total,
  paidAmount: index === 0 ? 30000 : f.paid,
  dueDate: index === 0 ? "2026-12-31" : f.dueDate === "—" ? "2026-12-31" : f.dueDate,
  date: "2026-11-01",
}));

const attendance = Array.from({ length: 9 }, (_, index) => ({
  id: `demo-att-${index + 1}`,
  studentId: DEMO_STUDENT_ID,
  studentName: "Aman Sahoo",
  date: `2026-11-${String(index + 1).padStart(2, "0")}`,
  status: index === 3 ? "Absent" : index === 6 ? "Leave" : "Present",
  markedByName: "Warden (demo)",
}));
const gatePasses = admin.allGatePasses.map((p, index) => ({
  ...p,
  studentId: index === 0 ? DEMO_STUDENT_ID : p.studentId || `demo-student-${2201 + index}`,
  from: p.from,
  to: p.to,
  date: "2026-11-09",
}));
const complaints = warden.allComplaints.map((c, index) => ({
  ...c,
  studentId: index === 0 ? DEMO_STUDENT_ID : `demo-student-${2201 + index}`,
  studentName: c.student,
}));
const leaveRequests = admin.leaveRequests.map((r, index) => ({ ...r, studentId: index === 0 ? DEMO_STUDENT_ID : `demo-student-${2201 + index}`, date: r.from }));
const notices = (admin.instituteNotices || warden.wardenNotices || student.notices).map((n) => ({ ...n, date: n.date || "2026-11-09" }));
const gateLogs = security.initialInOutLog.map((r) => ({ ...r, studentId: DEMO_STUDENT_ID, timeSort: r.time }));
const visitors = [...admin.allVisitors, ...security.initialVisitors].map((v, index) => ({ ...v, inTimeSort: v.checkIn || v.inTime || "2026-11-09", studentId: index === 0 ? DEMO_STUDENT_ID : "demo-student-2202" }));
const feedback = admin.feedbackEntries.map((f, index) => ({ ...f, studentId: index === 0 ? DEMO_STUDENT_ID : `demo-student-${2201 + index}` }));
const users = [
  ...studentRows.map((s) => ({ id: s.id, uid: s.id, studentId: s.id, name: s.name, email: s.email, role: "Student", status: "Active", hostelResidence: s.hostelResidence })),
  ...admin.wardens.map((w) => ({ ...w, role: "Warden" })),
  { id: "demo-admin", uid: "demo-admin", name: "Gourav Samal", email: "admin@demo.hostel.test", role: "Admin", status: "Active" },
  { id: "demo-security", uid: "demo-security", name: "Bikash Sahu", email: "security@demo.hostel.test", role: "Security", status: "Active" },
];

const collections = {
  blocks: admin.blocks,
  students: studentRows,
  users,
  studentRegister: studentRows.map((s) => ({ ...s, regNo: s.registrationNo })),
  attendance,
  fees,
  complaints,
  notices,
  gatePasses,
  leaveRequests,
  visitors,
  gateLogs,
  leaveLogs: [{ id: "demo-leave-log-1", studentId: DEMO_STUDENT_ID, student: "Aman Sahoo", direction: "Out", time: "2026-11-09 10:00 AM" }],
  dutyRoster: security.dutyRoster,
  incidents: security.initialIncidents,
  emergencyContacts: security.emergencyContacts,
  inventory: warden.hostelInventory,
  inventoryRequests: warden.inventoryRequests.map((r, index) => ({ ...r, studentId: index === 0 ? DEMO_STUDENT_ID : `demo-student-${2201 + index}` })),
  messMenu: [{ id: "current", ...student.messMenuToday, ...warden.weekMenu }],
  messReports: warden.messReports,
  feedback,
  expenses: [{ id: "EXP-104", description: "Routine maintenance", category: "Maintenance", amount: 12500, date: "2026-11-04", status: "Paid" }],
  auditLogs: admin.auditLog,
  roomRequests: warden.roomRequests.map((r, index) => ({ ...r, studentId: `demo-student-${2201 + index}` })),
  parentNotifications: [{ id: "demo-parent-notice", studentId: DEMO_STUDENT_ID, title: "Monthly attendance updated", date: "2026-11-09", message: "Sample attendance has been recorded for this demo." }],
};

function applyWhere(rows, clauses = []) {
  return clauses.reduce((items, [field, op, value]) => {
    if (field === "studentId" && value !== DEMO_STUDENT_ID) return items;
    return items.filter((row) => {
      const actual = row[field];
      if (op === "==") return actual === value;
      if (op === "in") return Array.isArray(value) && value.includes(actual);
      if (op === ">=") return actual >= value;
      if (op === "<=") return actual <= value;
      return true;
    });
  }, rows);
}

export function getDemoCollection(name, options = {}) {
  let rows = collections[name] || [];
  rows = applyWhere(rows, options.where || []);
  if (options.orderByField) {
    const sign = options.orderByDirection === "asc" ? 1 : -1;
    rows = [...rows].sort((a, b) => String(a[options.orderByField] ?? "").localeCompare(String(b[options.orderByField] ?? "")) * sign);
  }
  if (options.limitCount) rows = rows.slice(0, options.limitCount);
  return rows.map((row) => ({ ...row }));
}

export function getDemoDocument(name, id) {
  if (name === "students") return { id: DEMO_STUDENT_ID, ...studentRows[0], ...demoRoomRecord };
  if (name === "messMenu") return collections.messMenu[0];
  return getDemoCollection(name).find((row) => row.id === id) || null;
}

export function getDemoStudentCollection(name, studentId = DEMO_STUDENT_ID) {
  return getDemoCollection(name, { where: [["studentId", "==", DEMO_STUDENT_ID]] })
    .map((row) => ({ ...row, studentId }));
}

