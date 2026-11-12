// Run:  npm i -D @firebase/rules-unit-testing firebase vitest   (or use node:test as below)
//       firebase emulators:exec --only firestore "node --test rules-tests/"
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { before, after, describe, it } from "node:test";

let env;
const db = (uid) => env.authenticatedContext(uid).firestore();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "hostel-rules-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    const u = (id, o) => setDoc(doc(d, "users", id), o);
    await u("admin", { role: "Admin" });
    await u("warden", { role: "Warden" });
    await u("sec", { role: "Security" });
    await u("stu1", { role: "Student" });
    await u("stu2", { role: "Student" });
    await u("par1", { role: "Parent", linkedStudentId: "stu1" });
    await u("par2", { role: "Parent", linkedStudentId: "stu2" });
    const pass = { studentId: "stu1", studentName: "A", from: "a", to: "b", type: "Home", reason: "r", status: "Approved", approvedBy: "W" };
    await setDoc(doc(d, "gatePasses", "fresh"), pass);
    await setDoc(doc(d, "gatePasses", "out"), { ...pass, tripState: "Out" });
    await setDoc(doc(d, "gatePasses", "out-legacy"), { ...pass, status: "Out" });
    await setDoc(doc(d, "gatePasses", "pending"), { ...pass, status: "Pending" });
    await setDoc(doc(d, "gatePasses", "done"), { ...pass, tripState: "Returned", status: "Completed" });
    await setDoc(doc(d, "attendance", "stu1_2026-09-28"), { studentId: "stu1", date: "2026-09-28", status: "Present", markedBy: "warden" });
    await setDoc(doc(d, "fees", "f1"), { studentId: "stu1", total: 100, paid: 0 });
    await setDoc(doc(d, "students", "stu1"), { room: "101", bed: "A" });
    await setDoc(doc(d, "notices", "n1"), { title: "t", isPublic: false });
    await setDoc(doc(d, "leaveRequests", "L1"), { studentId: "stu1", status: "Approved" });
    await setDoc(doc(d, "leaveRequests", "L2"), { studentId: "stu1", status: "Pending" });
    await setDoc(doc(d, "leaveLogs", "L0"), { leaveRequestId: "L0", status: "Left", studentId: "stu1" });
    await setDoc(doc(d, "gateLogs", "g0"), { studentId: "stu1", direction: "Out" });
    await setDoc(doc(d, "emergencyContacts", "e1"), { name: "Police" });
    await setDoc(doc(d, "visitors", "v1"), { name: "V", status: "In" });
    await setDoc(doc(d, "incidents", "i1"), { title: "x" });
  });
});
after(() => env.cleanup());

describe("attendance", () => {
  it("security reads/creates/updates, cannot delete", async () => {
    await assertSucceeds(getDoc(doc(db("sec"), "attendance", "stu1_2026-09-28")));
    await assertSucceeds(setDoc(doc(db("sec"), "attendance", "stu2_2026-09-28"), { studentId: "stu2", date: "2026-09-28", status: "Absent", markedBy: "sec" }));
    await assertSucceeds(updateDoc(doc(db("sec"), "attendance", "stu1_2026-09-28"), { status: "Absent", markedBy: "sec" }));
    await assertFails(deleteDoc(doc(db("sec"), "attendance", "stu1_2026-09-28")));
  });
  it("security cannot forge markedBy or move a record", async () => {
    await assertFails(setDoc(doc(db("sec"), "attendance", "stu2_2026-09-29"), { studentId: "stu2", date: "2026-09-29", status: "Absent", markedBy: "warden" }));
    await assertFails(updateDoc(doc(db("sec"), "attendance", "stu1_2026-09-28"), { studentId: "stu2", markedBy: "sec" }));
  });
  it("student/parent see only own/linked child", async () => {
    await assertSucceeds(getDoc(doc(db("stu1"), "attendance", "stu1_2026-09-28")));
    await assertSucceeds(getDoc(doc(db("par1"), "attendance", "stu1_2026-09-28")));
    await assertSucceeds(getDocs(query(collection(db("par1"), "attendance"), where("studentId", "==", "stu1"))));
    await assertSucceeds(getDocs(query(collection(db("par1"), "fees"), where("studentId", "==", "stu1"))));
    await assertSucceeds(getDocs(query(collection(db("par1"), "gatePasses"), where("studentId", "==", "stu1"))));
    await assertSucceeds(getDocs(query(collection(db("par1"), "leaveRequests"), where("studentId", "==", "stu1"))));
    await assertFails(getDoc(doc(db("stu2"), "attendance", "stu1_2026-09-28")));
    await assertFails(getDoc(doc(db("par2"), "attendance", "stu1_2026-09-28")));
  });
  it("lets staff mark an unlinked registration row without exposing it to other students/parents", async () => {
    const record = { studentId: "reg:2301104001", registrationNo: "2301104001", date: "2026-09-30", status: "Present", markedBy: "sec" };
    await assertSucceeds(setDoc(doc(db("sec"), "attendance", "reg:2301104001_2026-09-30"), record));
    await assertFails(getDoc(doc(db("stu1"), "attendance", "reg:2301104001_2026-09-30")));
    await assertFails(getDoc(doc(db("par1"), "attendance", "reg:2301104001_2026-09-30")));
  });
});

describe("profile photos", () => {
  it("allows a user to save a compressed photo to their own profile only", async () => {
    await assertSucceeds(updateDoc(doc(db("stu1"), "users", "stu1"), { photoURL: `data:image/jpeg;base64,${"a".repeat(1000)}` }));
    await assertFails(updateDoc(doc(db("stu1"), "users", "stu2"), { photoURL: "data:image/jpeg;base64,abc" }));
    await assertFails(updateDoc(doc(db("stu1"), "users", "stu1"), { photoURL: `data:image/jpeg;base64,${"a".repeat(280001)}` }));
  });
});

describe("gate passes", () => {
  const p = (id) => doc(db("sec"), "gatePasses", id);
  it("security reads", () => assertSucceeds(getDoc(p("fresh"))));
  it("OUT ok; RETURN ok", async () => {
    await assertSucceeds(updateDoc(p("fresh"), { status: "Out", tripState: "Out", exitTime: serverTimestamp(), scannedBy: "Guard", scannedByUid: "sec", updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(p("out"), { tripState: "Returned", status: "Completed", entryTime: serverTimestamp(), returnedAt: serverTimestamp(), returnedByUid: "sec", updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(p("out-legacy"), { tripState: "Returned", status: "Completed", entryTime: serverTimestamp(), returnedAt: serverTimestamp(), returnedByUid: "sec", updatedAt: serverTimestamp() }));
  });
  it("cannot touch protected fields, even with a valid transition", async () => {
    for (const extra of [{ studentId: "x" }, { studentName: "x" }, { from: "x" }, { to: "x" }, { type: "x" }, { reason: "x" }, { approvedBy: "x" }])
      await assertFails(updateDoc(doc(db("sec"), "gatePasses", "out"), { tripState: "Returned", status: "Completed", entryTime: serverTimestamp(), returnedAt: serverTimestamp(), returnedByUid: "sec", ...extra }));
  });
  it("cannot approve/reject/reopen", async () => {
    await assertFails(updateDoc(p("pending"), { status: "Approved" }));
    await assertFails(updateDoc(p("pending"), { status: "Rejected" }));
    await assertFails(updateDoc(p("done"), { tripState: "Out", status: "Approved" }));
    await assertFails(deleteDoc(p("fresh")));
  });
  it("student/parent cannot complete a pass (precedence-bug regression)", async () => {
    await assertFails(updateDoc(doc(db("stu1"), "gatePasses", "out"), { tripState: "Returned", status: "Completed" }));
    await assertFails(updateDoc(doc(db("par1"), "gatePasses", "out"), { tripState: "Returned", status: "Completed" }));
  });
});

describe("logs, visitors, incidents", () => {
  it("gateLogs: create/read ok, no modify/delete", async () => {
    await assertSucceeds(setDoc(doc(db("sec"), "gateLogs", "g1"), { studentId: "stu1", direction: "In" }));
    await assertSucceeds(getDoc(doc(db("sec"), "gateLogs", "g0")));
    await assertFails(updateDoc(doc(db("sec"), "gateLogs", "g0"), { direction: "In" }));
    await assertFails(deleteDoc(doc(db("sec"), "gateLogs", "g0")));
  });
  const leaveLog = (id) => ({ leaveRequestId: id, status: "Left", recordedByUid: "sec", leftAt: serverTimestamp() });
  it("leaveLogs: only for Approved leave; return is the only update; no delete", async () => {
    await assertSucceeds(setDoc(doc(db("sec"), "leaveLogs", "L1"), leaveLog("L1")));
    await assertFails(setDoc(doc(db("sec"), "leaveLogs", "L2"), leaveLog("L2")));
    await assertSucceeds(updateDoc(doc(db("sec"), "leaveLogs", "L1"), { status: "Returned", returnedAt: serverTimestamp(), returnedBy: "S", returnedByUid: "sec" }));
    await assertFails(updateDoc(doc(db("sec"), "leaveLogs", "L0"), { studentId: "other" }));
    await assertFails(deleteDoc(doc(db("sec"), "leaveLogs", "L0")));
  });
  it("leave requests: security can't approve/reject", async () => {
    await assertFails(updateDoc(doc(db("sec"), "leaveRequests", "L2"), { status: "Approved" }));
    await assertFails(getDoc(doc(db("sec"), "leaveRequests", "L2")));
  });
  it("visitors + incidents", async () => {
    await assertSucceeds(setDoc(doc(db("sec"), "visitors", "v2"), { name: "N", status: "In" }));
    await assertSucceeds(updateDoc(doc(db("sec"), "visitors", "v1"), { status: "Out" }));
    await assertFails(deleteDoc(doc(db("sec"), "visitors", "v1")));
    await assertSucceeds(setDoc(doc(db("sec"), "incidents", "i2"), { title: "y" }));
    await assertSucceeds(updateDoc(doc(db("sec"), "incidents", "i1"), { title: "z" }));
  });
});

describe("gate desk movement privacy", () => {
  it("lets security write guarded movement logs and status, while students and parents only read linked records", async () => {
    await assertSucceeds(setDoc(doc(db("sec"), "inOutLogs", "desk-out"), {
      studentId: "stu1", guardId: "sec", type: "OUT", direction: "Out", method: "manual", reason: "Medical appointment",
    }));
    await assertFails(setDoc(doc(db("sec"), "inOutLogs", "bad-guard"), {
      studentId: "stu1", guardId: "someone-else", type: "OUT", direction: "Out",
    }));
    await assertSucceeds(setDoc(doc(db("sec"), "inOutStatus", "stu1"), {
      studentId: "stu1", status: "OUT", reason: "Medical appointment",
    }));
    await assertSucceeds(getDoc(doc(db("stu1"), "inOutStatus", "stu1")));
    await assertSucceeds(getDoc(doc(db("par1"), "inOutStatus", "stu1")));
    await assertFails(getDoc(doc(db("stu2"), "inOutStatus", "stu1")));
    await assertFails(getDoc(doc(db("par2"), "inOutStatus", "stu1")));
    await assertSucceeds(getDoc(doc(db("stu1"), "inOutLogs", "desk-out")));
    await assertSucceeds(getDoc(doc(db("par1"), "inOutLogs", "desk-out")));
    await assertFails(getDoc(doc(db("stu2"), "inOutLogs", "desk-out")));
    await assertFails(getDoc(doc(db("par2"), "inOutLogs", "desk-out")));
  });
});

describe("other collections", () => {
  it("emergencyContacts & notices: read for Security/Parent, write staff only", async () => {
    for (const uid of ["sec", "par1", "stu1"]) {
      await assertSucceeds(getDoc(doc(db(uid), "emergencyContacts", "e1")));
      await assertSucceeds(getDoc(doc(db(uid), "notices", "n1")));
      await assertFails(setDoc(doc(db(uid), "emergencyContacts", "e9"), { name: "x" }));
      await assertFails(setDoc(doc(db(uid), "notices", "n9"), { title: "x" }));
    }
    await assertSucceeds(setDoc(doc(db("warden"), "emergencyContacts", "e9"), { name: "x" }));
    await assertSucceeds(setDoc(doc(db("admin"), "notices", "n8"), { title: "x", isPublic: false }));
  });
  it("security can't touch students/fees; student/parent fee privacy holds", async () => {
    await assertFails(updateDoc(doc(db("sec"), "students", "stu1"), { room: "999" }));
    await assertFails(getDoc(doc(db("sec"), "fees", "f1")));
    await assertFails(updateDoc(doc(db("sec"), "fees", "f1"), { paid: 100 }));
    await assertSucceeds(getDoc(doc(db("stu1"), "fees", "f1")));
    await assertSucceeds(getDoc(doc(db("par1"), "fees", "f1")));
    await assertFails(getDoc(doc(db("stu2"), "fees", "f1")));
    await assertFails(getDoc(doc(db("par2"), "fees", "f1")));
  });
  it("unauthenticated is denied", async () => {
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "attendance", "stu1_2026-09-28")));
  });
});
