// One entry per Firestore collection that admins/wardens can bulk-upload
// into via CSV/Excel. `columns` drives both the validator (utils/fileImport.js)
// and the "expected columns" hint shown in the upload UI.

export const IMPORT_SCHEMAS = {
  blocks: {
    dedupeKeys: ["name"],
    label: "Hostel blocks",
    collection: "blocks",
    description: "One row per hostel block/wing (capacity used for occupancy stats).",
    columns: [
      { key: "name", label: "Block name", required: true, type: "string" },
      { key: "warden", label: "Warden name", required: false, type: "string" },
      { key: "totalBeds", label: "Total beds", required: true, type: "number" },
      { key: "occupiedBeds", label: "Occupied beds", required: false, type: "number" },
    ],
  },
  students: {
    dedupeKeys: ["email"],
    label: "Student roster (room/bed)",
    collection: "students",
    description: "Room allocation info for students who already have a login account (create that first under Manage Users). Email is used to match this row to the right account — it is never written to the students record itself.",
    columns: [
      { key: "email", label: "Student's account email", required: true, type: "email" },
      { key: "name", label: "Name", required: true, type: "string" },
      { key: "hostelResidence", label: "Block", required: false, type: "string" },
      { key: "wing", label: "Wing", required: false, type: "string" },
      { key: "floor", label: "Floor", required: false, type: "string" },
      { key: "room", label: "Room", required: false, type: "string" },
      { key: "bed", label: "Bed", required: false, type: "string" },
      { key: "allottedOn", label: "Allotted on", required: false, type: "date" },
    ],
  },
  fees: {
    dedupeKeys: ["studentId", "dueDate"],
    label: "Fee records",
    collection: "fees",
    description: "One row per student's fee record.",
    columns: [
      { key: "studentId", label: "Student ID", required: true, type: "string" },
      { key: "studentName", label: "Student name", required: true, type: "string" },
      { key: "block", label: "Block", required: false, type: "string" },
      { key: "room", label: "Room", required: false, type: "string" },
      { key: "total", label: "Total amount", required: true, type: "number" },
      { key: "paid", label: "Paid amount", required: true, type: "number" },
      { key: "dueDate", label: "Due date", required: false, type: "date" },
      { key: "status", label: "Status", required: false, type: "enum", enumValues: ["Paid", "Partial", "Overdue"] },
    ],
  },
  attendance: {
    dedupeKeys: ["studentId", "date"],
    label: "Attendance records",
    collection: "attendance",
    description: "One row per student per date.",
    columns: [
      { key: "studentId", label: "Student ID", required: true, type: "string" },
      { key: "studentName", label: "Student name", required: true, type: "string" },
      { key: "date", label: "Date", required: true, type: "date" },
      { key: "status", label: "Status", required: true, type: "enum", enumValues: ["Present", "Absent", "Leave"] },
    ],
  },
  complaints: {
    label: "Complaints",
    collection: "complaints",
    columns: [
      { key: "studentId", label: "Student ID", required: true, type: "string" },
      { key: "studentName", label: "Student name", required: true, type: "string" },
      { key: "category", label: "Category", required: true, type: "enum", enumValues: ["Room", "Wing", "Food", "Other"] },
      { key: "description", label: "Description", required: true, type: "string" },
      { key: "status", label: "Status", required: false, type: "enum", enumValues: ["Open", "In Progress", "Resolved"] },
      { key: "date", label: "Date", required: false, type: "date" },
    ],
  },
  notices: {
    label: "Notices",
    collection: "notices",
    columns: [
      { key: "title", label: "Title", required: true, type: "string" },
      { key: "target", label: "Target audience", required: false, type: "string" },
      { key: "priority", label: "Priority", required: false, type: "enum", enumValues: ["General", "Urgent", "Event"] },
      { key: "date", label: "Date", required: false, type: "date" },
      { key: "postedBy", label: "Posted by", required: false, type: "string" },
    ],
  },
  gatePasses: {
    dedupeKeys: ["studentId", "from"],
    label: "Gate passes",
    collection: "gatePasses",
    columns: [
      { key: "studentId", label: "Student ID", required: true, type: "string" },
      { key: "studentName", label: "Student name", required: true, type: "string" },
      { key: "type", label: "Type", required: true, type: "string" },
      { key: "from", label: "From", required: false, type: "date" },
      { key: "to", label: "To", required: false, type: "date" },
      { key: "status", label: "Status", required: false, type: "enum", enumValues: ["Pending", "Approved", "Rejected"] },
    ],
  },
  visitors: {
    dedupeKeys: ["visitorName", "inTime"],
    label: "Visitor log",
    collection: "visitors",
    columns: [
      { key: "visitorName", label: "Visitor name", required: true, type: "string" },
      { key: "block", label: "Block", required: false, type: "string" },
      { key: "studentId", label: "Student ID (host)", required: false, type: "string" },
      { key: "studentName", label: "Student name (host)", required: false, type: "string" },
      { key: "purpose", label: "Purpose", required: false, type: "string" },
      { key: "idProof", label: "ID proof", required: false, type: "string" },
      { key: "phone", label: "Phone", required: false, type: "string" },
      { key: "inTime", label: "In time", required: false, type: "string" },
      { key: "outTime", label: "Out time", required: false, type: "string" },
    ],
  },
  inventory: {
    label: "Inventory",
    collection: "inventory",
    columns: [
      { key: "item", label: "Item", required: true, type: "string" },
      { key: "location", label: "Location", required: false, type: "string" },
      { key: "quantity", label: "Quantity", required: true, type: "number" },
      { key: "condition", label: "Condition", required: false, type: "string" },
    ],
  },
  leaveRequests: {
    dedupeKeys: ["studentId", "from"],
    label: "Leave requests",
    collection: "leaveRequests",
    columns: [
      { key: "studentId", label: "Student ID", required: true, type: "string" },
      { key: "studentName", label: "Student name", required: true, type: "string" },
      { key: "type", label: "Leave type", required: false, type: "string" },
      { key: "from", label: "From", required: false, type: "date" },
      { key: "to", label: "To", required: false, type: "date" },
      { key: "status", label: "Status", required: false, type: "enum", enumValues: ["Pending", "Approved", "Rejected"] },
    ],
  },
  incidents: {
    label: "Incident reports",
    collection: "incidents",
    columns: [
      { key: "title", label: "Title", required: true, type: "string" },
      { key: "category", label: "Category", required: false, type: "string" },
      { key: "severity", label: "Severity", required: false, type: "enum", enumValues: ["Low", "Medium", "High"] },
      { key: "date", label: "Date", required: false, type: "date" },
      { key: "reportedBy", label: "Reported by", required: false, type: "string" },
    ],
  },
  emergencyContacts: {
    dedupeKeys: ["name", "phone"],
    label: "Emergency contacts",
    collection: "emergencyContacts",
    columns: [
      { key: "name", label: "Name", required: true, type: "string" },
      { key: "role", label: "Role", required: false, type: "string" },
      { key: "phone", label: "Phone", required: true, type: "string" },
    ],
  },
  feedback: {
    label: "Feedback entries",
    collection: "feedback",
    columns: [
      { key: "studentName", label: "Student name", required: false, type: "string" },
      { key: "subject", label: "Subject", required: true, type: "string" },
      { key: "message", label: "Message", required: true, type: "string" },
      { key: "date", label: "Date", required: false, type: "date" },
    ],
  },
  studentRegister: {
    dedupeKeys: ["regNo"],
    label: "Student register (academic)",
    collection: "studentRegister",
    description:
      "The institute-wide academic roster — registration number, branch and year for every " +
      "enrolled student, independent of hostel residency or portal login. Import the full " +
      "college register here first; use Manage Users separately, only for students who need " +
      "an actual portal login.",
    columns: [
      { key: "regNo", label: "Registration No", required: true, type: "string" },
      { key: "name", label: "Name", required: true, type: "string" },
      { key: "gender", label: "Gender", required: true, type: "enum", enumValues: ["Male", "Female"] },
      { key: "branch", label: "Branch", required: true, type: "string" },
      { key: "branchCode", label: "Branch code", required: false, type: "string" },
      {
        key: "year", label: "Year", required: true, type: "enum",
        enumValues: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
      },
      { key: "batch", label: "Batch", required: false, type: "string" },
      { key: "admissionYear", label: "Admission year", required: false, type: "number" },
      { key: "email", label: "Email", required: false, type: "email" },
      { key: "phone", label: "Phone", required: false, type: "string" },
    ],
  },
  dutyRoster: {
    dedupeKeys: ["guardName", "date", "gate"],
    label: "Security duty roster",
    collection: "dutyRoster",
    columns: [
      { key: "guardName", label: "Guard name", required: true, type: "string" },
      { key: "shift", label: "Shift", required: true, type: "string" },
      { key: "date", label: "Date", required: false, type: "date" },
      { key: "gate", label: "Gate/post", required: false, type: "string" },
    ],
  },
};

export const IMPORT_TARGETS = Object.entries(IMPORT_SCHEMAS).map(([key, v]) => ({ key, ...v }));
