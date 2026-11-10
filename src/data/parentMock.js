// ---------------------------------------------------------------------------
// Mock/demo data for the Parent Dashboard.
// This is UI-only sample data — nothing here talks to Firebase or any API.
// A parent account is linked to exactly one student via `linkedStudentId`
// on their profile; this file represents that one linked child.
// ---------------------------------------------------------------------------
import { DEFAULT_EMERGENCY_CONTACTS } from "./emergencyContacts";

export const myChild = {
  name: "Priyanshu Panda",
  studentId: "STU-2041",
  course: "B.Tech CSE, 3rd Year",
  photoURL: "",
  wing: "B Wing",
  floor: "2nd Floor",
  room: "B-204",
  bed: "Bed 2",
  allottedOn: "12 Jul 2026",
  roommates: [
    { name: "Aman Sahoo", bed: "Bed 1" },
    { name: "Ritesh Nayak", bed: "Bed 3" },
  ],
};

export const emergencyContacts = DEFAULT_EMERGENCY_CONTACTS;
