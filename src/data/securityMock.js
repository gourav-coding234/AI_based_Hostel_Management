// ---------------------------------------------------------------------------
// Mock/demo data for the Security Dashboard.
// This is UI-only sample data — nothing here talks to Firebase or any API.
// Replace with real data fetching once the backend endpoints exist.
// ---------------------------------------------------------------------------

// A student-facing log of gate passes, as security would see it — pulled
// from every student's passes, not just one. Verifying a pass here just
// looks up this list by ID; approving/creating passes stays on the
// student/warden side.
export const gatePassLog = [
  {
    id: "GP-1042",
    student: "Priyanshu Panda",
    room: "B-204",
    type: "Home Visit",
    reason: "Rakhi festival at home",
    from: "15 Aug 2026, 08:00 AM",
    to: "18 Aug 2026, 08:00 PM",
    status: "Approved",
    tripState: "Not started",
  },
  {
    id: "GP-1039",
    student: "Aman Sahoo",
    room: "B-204",
    type: "Outing",
    reason: "Local market",
    from: "10 Aug 2026, 04:00 PM",
    to: "10 Aug 2026, 07:00 PM",
    status: "Approved",
    tripState: "Out",
  },
  {
    id: "GP-1031",
    student: "Ritesh Nayak",
    room: "B-204",
    type: "Outing",
    reason: "Bank work in town",
    from: "28 Jul 2026, 10:00 AM",
    to: "28 Jul 2026, 06:00 PM",
    status: "Completed",
    tripState: "Returned",
  },
  {
    id: "GP-1027",
    student: "Suman Patra",
    room: "B-201",
    type: "Medical",
    reason: "Dental appointment",
    from: "20 Jul 2026, 09:00 AM",
    to: "20 Jul 2026, 01:00 PM",
    status: "Completed",
    tripState: "Returned",
  },
];

// Running in/out log produced by gate scans. Newest first.
export const initialInOutLog = [
  { id: "L-3081", student: "Aman Sahoo", room: "B-204", passId: "GP-1039", direction: "Out", time: "10 Aug 2026, 04:05 PM", guard: "You" },
  { id: "L-3077", student: "Ritesh Nayak", room: "B-204", passId: "GP-1031", direction: "In", time: "28 Jul 2026, 06:12 PM", guard: "Security Desk" },
  { id: "L-3076", student: "Ritesh Nayak", room: "B-204", passId: "GP-1031", direction: "Out", time: "28 Jul 2026, 10:02 AM", guard: "Security Desk" },
  { id: "L-3070", student: "Suman Patra", room: "B-201", passId: "GP-1027", direction: "In", time: "20 Jul 2026, 01:15 PM", guard: "Security Desk" },
];

export const initialVisitors = [
  {
    id: "V-512",
    name: "Rajendra Panda",
    purpose: "Meeting son (Priyanshu Panda, B-204)",
    idProof: "Aadhaar — last 4: 4471",
    phone: "+91 98612 11002",
    checkIn: "10 Aug 2026, 05:30 PM",
    checkOut: "10 Aug 2026, 06:45 PM",
    status: "Checked out",
  },
  {
    id: "V-509",
    name: "Suresh Kumar (courier)",
    purpose: "Package delivery — B Wing",
    idProof: "Company ID",
    phone: "+91 90408 22110",
    checkIn: "10 Aug 2026, 11:10 AM",
    checkOut: "10 Aug 2026, 11:20 AM",
    status: "Checked out",
  },
];

export const visitorPurposes = ["Meeting a student", "Parent visit", "Delivery / courier", "Vendor / maintenance", "Other"];

export const initialIncidents = [
  {
    id: "INC-88",
    category: "Suspicious activity",
    description: "Unknown person loitering near A Wing gate around 11 PM, left when approached.",
    date: "08 Aug 2026",
    severity: "Medium",
    status: "Resolved",
  },
  {
    id: "INC-84",
    category: "Gate malfunction",
    description: "Main gate boom barrier stuck open for ~20 minutes, maintenance informed.",
    date: "02 Aug 2026",
    severity: "Low",
    status: "Resolved",
  },
];

export const incidentCategories = ["Suspicious activity", "Disturbance", "Gate malfunction", "Unauthorized entry attempt", "Other"];
export const incidentSeverities = ["Low", "Medium", "High"];

export const dutyRoster = [
  { shift: "Morning (6 AM – 2 PM)", gate: "Main Gate", guard: "Bikash Sahu", day: "Today" },
  { shift: "Afternoon (2 PM – 10 PM)", gate: "Main Gate", guard: "You", day: "Today" },
  { shift: "Night (10 PM – 6 AM)", gate: "Main Gate", guard: "Chinmay Das", day: "Today" },
  { shift: "Morning (6 AM – 2 PM)", gate: "Back Gate", guard: "Manoj Behera", day: "Today" },
  { shift: "Afternoon (2 PM – 10 PM)", gate: "Back Gate", guard: "Sunil Rana", day: "Today" },
  { shift: "Night (10 PM – 6 AM)", gate: "Back Gate", guard: "Ravi Toppo", day: "Today" },
];

export const emergencyContacts = [
  { role: "Chief Warden", name: "Rajesh Kumar Naik", phone: "+91 98612 00002", email: "r.naik@gcek.ac.in" },
  { role: "Hostel Office", name: "Front Desk", phone: "+91 674 250 1122", email: "hostel.office@gcek.ac.in" },
  { role: "Medical / Ambulance", name: "Campus Health Centre", phone: "108", email: "" },
  { role: "Local Police Station", name: "Keonjhar Town PS", phone: "100", email: "" },
  { role: "Fire Services", name: "Keonjhar Fire Station", phone: "101", email: "" },
];
