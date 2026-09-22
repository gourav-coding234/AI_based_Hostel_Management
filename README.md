# GCEKJR Hostel Portal

**AI-Based Smart Hostel Management System** — Government College of Engineering, Keonjhar

A role-based web portal that replaces the paper registers used to run a college
hostel. Five kinds of user (student, parent, warden, security, administrator)
sign in to their own dashboard and see only what their role permits. Everything
on screen comes from a live Firestore database — there is no mock or demo data
anywhere in the application.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Getting started](#getting-started)
4. [Firebase setup](#firebase-setup)
5. [Creating the first accounts](#creating-the-first-accounts)
6. [Project structure](#project-structure)
7. [Data model](#data-model)
8. [Security model](#security-model)
9. [Available scripts](#available-scripts)
10. [Deployment](#deployment)
11. [Browser and device support](#browser-and-device-support)
12. [Troubleshooting](#troubleshooting)

---

## Features

### Public site
A landing page with hostel facilities, an image gallery, a downloadable
information brochure, and a notice board that shows notices staff have
explicitly marked as public.

### Student
Overview · Room & Bed · Attendance · Mess · Inventory · Fees · Gate Pass ·
Complaints · Leave Request · Feedback · Notices · My Profile

Students see their own room and roommate details, fee balance, attendance
record and mess menu. They can apply for leave and gate passes, raise
complaints, request inventory items and submit mess feedback.

### Parent
Overview · Room & Bed · Attendance · Fees · Gate Pass · Notices ·
Emergency Contacts · My Profile

A parent account is linked to exactly one student and can only ever see that
student's records.

### Warden
Overview · AI Assistant · Student Directory · Room & Bed · Attendance ·
Visitors · Gate Passes · Leave Requests · Complaints · Notices · Fees · Mess ·
Inventory · Safety & Emergency · Feedback Analysis · Reports

Wardens allot and vacate beds (keeping block occupancy counts in sync), mark
attendance, approve leave and gate passes, and manage complaints, mess,
inventory and notices.

### Security
Overview · Gate Scan · In/Out Register · Visitor Log · Incident Reports ·
Duty Roster · Emergency Contacts · Notices · My Profile

### Administrator
Overview · AI Assistant · Manage Users · Wardens · Student Register · Blocks & Rooms · Visitors ·
Gate Passes · Leave Requests · Complaints · Notices · Fees · Safety & Emergency ·
Feedback Analysis · Reports · Audit Log · Data Import

Includes bulk import of students, fees and other records from CSV/XLSX files
with per-row validation and in-file duplicate detection.

### About the "AI Assistant"
The assistant on the admin and warden dashboards answers questions about bed
vacancy, open complaints and outstanding fees. It is a **keyword-matched query
layer over live Firestore data** — not a large language model, and not canned
demo replies. Every number it reports is computed from the real collections at
the moment you ask. This is stated plainly in the source
(`src/pages/dashboard/admin/AiAssistant.jsx`) so the capability is not
overstated.

---

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 19 |
| Build tool | Vite 8 |
| Routing | React Router 7 (`BrowserRouter`) |
| Backend | Firebase — Authentication + Cloud Firestore |
| Styling | Hand-written CSS with design tokens, plus Tailwind CSS 3 utilities |
| Spreadsheet import | SheetJS (`xlsx`), loaded on demand |
| Linting | Oxlint |

No backend server of our own: the browser talks to Firebase directly, and
access control is enforced by Firestore security rules.

---

## Getting started

### Prerequisites
- **Node.js 20.19+ or 22.12+** (Vite 8 requires it) — check with `node -v`
- **npm 10+**
- A Firebase project (free Spark plan is enough)

### Install and run

```bash
cd app
npm install
```

Create the environment file:

```bash
# macOS / Linux
cp .env.example .env

# Windows (Command Prompt)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Fill in your Firebase values (see [Firebase setup](#firebase-setup)), then:

```bash
npm run dev
```

Open the URL printed in the terminal, normally <http://localhost:5173>.

> **If you skip the `.env` step**, the app does not crash — it shows a setup
> screen listing exactly which variables are missing.

### Testing on a real phone
The dev server binds to all network interfaces, so with your computer and
phone on the same Wi-Fi you can open the "Network" URL Vite prints
(for example `http://192.168.1.5:5173`) directly on the handset.

---

## Firebase setup

1. Create a project at the [Firebase console](https://console.firebase.google.com/).
2. **Authentication** → Get started → enable the **Email/Password** provider.
3. **Firestore Database** → Create database → start in **production mode**.
4. **Project settings** → General → *Your apps* → add a **Web app**, then copy
   the config values into your `.env`:

   | `.env` key | Firebase config field |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

5. **Publish the security rules.** Copy the contents of `firestore.rules` into
   Firestore → Rules → Publish. The app will not behave correctly without them:
   the rules are what actually stop one student reading another's records.

> These `VITE_` values are bundled into the client build. That is normal and
> safe for Firebase web apps — they identify the project, they do not grant
> access. Access is decided entirely by the security rules.

### Composite indexes
Some views query and sort at the same time (for example a student's own fees
ordered by date). Firestore will print a console error with a **direct link**
to create the required index the first time such a query runs — click it once
per query and it is provisioned permanently.

---

## Creating the first accounts

There is no public sign-up: accounts are issued by the hostel office. To
bootstrap the very first administrator:

1. In **Authentication → Users**, click *Add user* and create an email/password
   account. Copy the generated **User UID**.
2. In **Firestore**, create a collection `users` with a document whose **ID is
   that exact UID**, and these fields:

   ```
   name  (string)  "Hostel Administrator"
   email (string)  "admin@gcekjr.ac.in"
   role  (string)  "Admin"
   ```

3. Sign in at `/login`, choosing the **Admin** role.

From there, every other account can be created through **Manage Users** in the
admin dashboard.

`role` must be exactly one of: `Admin`, `Student`, `Warden`, `Parent`,
`Security`. A **Parent** document additionally needs `linkedStudentId` set to
the UID of their child's account — that single field is what scopes everything
a parent can see.

> The role chosen on the login screen is a convenience only. It is never
> trusted: the real role is read from Firestore after authentication, and a
> mismatch signs the session straight back out.

---

## Project structure

```
app/
├── public/               # Static assets served as-is (favicons, brochure.pdf)
├── src/
│   ├── assets/           # Images imported by components
│   ├── components/
│   │   ├── dashboard/    # Sidebar, topbar, search, notifications, per-role icons
│   │   ├── landing/      # Public site sections (hero, notices, gallery, footer)
│   │   ├── ui/           # DataTable, loading/empty/error states, badges, cards
│   │   └── ErrorBoundary.jsx
│   ├── config/
│   │   └── navigation.jsx  # Single source of truth for every role's sidebar
│   ├── context/          # AuthContext (session + profile), ThemeContext
│   ├── firebase/         # SDK init, auth helpers, Firestore helpers
│   ├── hooks/            # useCollection, useDocument, useNotifications, …
│   ├── layouts/          # DashboardLayout (shell shared by all five roles)
│   ├── pages/
│   │   ├── dashboard/    # One folder per role
│   │   ├── Landing.jsx  Login.jsx  NotFound.jsx  SetupRequired.jsx
│   ├── routes/           # ProtectedRoute
│   ├── utils/            # CSV/XLSX import, validation schemas, image resizing
│   ├── index.css         # Design tokens + all hand-written styles
│   ├── roles.js          # Role constants and per-role dashboard paths
│   ├── App.jsx           # Route table (dashboards are lazy-loaded)
│   └── main.jsx          # Entry point
├── firestore.rules       # Publish these to Firebase
├── .env.example
└── vite.config.js
```

### Adding a page
1. Create the component under `src/pages/dashboard/<role>/`.
2. Register a `<Route>` in that role's dashboard file
   (e.g. `src/pages/dashboard/WardenDashboard.jsx`).
3. Add a nav entry in `src/config/navigation.jsx` — the sidebar, breadcrumbs
   and the topbar search all read from it, so one entry updates all three.

---

## Data model

Top-level Firestore collections:

| Collection | Holds |
|---|---|
| `users` | One document per account, keyed by Auth UID. Carries `role`. |
| `students` | Room/bed allocation record per student |
| `blocks` | Hostel blocks: capacity, occupied beds, assigned warden |
| `attendance` | Daily attendance entries |
| `fees` | Fee records with `total` and `paid` |
| `gatePasses`, `gateLogs` | Gate pass requests and gate scan history |
| `visitors` | Visitor register |
| `leaveRequests` | Leave applications and approvals |
| `complaints` | Maintenance and other complaints |
| `inventory`, `inventoryRequests` | Stock and student requests |
| `messMenu`, `messReports` | Weekly menu and mess feedback |
| `notices` | Notices; `isPublic: true` also shows on the landing page |
| `studentRegister` | Institute-wide academic roster (registration no, branch, year) — independent of hostel residency and portal login |
| `incidents`, `sosAlerts` | Security incidents and SOS alerts |
| `emergencyContacts`, `dutyRoster` | Reference data for security/parents |
| `feedback` | Student feedback submissions |
| `auditLogs` | Append-only record of administrative actions |

Records belonging to a student carry a `studentId` field holding that
student's UID. That field is what the security rules match on.

## Populating real data (not mock data)

This app never ships with sample/demo data baked into the source — every number on every
dashboard is a live Firestore query. That means an empty database shows empty states, not
placeholder rows. To make the portal reflect a real, populated college:

1. Sign in as **Admin** → **Data Import**, choose **Student register (academic)**, and
   upload a CSV/XLSX with columns `regNo, name, gender, branch, branchCode, year, batch,
   admissionYear, email, phone`. This writes real documents to the `studentRegister`
   collection via batched writes (~450/batch), so even a few thousand rows imports in
   seconds — this is the institute-wide roster, and it does **not** require a login account
   for every person on it.
2. Browse and filter it at **Admin → Student Register** (search by name/registration
   number, filter by branch and year) — this reads the same live collection, so what you see
   there is exactly what's in the database, not a mock preview.
3. Separately, only for students who need to actually **log in** and use the portal (view
   their own room, fees, attendance), create their account individually or in bulk through
   **Admin → Manage Users**, which creates a real Firebase Auth account plus a `users`
   profile document. Room/bed allocation for a logged-in student still goes through the
   **`students`** collection (Data Import → *Student roster (room/bed)*), which — unlike the
   academic register — does require that account to exist first, since it's keyed by Auth
   UID.

In short: the **academic register** (who's enrolled) and **hostel residency** (who has a bed
and a login) are two intentionally separate collections. Most colleges have the same split in
real life — the exam/academic section's student list and the hostel office's resident roster
aren't the same list.

---

## Security model

The rules in `firestore.rules` are the real access boundary — the UI only
decides what to *show*.

- **Staff** (Admin, Warden) can read every student's records; running a hostel
  requires it.
- **Security** gets read access where the job needs it (gate passes, visitors,
  incidents, duty roster) and nothing more.
- **Students** can only read a record whose `studentId` is their own UID.
- **Parents** can only read records whose `studentId` matches the
  `linkedStudentId` on their own profile.
- **Self-service profile edits** are restricted to a fixed allow-list of
  fields. `role`, `email`, `hostelResidence` and `linkedStudentId` can never be
  changed this way, so no account can escalate its own privileges or re-link
  itself to a different student.
- **Wardens** may update only the `occupiedBeds` field on a block (bed
  allotment). Renaming a block or changing its capacity stays Admin-only.
- **Audit logs** are create-only: any signed-in user can append, nobody can
  edit or delete.
- **Student register** is readable by any signed-in role and writable only by staff, and is
  deliberately keyed by registration number rather than Auth UID — an entry can exist for a
  student long before, or entirely without, a portal login.
- **Notices** are readable by any signed-in user, and additionally by anyone at
  all when flagged `isPublic: true` — which is what powers the public notice
  board.

### Known limitation
Deleting a user removes their Firestore profile, which immediately revokes
access everywhere in the app, but it does **not** delete the underlying
Firebase Auth credential. The client SDK can only delete the currently
signed-in user; removing an arbitrary Auth account requires the Firebase Admin
SDK in a Cloud Function. This is documented in
`src/firebase/firestore.js` where it applies.

### Dependency advisory: `xlsx`

`npm audit` reports one **high** severity finding against `xlsx@0.18.5`
(prototype pollution and a ReDoS). It is worth understanding rather than
ignoring:

- SheetJS stopped publishing to the npm registry at `0.18.5`, so the npm copy
  is frozen and **no fixed version exists on npm**. `npm audit fix` cannot
  resolve it.
- Fixed releases are distributed from SheetJS's own registry. To move to a
  patched build:

  ```bash
  npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
  ```

  Do this if your institution's policy requires a clean `npm audit`. It was
  not applied here because that host is outside the environment this build was
  verified in, and an unverified swap is worse than a documented one.
- **Exposure in this app is limited.** `xlsx` is reached from exactly one
  place — admin *Data Import* — and only when an administrator uploads a
  `.xlsx`/`.xls` file they chose themselves. It parses no user-supplied or
  network-fetched data, and it is loaded dynamically so it never enters the
  bundle for any other role. CSV uploads use the project's own parser and do
  not touch this library at all.

---

## Available scripts

Run from the `app` folder:

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally to check it |
| `npm run lint` | Run Oxlint over the source |

---

## Deployment

The build output is a static site — any static host works.

**Single-page-app routing matters.** Every route must fall back to
`index.html`, or refreshing on `/dashboard/student/fees` returns a 404.

- **Vercel** — `vercel.json` is included and already configured. Set the six
  `VITE_FIREBASE_*` variables in the project's Environment Variables, then
  deploy. Build command `npm run build`, output directory `dist`.
- **Netlify** — add a `_redirects` file in `public/` containing
  `/*  /index.html  200`.
- **Firebase Hosting** — `firebase init hosting`, set the public directory to
  `dist` and answer **yes** to "configure as a single-page app".

Remember to add your deployed domain under **Authentication → Settings →
Authorized domains**, or sign-in will be rejected in production.

---

## Browser and device support

- Current versions of Chrome, Edge, Firefox and Safari (desktop and mobile).
- **Responsive from 320 px up.** The sidebar becomes a drawer below 1024 px,
  wide tables scroll inside their own container rather than pushing the page
  sideways, and form controls render at 16 px on touch devices so iOS Safari
  does not zoom when a field is focused.
- **Notch-aware** — the layout respects `env(safe-area-inset-*)` on devices
  with a notch or home indicator.
- **Light and dark themes**, toggled from the topbar. The choice is saved per
  browser and falls back to the operating-system preference on first visit.
- **Accessibility** — visible focus outlines, `prefers-reduced-motion`
  honoured, drawers and dialogs closable with <kbd>Esc</kbd>, and minimum
  44 px touch targets.
- Printing a dashboard page hides the sidebar and topbar.

---

## Troubleshooting

**A setup screen appears instead of the app**
`.env` is missing or incomplete. The screen names the missing variables.
Remember to restart the dev server — Vite reads `.env` only at startup.

**`auth/invalid-api-key` or `auth/configuration-not-found`**
The values in `.env` don't match the Firebase project, or the Email/Password
provider hasn't been enabled.

**Signed in, but every page shows an error state**
The security rules probably haven't been published. Copy `firestore.rules`
into the Firebase console and publish.

**"Incorrect role selected" on login**
The role button chosen doesn't match the `role` field on that account's `users`
document. The message states the account's actual role.

**"No profile found for this account"**
An Auth user exists without a matching `users/{uid}` document. See
[Creating the first accounts](#creating-the-first-accounts).

**A query fails asking for an index**
Firestore logs a direct link to create it. Click it once.

**`npm audit` reports a high severity issue**
That is the known `xlsx` advisory — see
[Dependency advisory](#dependency-advisory-xlsx) above for the remediation
command and why it is limited here.

**`npm install` fails on Node 18**
Vite 8 needs Node 20.19+ or 22.12+. Upgrade Node.

---

## Credits

Built for Government College of Engineering, Keonjhar —
Jamunalia, Old Town, Keonjhar 758002, Odisha.
Hostel Administration Office · principal@gcekjr.ac.in · 06766-213180
