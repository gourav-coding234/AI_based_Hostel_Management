// ---------------------------------------------------------------------------
// Mock/demo data for the Admin Dashboard.
// This is UI-only sample data — nothing here talks to Firebase or any API.
// Real numbers should eventually come from aggregating the `users`,
// `complaints`, `fees`, etc. Firestore collections once those exist.
// ---------------------------------------------------------------------------

// ---- Blocks / hostels ------------------------------------------------------
export const blocks = [
  { id: "BLK-A", name: "A Wing", type: "Boys", warden: "Satyabrata Mishra", totalRooms: 60, totalBeds: 180, occupiedBeds: 158 },
  { id: "BLK-B", name: "B Wing", type: "Boys", warden: "Rajesh Kumar Naik", totalRooms: 65, totalBeds: 195, occupiedBeds: 190 },
  { id: "BLK-C", name: "C Wing", type: "Girls", warden: "Sunita Pattnaik", totalRooms: 50, totalBeds: 150, occupiedBeds: 121 },
];

// ---- Overview / analytics ---------------------------------------------------
export const overviewStats = {
  totalStudents: 469,
  totalWardens: blocks.length,
  totalBlocks: blocks.length,
  gatePassesToday: 14,
};

export const enrollmentTrend = [
  { month: "Mar", students: 402 },
  { month: "Apr", students: 418 },
  { month: "May", students: 431 },
  { month: "Jun", students: 445 },
  { month: "Jul", students: 458 },
  { month: "Aug", students: 469 },
];

// ---- Wardens ----------------------------------------------------------------
export const wardens = [
  { id: "WRD-01", name: "Satyabrata Mishra", email: "s.mishra@gcek.ac.in", phone: "9861200001", block: "A Wing", studentsManaged: 158, joined: "12 Jul 2022", status: "Active" },
  { id: "WRD-02", name: "Rajesh Kumar Naik", email: "r.naik@gcek.ac.in", phone: "9861200002", block: "B Wing", studentsManaged: 190, joined: "03 Jan 2021", status: "Active" },
  { id: "WRD-03", name: "Sunita Pattnaik", email: "s.pattnaik@gcek.ac.in", phone: "9861200003", block: "C Wing", studentsManaged: 121, joined: "22 Aug 2023", status: "Active" },
  { id: "WRD-04", name: "Debendra Sahu", email: "d.sahu@gcek.ac.in", phone: "9861200004", block: "Unassigned", studentsManaged: 0, joined: "01 Aug 2026", status: "On leave" },
];

// ---- Institute-wide complaints (rolled up across all blocks) ---------------
export const allBlockComplaints = [
  { id: "CMP-233", student: "Aman Sahoo", block: "B Wing", room: "B-204", category: "Room", title: "Fan not working", status: "In Progress", date: "07 Aug 2026", priority: "Medium", assignedTo: "Electrician" },
  { id: "CMP-227", student: "Debasish Rout", block: "B Wing", room: "B-201", category: "Wing", title: "Corridor light fused", status: "Open", date: "05 Aug 2026", priority: "Low", assignedTo: "" },
  { id: "CMP-219", student: "Priya Mishra", block: "B Wing", room: "B-202", category: "Food", title: "Water cooler leaking", status: "Resolved", date: "29 Jul 2026", priority: "Medium", assignedTo: "Plumber" },
  { id: "CMP-236", student: "Rashmi Behera", block: "B Wing", room: "B-203", category: "Room", title: "Door lock jammed", status: "Open", date: "10 Aug 2026", priority: "High", assignedTo: "" },
  { id: "CMP-241", student: "Rakesh Mallick", block: "A Wing", room: "A-101", category: "Room", title: "Window latch broken", status: "Open", date: "11 Aug 2026", priority: "Medium", assignedTo: "" },
  { id: "CMP-238", student: "Alok Mohanty", block: "A Wing", room: "C-301", category: "Wing", title: "Wi-Fi router down on 3rd floor", status: "In Progress", date: "09 Aug 2026", priority: "High", assignedTo: "IT Support" },
  { id: "CMP-244", student: "Manisha Jena", block: "C Wing", room: "B-203", category: "Food", title: "Mess bill discrepancy", status: "Open", date: "11 Aug 2026", priority: "Medium", assignedTo: "" },
];

// ---- Institute-wide fee collection ------------------------------------------
export const feeOverviewByBlock = [
  { block: "A Wing", totalDue: 12240000, collected: 11150000, students: 158 },
  { block: "B Wing", totalDue: 13260000, collected: 12680000, students: 190 },
  { block: "C Wing", totalDue: 10200000, collected: 8430000, students: 121 },
];

export const feeDefaultersTop = [
  { name: "Priyanshu Dash", block: "B Wing", room: "B-204", due: 48000, dueDate: "31 Aug 2026" },
  { name: "Priya Mishra", block: "B Wing", room: "B-202", due: 68000, dueDate: "15 Aug 2026" },
  { name: "Manisha Jena", block: "C Wing", room: "B-203", due: 41000, dueDate: "15 Aug 2026" },
  { name: "Ritesh Nayak", block: "B Wing", room: "B-204", due: 22000, dueDate: "31 Aug 2026" },
];

// ---- Institute-wide notices --------------------------------------------------
export const instituteNotices = [
  { id: "INTC-14", title: "Semester fee installment 3 due 31 Aug", date: "05 Aug 2026", target: "All Hostels", priority: "Urgent", body: "Third installment of hostel & mess fees is due by 31 Aug 2026 across all blocks. Late payments attract a fine after the due date." },
  { id: "INTC-12", title: "Independence Day — hostel closed for outings after 6 PM", date: "08 Aug 2026", target: "All Hostels", priority: "Event", body: "In view of Independence Day celebrations, all students must be back in their respective hostels by 6 PM on 14–15 Aug." },
  { id: "INTC-09", title: "Annual hostel inspection — 18 Aug", date: "10 Aug 2026", target: "All Hostels", priority: "General", body: "The annual hostel inspection committee will visit all wings on 18 Aug starting 10 AM. Please keep rooms tidy." },
];

export const instituteNoticeTargets = ["All Hostels", "A Wing", "B Wing", "C Wing"];
export const instituteNoticePriorities = ["General", "Urgent", "Event"];

// ---- Reports (export center) -------------------------------------------------
export const reportTypes = [
  { id: "RPT-STU", name: "Student directory", description: "Full list of residents with room, block and contact details.", rows: 469 },
  { id: "RPT-FEE", name: "Fee collection summary", description: "Block-wise dues, collections and outstanding balances.", rows: feeOverviewByBlock.length },
  { id: "RPT-OCC", name: "Occupancy report", description: "Room and bed occupancy across every block.", rows: blocks.length },
  { id: "RPT-CMP", name: "Complaints log", description: "All complaints filed institute-wide with current status.", rows: allBlockComplaints.length },
];

// ---- Audit log ----------------------------------------------------------------
export const auditLog = [
  { id: "LOG-501", actor: "Admin (you)", action: "Created account", target: "Debendra Sahu (Warden)", timestamp: "11 Aug 2026, 4:12 PM" },
  { id: "LOG-500", actor: "Admin (you)", action: "Bulk imported", target: "24 student accounts via CSV", timestamp: "10 Aug 2026, 11:03 AM" },
  { id: "LOG-497", actor: "Rajesh Kumar Naik (Warden)", action: "Resolved complaint", target: "CMP-219 — Water cooler leaking", timestamp: "29 Jul 2026, 6:40 PM" },
  { id: "LOG-492", actor: "Admin (you)", action: "Published notice", target: "INTC-14 — Semester fee installment 3", timestamp: "05 Aug 2026, 9:15 AM" },
  { id: "LOG-488", actor: "Sunita Pattnaik (Warden)", action: "Allotted bed", target: "C-301, Bed 2 → Manisha Jena", timestamp: "01 Aug 2026, 2:50 PM" },
  { id: "LOG-480", actor: "Admin (you)", action: "Deactivated account", target: "Former warden — A Wing (2023 batch)", timestamp: "22 Jul 2026, 10:20 AM" },
];
