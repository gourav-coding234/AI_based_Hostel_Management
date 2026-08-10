// ---------------------------------------------------------------------------
// Mock/demo data for the Student Dashboard.
// This is UI-only sample data — nothing here talks to Firebase or any API.
// Replace with real data fetching once the backend endpoints exist.
// ---------------------------------------------------------------------------

export const myAllocation = {
  status: "Allotted", // "Allotted" | "Waiting"
  wing: "B Wing",
  floor: "2nd Floor",
  room: "B-204",
  bed: "Bed 2",
  roommates: [
    { name: "Aman Sahoo", bed: "Bed 1" },
    { name: "Ritesh Nayak", bed: "Bed 3" },
  ],
  allottedOn: "12 Jul 2026",
};

// A small slice of the wing so the vacancy grid has something real to show.
export const wingRooms = [
  { room: "B-201", capacity: 3, beds: [
    { bed: 1, status: "occupied", student: "Suman Patra" },
    { bed: 2, status: "occupied", student: "Debasish Rout" },
    { bed: 3, status: "vacant" },
  ]},
  { room: "B-202", capacity: 3, beds: [
    { bed: 1, status: "occupied", student: "Priya Mishra" },
    { bed: 2, status: "vacant" },
    { bed: 3, status: "vacant" },
  ]},
  { room: "B-203", capacity: 3, beds: [
    { bed: 1, status: "occupied", student: "Kabita Sethi" },
    { bed: 2, status: "occupied", student: "Rashmi Behera" },
    { bed: 3, status: "occupied", student: "Manisha Jena" },
  ]},
  { room: "B-204", capacity: 3, beds: [
    { bed: 1, status: "occupied", student: "Aman Sahoo" },
    { bed: 2, status: "occupied", student: "You", isSelf: true },
    { bed: 3, status: "occupied", student: "Ritesh Nayak" },
  ]},
  { room: "B-205", capacity: 3, beds: [
    { bed: 1, status: "occupied", student: "Bikash Sahu" },
    { bed: 2, status: "vacant" },
    { bed: 3, status: "occupied", student: "Chinmay Das" },
  ]},
  { room: "B-206", capacity: 3, beds: [
    { bed: 1, status: "vacant" },
    { bed: 2, status: "vacant" },
    { bed: 3, status: "vacant" },
  ]},
];

export const roomWaitingList = [
  { name: "Soumya Ranjan", requestedOn: "02 Aug 2026", reason: "Room change — near exam block", priority: "Normal" },
  { name: "Ipsita Nayak", requestedOn: "05 Aug 2026", reason: "New allotment — semester transfer", priority: "High" },
  { name: "Tanmay Rout", requestedOn: "08 Aug 2026", reason: "Room change — roommate conflict", priority: "Normal" },
];

// ---------------------------------------------------------------------------
export const feeSummary = {
  total: 68000,
  paid: 46000,
  dueDate: "31 Aug 2026",
};

export const feePayments = [
  { date: "10 Jul 2026", label: "Semester Installment 2", amount: 26000, mode: "UPI", receipt: "RCPT-2291" },
  { date: "02 Feb 2026", label: "Semester Installment 1", amount: 20000, mode: "Net Banking", receipt: "RCPT-1938" },
];

export const feeNotifications = [
  { date: "05 Aug 2026", from: "Warden Office", message: "Installment 3 (₹22,000) is due by 31 Aug 2026. Late payment attracts a ₹200/week fine." },
  { date: "12 Jul 2026", from: "Warden Office", message: "Installment 2 payment received and confirmed. Thank you." },
];

// ---------------------------------------------------------------------------
export const messMenuToday = {
  breakfast: "Poha, Boiled Egg, Tea/Coffee",
  lunch: "Rice, Dal, Mix Veg, Curd, Papad",
  dinner: "Chapati, Paneer Curry, Rice, Salad",
};

export const initialMessReports = [
  { id: "MR-104", date: "09 Aug 2026", type: "Food Shortage", description: "Rice ran out at dinner around 8:40 PM in B Wing mess hall.", status: "Resolved" },
  { id: "MR-101", date: "03 Aug 2026", type: "Utensils Shortage", description: "Only a few steel plates left during lunch rush.", status: "In Progress" },
];

export const messReportTypes = ["Utensils Shortage", "Food Shortage", "Quality Issue", "Other"];

// ---------------------------------------------------------------------------
// Attendance is normally a warden action, but per request the student
// dashboard includes a demo panel to mark/view room & wing dinner attendance.
export const attendanceWing = [
  { room: "B-201", students: [
    { name: "Suman Patra", present: true },
    { name: "Debasish Rout", present: true },
  ]},
  { room: "B-202", students: [
    { name: "Priya Mishra", present: true },
  ]},
  { room: "B-203", students: [
    { name: "Kabita Sethi", present: true },
    { name: "Rashmi Behera", present: false },
    { name: "Manisha Jena", present: true },
  ]},
  { room: "B-204", students: [
    { name: "Aman Sahoo", present: true },
    { name: "You", present: true, isSelf: true },
    { name: "Ritesh Nayak", present: true },
  ]},
  { room: "B-205", students: [
    { name: "Bikash Sahu", present: true },
    { name: "Chinmay Das", present: true },
  ]},
];

export const attendanceHistory = [
  { date: "Mon", pct: 96 },
  { date: "Tue", pct: 100 },
  { date: "Wed", pct: 91 },
  { date: "Thu", pct: 100 },
  { date: "Fri", pct: 87 },
  { date: "Sat", pct: 95 },
  { date: "Sun", pct: 100 },
];

// ---------------------------------------------------------------------------
export const initialGatePasses = [
  {
    id: "GP-1042",
    type: "Home Visit",
    reason: "Rakhi festival at home",
    from: "15 Aug 2026, 08:00 AM",
    to: "18 Aug 2026, 08:00 PM",
    status: "Approved",
    tripState: "Not started", // "Not started" | "Out" | "Returned"
  },
  {
    id: "GP-1031",
    type: "Outing",
    reason: "Bank work in town",
    from: "28 Jul 2026, 10:00 AM",
    to: "28 Jul 2026, 06:00 PM",
    status: "Completed",
    tripState: "Returned",
  },
  {
    id: "GP-1027",
    type: "Medical",
    reason: "Dental appointment",
    from: "20 Jul 2026, 09:00 AM",
    to: "20 Jul 2026, 01:00 PM",
    status: "Completed",
    tripState: "Returned",
  },
];

export const gatePassTypes = ["Outing", "Home Visit", "Medical", "Other"];

// ---------------------------------------------------------------------------
export const initialComplaints = [
  { id: "CMP-233", category: "Room", title: "Fan not working", description: "Ceiling fan in B-204 makes a loud noise and spins slowly.", status: "In Progress", date: "07 Aug 2026", priority: "Medium" },
  { id: "CMP-227", category: "Wing", title: "Corridor light fused", description: "Second light from the stairs on B Wing 2nd floor is out.", status: "Open", date: "05 Aug 2026", priority: "Low" },
  { id: "CMP-219", category: "Food", title: "Water cooler leaking", description: "Water cooler near the mess entrance is leaking onto the floor.", status: "Resolved", date: "29 Jul 2026", priority: "Medium" },
];

export const complaintCategories = ["Room", "Wing", "Food", "Other"];

// ---------------------------------------------------------------------------
export const roomInventory = [
  { item: "Bed", quantity: 3, condition: "Good" },
  { item: "Study Table", quantity: 3, condition: "Good" },
  { item: "Chair", quantity: 3, condition: "One wobbly" },
  { item: "Cupboard", quantity: 3, condition: "Good" },
];

export const initialInventoryRequests = [
  { id: "INV-58", item: "Chair", quantity: 1, reason: "Existing chair leg is broken", status: "Approved", date: "01 Aug 2026" },
  { id: "INV-52", item: "Extra Bed", quantity: 1, reason: "Guest stay approved by warden", status: "Rejected", date: "18 Jul 2026" },
];

export const inventoryItemTypes = ["Extra Bed", "Study Table", "Chair", "Cupboard", "Other"];

// ---------------------------------------------------------------------------
export const notices = [
  { id: "NTC-91", title: "Hostel gates close at 9:30 PM sharp", date: "10 Aug 2026", postedBy: "Warden", priority: "Urgent", body: "Effective immediately, main gate entry closes at 9:30 PM on weekdays. Students returning later must have prior written permission from the warden." },
  { id: "NTC-89", title: "Water supply maintenance on 13 Aug", date: "09 Aug 2026", postedBy: "Admin", priority: "General", body: "Water supply to B and C Wings will be interrupted between 10 AM and 2 PM on 13 Aug for tank cleaning. Please store water in advance." },
  { id: "NTC-85", title: "Independence Day cultural night", date: "06 Aug 2026", postedBy: "Warden", priority: "Event", body: "Hostel cultural night on 14 Aug at 7 PM in the common hall. Sign up sheets are with your wing representatives." },
  { id: "NTC-80", title: "Mess fee installment 3 due 31 Aug", date: "05 Aug 2026", postedBy: "Admin", priority: "Urgent", body: "Third installment of hostel & mess fees is due by 31 Aug 2026. Pay via the Fees tab or at the accounts office." },
];
