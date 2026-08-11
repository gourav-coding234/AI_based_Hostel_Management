// ---------------------------------------------------------------------------
// Mock/demo data for the Warden Dashboard.
// This is UI-only sample data — nothing here talks to Firebase or any API.
// Replace with real data fetching once the backend endpoints exist.
// ---------------------------------------------------------------------------

// ---- Overview / analytics -------------------------------------------------
export const hostelStats = {
  totalBeds: 180,
  occupiedBeds: 162,
  vacantBeds: 18,
};

export const feeCollectionStats = {
  totalDue: 68000 * 60, // approx across all students
  totalCollected: 3145000,
};

export const attendanceTrend = [
  { day: "Mon", pct: 94 },
  { day: "Tue", pct: 97 },
  { day: "Wed", pct: 90 },
  { day: "Thu", pct: 98 },
  { day: "Fri", pct: 86 },
  { day: "Sat", pct: 93 },
  { day: "Sun", pct: 96 },
];

// ---- Wings / rooms / bed allotment ----------------------------------------
export const wings = [
  {
    name: "A Wing",
    rooms: [
      { room: "A-101", capacity: 3, beds: [
        { bed: 1, status: "occupied", student: "Rakesh Mallick" },
        { bed: 2, status: "occupied", student: "Subham Jena" },
        { bed: 3, status: "vacant" },
      ]},
      { room: "A-102", capacity: 3, beds: [
        { bed: 1, status: "occupied", student: "Ankit Swain" },
        { bed: 2, status: "vacant" },
        { bed: 3, status: "vacant" },
      ]},
      { room: "A-103", capacity: 3, beds: [
        { bed: 1, status: "occupied", student: "Bibhu Panda" },
        { bed: 2, status: "occupied", student: "Sourav Nanda" },
        { bed: 3, status: "occupied", student: "Rohit Behera" },
      ]},
    ],
  },
  {
    name: "B Wing",
    rooms: [
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
        { bed: 2, status: "occupied", student: "Priyanshu Dash" },
        { bed: 3, status: "occupied", student: "Ritesh Nayak" },
      ]},
    ],
  },
  {
    name: "C Wing",
    rooms: [
      { room: "C-301", capacity: 3, beds: [
        { bed: 1, status: "occupied", student: "Alok Mohanty" },
        { bed: 2, status: "vacant" },
        { bed: 3, status: "vacant" },
      ]},
      { room: "C-302", capacity: 3, beds: [
        { bed: 1, status: "occupied", student: "Nabin Pradhan" },
        { bed: 2, status: "occupied", student: "Satyajit Sahoo" },
        { bed: 3, status: "vacant" },
      ]},
    ],
  },
];

export const roomRequests = [
  { id: "REQ-118", name: "Soumya Ranjan", type: "Room change", currentRoom: "B-206", reason: "Near exam block, current room is noisy", requestedOn: "02 Aug 2026", priority: "Normal" },
  { id: "REQ-121", name: "Ipsita Nayak", type: "New allotment", currentRoom: "—", reason: "Semester transfer from another campus", requestedOn: "05 Aug 2026", priority: "High" },
  { id: "REQ-124", name: "Tanmay Rout", type: "Room change", currentRoom: "A-105", reason: "Roommate conflict, requesting reassignment", requestedOn: "08 Aug 2026", priority: "Normal" },
];

// ---- Fees -------------------------------------------------------------------
export const studentFees = [
  { id: "STU-2201", name: "Aman Sahoo", room: "B-204", total: 68000, paid: 68000, dueDate: "—", status: "Paid" },
  { id: "STU-2202", name: "Ritesh Nayak", room: "B-204", total: 68000, paid: 46000, dueDate: "31 Aug 2026", status: "Partial" },
  { id: "STU-2203", name: "Priyanshu Dash", room: "B-204", total: 68000, paid: 20000, dueDate: "31 Aug 2026", status: "Overdue" },
  { id: "STU-2204", name: "Suman Patra", room: "B-201", total: 68000, paid: 68000, dueDate: "—", status: "Paid" },
  { id: "STU-2205", name: "Debasish Rout", room: "B-201", total: 68000, paid: 46000, dueDate: "31 Aug 2026", status: "Partial" },
  { id: "STU-2206", name: "Priya Mishra", room: "B-202", total: 68000, paid: 0, dueDate: "15 Aug 2026", status: "Overdue" },
  { id: "STU-2207", name: "Kabita Sethi", room: "B-203", total: 68000, paid: 68000, dueDate: "—", status: "Paid" },
  { id: "STU-2208", name: "Rashmi Behera", room: "B-203", total: 68000, paid: 46000, dueDate: "31 Aug 2026", status: "Partial" },
];

// ---- Mess -------------------------------------------------------------------
export const weekMenu = {
  Monday: { breakfast: "Poha, Boiled Egg, Tea/Coffee", lunch: "Rice, Dal, Mix Veg, Curd, Papad", dinner: "Chapati, Paneer Curry, Rice, Salad" },
  Tuesday: { breakfast: "Idli, Sambar, Chutney", lunch: "Rice, Sambar, Aloo Gobi, Curd", dinner: "Chapati, Chicken Curry, Rice, Salad" },
  Wednesday: { breakfast: "Bread Omelette, Tea/Coffee", lunch: "Rice, Dal Fry, Bhindi, Curd", dinner: "Chapati, Egg Curry, Rice, Salad" },
  Thursday: { breakfast: "Upma, Chutney, Tea/Coffee", lunch: "Rice, Rajma, Mix Veg, Curd", dinner: "Chapati, Veg Kofta, Rice, Salad" },
  Friday: { breakfast: "Paratha, Curd, Pickle", lunch: "Rice, Dal, Cabbage Sabzi, Curd", dinner: "Chapati, Fish Curry, Rice, Salad" },
  Saturday: { breakfast: "Chole Bhature", lunch: "Rice, Sambar, Aloo Baingan, Curd", dinner: "Chapati, Mutton Curry, Rice, Salad" },
  Sunday: { breakfast: "Puri, Aloo Sabzi", lunch: "Veg Biryani, Raita, Papad", dinner: "Chapati, Paneer Butter Masala, Rice" },
};

export const messReports = [
  { id: "MR-104", date: "09 Aug 2026", by: "Aman Sahoo (B-204)", type: "Food Shortage", description: "Rice ran out at dinner around 8:40 PM in B Wing mess hall.", status: "Resolved" },
  { id: "MR-101", date: "03 Aug 2026", by: "Priya Mishra (B-202)", type: "Utensils Shortage", description: "Only a few steel plates left during lunch rush.", status: "In Progress" },
  { id: "MR-107", date: "10 Aug 2026", by: "Kabita Sethi (B-203)", type: "Quality Issue", description: "Dal was undercooked at lunch today.", status: "Open" },
];

// ---- Attendance ---------------------------------------------------------
export const wingAttendanceToday = [
  { wing: "A Wing", present: 21, total: 24 },
  { wing: "B Wing", present: 33, total: 35 },
  { wing: "C Wing", present: 14, total: 16 },
];

export const repeatAbsentees = [
  { name: "Priyanshu Dash", room: "B-204", absences: 4, lastAbsent: "10 Aug 2026" },
  { name: "Rashmi Behera", room: "B-203", absences: 3, lastAbsent: "09 Aug 2026" },
  { name: "Ankit Swain", room: "A-102", absences: 3, lastAbsent: "08 Aug 2026" },
];

// ---- Complaints & maintenance ---------------------------------------------
export const staffList = ["Electrician", "Plumber", "Carpenter", "Mess Staff", "Housekeeping"];

export const allComplaints = [
  { id: "CMP-233", student: "Aman Sahoo", room: "B-204", category: "Room", title: "Fan not working", description: "Ceiling fan in B-204 makes a loud noise and spins slowly.", status: "In Progress", date: "07 Aug 2026", priority: "Medium", assignedTo: "Electrician" },
  { id: "CMP-227", student: "Debasish Rout", room: "B-201", category: "Wing", title: "Corridor light fused", description: "Second light from the stairs on B Wing 2nd floor is out.", status: "Open", date: "05 Aug 2026", priority: "Low", assignedTo: "" },
  { id: "CMP-219", student: "Priya Mishra", room: "B-202", category: "Food", title: "Water cooler leaking", description: "Water cooler near the mess entrance is leaking onto the floor.", status: "Resolved", date: "29 Jul 2026", priority: "Medium", assignedTo: "Plumber" },
  { id: "CMP-236", student: "Rashmi Behera", room: "B-203", category: "Room", title: "Door lock jammed", description: "Room door lock is difficult to open, sticks every time.", status: "Open", date: "10 Aug 2026", priority: "High", assignedTo: "" },
];

export const complaintCategories = ["Room", "Wing", "Food", "Other"];

// ---- Inventory ---------------------------------------------------------
export const hostelInventory = [
  { item: "Bed", total: 180, inUse: 162, spare: 18, lowStock: false },
  { item: "Study Table", total: 180, inUse: 175, spare: 5, lowStock: true },
  { item: "Chair", total: 180, inUse: 168, spare: 12, lowStock: false },
  { item: "Cupboard", total: 180, inUse: 180, spare: 0, lowStock: true },
  { item: "Mattress", total: 180, inUse: 170, spare: 10, lowStock: false },
];

export const inventoryRequests = [
  { id: "INV-58", student: "Rashmi Behera", room: "B-203", item: "Chair", quantity: 1, reason: "Existing chair leg is broken", status: "Pending", date: "01 Aug 2026" },
  { id: "INV-61", student: "Ankit Swain", room: "A-102", item: "Study Table", quantity: 1, reason: "Table surface is damaged", status: "Pending", date: "09 Aug 2026" },
  { id: "INV-52", student: "Suman Patra", room: "B-201", item: "Extra Bed", quantity: 1, reason: "Guest stay approved by warden", status: "Approved", date: "18 Jul 2026" },
];

// ---- Student directory ---------------------------------------------------
export const studentDirectory = [
  { id: "STU-2201", name: "Aman Sahoo", room: "B-204", wing: "B Wing", year: "3rd Year", branch: "CSE", phone: "9861000001", parentPhone: "9861100001" },
  { id: "STU-2202", name: "Ritesh Nayak", room: "B-204", wing: "B Wing", year: "3rd Year", branch: "CSE", phone: "9861000002", parentPhone: "9861100002" },
  { id: "STU-2203", name: "Priyanshu Dash", room: "B-204", wing: "B Wing", year: "2nd Year", branch: "ECE", phone: "9861000003", parentPhone: "9861100003" },
  { id: "STU-2204", name: "Suman Patra", room: "B-201", wing: "B Wing", year: "4th Year", branch: "Mech", phone: "9861000004", parentPhone: "9861100004" },
  { id: "STU-2205", name: "Debasish Rout", room: "B-201", wing: "B Wing", year: "4th Year", branch: "Mech", phone: "9861000005", parentPhone: "9861100005" },
  { id: "STU-2206", name: "Priya Mishra", room: "B-202", wing: "B Wing", year: "1st Year", branch: "CSE", phone: "9861000006", parentPhone: "9861100006" },
  { id: "STU-2207", name: "Kabita Sethi", room: "B-203", wing: "B Wing", year: "2nd Year", branch: "Civil", phone: "9861000007", parentPhone: "9861100007" },
  { id: "STU-2208", name: "Rashmi Behera", room: "B-203", wing: "B Wing", year: "2nd Year", branch: "Civil", phone: "9861000008", parentPhone: "9861100008" },
  { id: "STU-2209", name: "Ankit Swain", room: "A-102", wing: "A Wing", year: "3rd Year", branch: "ECE", phone: "9861000009", parentPhone: "9861100009" },
  { id: "STU-2210", name: "Rakesh Mallick", room: "A-101", wing: "A Wing", year: "1st Year", branch: "CSE", phone: "9861000010", parentPhone: "9861100010" },
];

// ---- Notices ---------------------------------------------------------
export const wardenNotices = [
  { id: "NTC-91", title: "Hostel gates close at 9:30 PM sharp", date: "10 Aug 2026", target: "All Wings", priority: "Urgent", body: "Effective immediately, main gate entry closes at 9:30 PM on weekdays. Students returning later must have prior written permission from the warden." },
  { id: "NTC-89", title: "Water supply maintenance on 13 Aug", date: "09 Aug 2026", target: "B Wing, C Wing", priority: "General", body: "Water supply to B and C Wings will be interrupted between 10 AM and 2 PM on 13 Aug for tank cleaning. Please store water in advance." },
  { id: "NTC-85", title: "Independence Day cultural night", date: "06 Aug 2026", target: "All Wings", priority: "Event", body: "Hostel cultural night on 14 Aug at 7 PM in the common hall. Sign up sheets are with your wing representatives." },
  { id: "NTC-80", title: "Mess fee installment 3 due 31 Aug", date: "05 Aug 2026", target: "All Wings", priority: "Urgent", body: "Third installment of hostel & mess fees is due by 31 Aug 2026. Pay via the Fees tab or at the accounts office." },
];

export const noticeTargets = ["All Wings", "A Wing", "B Wing", "C Wing"];
export const noticePriorities = ["General", "Urgent", "Event"];
