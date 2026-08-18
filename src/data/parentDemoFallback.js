// Sample content shown on a Parent dashboard section ONLY when that
// section has zero real Firestore records yet (e.g. the fees office hasn't
// posted anything, or the warden hasn't logged attendance for this student
// yet). This never overrides real data — every page checks the real query
// result first, and only reaches for this when that result is empty. Every
// place this is used also shows a small "Sample data" label, so nobody
// mistakes it for the real thing.

export const demoTotalFee = 45000;

export const demoFeePayments = [
  { id: "demo-f1", date: "18 Apr 2026", label: "Semester fee — installment 1", amount: 15000, mode: "UPI", receipt: "RCPT-1042" },
  { id: "demo-f2", date: "02 Jul 2026", label: "Semester fee — installment 2", amount: 15000, mode: "Net Banking", receipt: "RCPT-1198" },
];

// ~14 days of sample attendance, most recent last (matches the real
// collection's orderByField: "date", ascending).
export const demoAttendance = [
  { id: "demo-a1", date: "2026-07-28", status: "Present" },
  { id: "demo-a2", date: "2026-07-29", status: "Present" },
  { id: "demo-a3", date: "2026-07-30", status: "Present" },
  { id: "demo-a4", date: "2026-07-31", status: "Leave" },
  { id: "demo-a5", date: "2026-08-01", status: "Present" },
  { id: "demo-a6", date: "2026-08-02", status: "Present" },
  { id: "demo-a7", date: "2026-08-03", status: "Absent" },
  { id: "demo-a8", date: "2026-08-04", status: "Present" },
  { id: "demo-a9", date: "2026-08-05", status: "Present" },
  { id: "demo-a10", date: "2026-08-06", status: "Present" },
  { id: "demo-a11", date: "2026-08-07", status: "Present" },
  { id: "demo-a12", date: "2026-08-08", status: "Present" },
  { id: "demo-a13", date: "2026-08-09", status: "Present" },
  { id: "demo-a14", date: "2026-08-10", status: "Present" },
];

export const demoGatePasses = [
  {
    id: "demo-gp1",
    type: "Home Visit",
    reason: "Rakhi festival at home",
    from: "2026-08-15 08:00 AM",
    to: "2026-08-18 08:00 PM",
    status: "Approved",
    tripState: "Not started",
  },
  {
    id: "demo-gp2",
    type: "Outing",
    reason: "Bank work in town",
    from: "2026-07-28 10:00 AM",
    to: "2026-07-28 06:00 PM",
    status: "Completed",
    tripState: "Returned",
  },
];

export const demoRoomRecord = {
  wing: "B-Wing",
  floor: "2nd Floor",
  room: "B-204",
  bed: "Bed 2",
  allottedOn: "12 Jun 2026",
  roommates: [
    { name: "Aman Sahoo", bed: "Bed 1" },
    { name: "Ritesh Nayak", bed: "Bed 3" },
  ],
};
