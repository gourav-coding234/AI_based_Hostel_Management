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

// ---- Visitor management (institute-wide oversight) --------------------------
export const allVisitors = [
  { id: "V-515", name: "Ipsita Rani Das", block: "C Wing", purpose: "Parent visit — Manisha Jena, C-301", idProof: "Aadhaar — last 4: 7732", checkIn: "11 Aug 2026, 03:00 PM", checkOut: "", status: "On premises" },
  { id: "V-512", name: "Rajendra Panda", block: "B Wing", purpose: "Meeting son — Priyanshu Panda, B-204", idProof: "Aadhaar — last 4: 4471", checkIn: "10 Aug 2026, 05:30 PM", checkOut: "10 Aug 2026, 06:45 PM", status: "Checked out" },
  { id: "V-509", name: "Suresh Kumar (courier)", block: "B Wing", purpose: "Package delivery", idProof: "Company ID", checkIn: "10 Aug 2026, 11:10 AM", checkOut: "10 Aug 2026, 11:20 AM", status: "Checked out" },
  { id: "V-503", name: "Bibhuti Bhusan Nayak", block: "A Wing", purpose: "Meeting son — Rakesh Mallick, A-101", idProof: "Voter ID", checkIn: "09 Aug 2026, 06:10 PM", checkOut: "09 Aug 2026, 07:00 PM", status: "Checked out" },
  { id: "V-499", name: "Priyanka Swain", block: "C Wing", purpose: "Parent visit — Priya Mishra, B-202", idProof: "Aadhaar — last 4: 1190", checkIn: "07 Aug 2026, 04:20 PM", checkOut: "07 Aug 2026, 05:10 PM", status: "Checked out" },
];

// ---- Gate pass management (institute-wide oversight) ------------------------
export const allGatePasses = [
  { id: "GP-1046", student: "Rakesh Mallick", block: "A Wing", room: "A-101", type: "Outing", reason: "Family function", from: "12 Aug 2026, 10:00 AM", to: "12 Aug 2026, 08:00 PM", status: "Pending", tripState: "Not started" },
  { id: "GP-1044", student: "Manisha Jena", block: "C Wing", room: "C-301", type: "Medical", reason: "Hospital follow-up", from: "11 Aug 2026, 09:00 AM", to: "11 Aug 2026, 01:00 PM", status: "Rejected", tripState: "Not started" },
  { id: "GP-1042", student: "Priyanshu Panda", block: "B Wing", room: "B-204", type: "Home Visit", reason: "Rakhi festival at home", from: "15 Aug 2026, 08:00 AM", to: "18 Aug 2026, 08:00 PM", status: "Approved", tripState: "Not started" },
  { id: "GP-1039", student: "Aman Sahoo", block: "B Wing", room: "B-204", type: "Outing", reason: "Local market", from: "10 Aug 2026, 04:00 PM", to: "10 Aug 2026, 07:00 PM", status: "Approved", tripState: "Out" },
  { id: "GP-1031", student: "Ritesh Nayak", block: "B Wing", room: "B-204", type: "Outing", reason: "Bank work in town", from: "28 Jul 2026, 10:00 AM", to: "28 Jul 2026, 06:00 PM", status: "Completed", tripState: "Returned" },
  { id: "GP-1027", student: "Suman Patra", block: "A Wing", room: "A-108", type: "Medical", reason: "Dental appointment", from: "20 Jul 2026, 09:00 AM", to: "20 Jul 2026, 01:00 PM", status: "Completed", tripState: "Returned" },
];

// ---- Leave management (institute-wide oversight) ----------------------------
export const leaveRequests = [
  { id: "LV-233", student: "Manisha Jena", block: "C Wing", room: "C-301", type: "Personal", reason: "Family emergency", from: "11 Aug 2026", to: "13 Aug 2026", status: "Pending", parentNotified: false },
  { id: "LV-231", student: "Rashmi Behera", block: "B Wing", room: "B-203", type: "Home Leave", reason: "Sister's wedding", from: "20 Aug 2026", to: "25 Aug 2026", status: "Pending", parentNotified: false },
  { id: "LV-228", student: "Alok Mohanty", block: "A Wing", room: "C-301", type: "Medical Leave", reason: "Fever, prescribed rest", from: "09 Aug 2026", to: "12 Aug 2026", status: "Approved", parentNotified: true },
  { id: "LV-225", student: "Priya Mishra", block: "B Wing", room: "B-202", type: "Home Leave", reason: "Festival at home", from: "14 Aug 2026", to: "16 Aug 2026", status: "Approved", parentNotified: true },
  { id: "LV-219", student: "Debasish Rout", block: "B Wing", room: "B-201", type: "Personal", reason: "Court document work", from: "02 Aug 2026", to: "03 Aug 2026", status: "Rejected", parentNotified: false },
];

export const leaveTypes = ["Home Leave", "Medical Leave", "Personal"];

// ---- Safety & emergency module -----------------------------------------------
export const sosAlerts = [
  { id: "SOS-14", student: "Debasish Rout", block: "B Wing", room: "B-201", time: "11 Aug 2026, 11:42 PM", status: "Resolved", note: "False alarm — accidental trigger, confirmed safe by warden." },
  { id: "SOS-13", student: "Suman Patra", block: "A Wing", room: "A-108", time: "03 Aug 2026, 09:15 PM", status: "Resolved", note: "Reported chest pain, escorted to campus health centre." },
];

export const incidentReportsAll = [
  { id: "INC-91", block: "C Wing", category: "Disturbance", description: "Loud argument reported on 2nd floor corridor, resolved by warden.", date: "09 Aug 2026", severity: "Medium", status: "Open" },
  { id: "INC-88", block: "A Wing", category: "Suspicious activity", description: "Unknown person loitering near A Wing gate around 11 PM, left when approached.", date: "08 Aug 2026", severity: "Medium", status: "Resolved" },
  { id: "INC-84", block: "Main Gate", category: "Gate malfunction", description: "Main gate boom barrier stuck open for ~20 minutes, maintenance informed.", date: "02 Aug 2026", severity: "Low", status: "Resolved" },
];

export const emergencyContactsDirectory = [
  { role: "Chief Warden", name: "Rajesh Kumar Naik", phone: "+91 98612 00002", email: "r.naik@gcek.ac.in" },
  { role: "Hostel Office", name: "Front Desk", phone: "+91 674 250 1122", email: "hostel.office@gcek.ac.in" },
  { role: "Medical / Ambulance", name: "Campus Health Centre", phone: "108", email: "" },
  { role: "Local Police Station", name: "Keonjhar Town PS", phone: "100", email: "" },
  { role: "Fire Services", name: "Keonjhar Fire Station", phone: "101", email: "" },
];

// ---- AI feedback analysis ----------------------------------------------------
export const feedbackEntries = [
  { id: "FB-77", student: "Priya Mishra", block: "B Wing", category: "Mess food", comment: "Food quality has improved a lot this month, thank you!", sentiment: "Positive", date: "10 Aug 2026" },
  { id: "FB-76", student: "Alok Mohanty", block: "A Wing", category: "Wi-Fi", comment: "Internet keeps disconnecting every evening on the 3rd floor.", sentiment: "Negative", date: "09 Aug 2026" },
  { id: "FB-75", student: "Rakesh Mallick", block: "A Wing", category: "Room maintenance", comment: "Window latch was fixed but it took a while to respond.", sentiment: "Neutral", date: "08 Aug 2026" },
  { id: "FB-74", student: "Manisha Jena", block: "C Wing", category: "Fee process", comment: "Online payment portal is smooth and receipts download instantly.", sentiment: "Positive", date: "07 Aug 2026" },
  { id: "FB-73", student: "Debasish Rout", block: "B Wing", category: "Warden support", comment: "Warden was slow to respond to my gate pass request.", sentiment: "Negative", date: "06 Aug 2026" },
  { id: "FB-72", student: "Rashmi Behera", block: "B Wing", category: "Cleanliness", comment: "Corridor cleaning could be more frequent on weekends.", sentiment: "Neutral", date: "05 Aug 2026" },
  { id: "FB-70", student: "Aman Sahoo", block: "B Wing", category: "Mess food", comment: "Loved the special menu on Sunday, please keep it up.", sentiment: "Positive", date: "03 Aug 2026" },
];

// ---- AI hostel assistant & smart search --------------------------------------
export const aiAssistantSuggestions = [
  "How many beds are vacant in B Wing?",
  "Find students with pending complaints",
  "List unpaid hostel fees",
  "Summarize this week's incident reports",
];

// A tiny canned knowledge base so the assistant panel feels alive without
// calling any real AI service — purely for UI demonstration.
export const aiAssistantReplies = [
  {
    match: ["vacant", "available room", "empty bed"],
    reply: "Across all blocks there are 56 vacant beds right now — 22 in A Wing, 5 in B Wing, and 29 in C Wing. C Wing has the most availability.",
  },
  {
    match: ["pending complaint", "open complaint"],
    reply: "There are 4 open complaints institute-wide, the oldest being CMP-241 (window latch, A Wing, filed 11 Aug). Escalated cases are marked High priority.",
  },
  {
    match: ["unpaid", "due", "fee"],
    reply: "Total outstanding fees across the institute are ₹5,44,000, with B Wing accounting for the largest share. Top defaulter: Priya Mishra (B-202), ₹68,000 due 15 Aug.",
  },
  {
    match: ["incident", "safety", "sos"],
    reply: "This week there was 1 open incident (a disturbance report in C Wing, medium severity) and no active SOS alerts. Two SOS alerts this month were resolved.",
  },
  {
    match: ["rule", "policy"],
    reply: "Hostel rules cover curfew (10 PM on weekdays, 11 PM weekends), visitor hours (4–7 PM), and mandatory gate passes for any outing beyond campus. Full policy is in the student handbook.",
  },
];
