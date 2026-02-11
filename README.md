# Prison Muster Management — Senior Officer Daily Tasks

A web app for **Prison Muster Management** and **Daily Senior Officer Tasks** for **Invercargill Prison — Unit Management System**, using Corrections Blue (#197d92) styling.

## Features

- **Homepage** — Lists units: North, South, Remand, Centre. Each links to its Unit Hub.
- **Unit Hub** (per unit)
  - **Handover** — Standing Orders, Medical Notes, People Off Privileges, Confinement.
  - **Daily tasks** — Checkbox list: PTAT, CARE Stats, Visit Bookings, Medication Rounds, Unit Inspections, Lockdown Check, Handover Complete.
  - **Muster confirmation** — Unlock / Random / Lockup checkboxes.
  - **Daily searches** — Generator for 3 random cell searches + 2 facility searches (unique per unit per day).
  - **Weekly cell alarms** — Check off cell alarms by cell (cells come from current muster).
- **Muster page** — Per-unit prisoner list with:
  - Name, Cell, Security Classification, Job, Notes, OPs, CCs, NTDB, Location.
  - Add / Edit / Remove prisoners.
  - **Location management** — Select prisoners (or group), set location (e.g. YARD, Medical, Court); records time in that location.
- **Admin hub** — Password-protected; view **Audit trail** of actions (handover, tasks, muster, locations, searches, etc.).

## Tech stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** (Corrections Blue and extended palette)
- **React Router** for navigation
- **localStorage** for persistence (no backend)

## Run locally

```bash
cd prison-muster-app
npm install
npm run dev
```

Then open the URL shown (e.g. `http://localhost:5173`).

## Admin access

- **URL:** `/admin`
- **Default password:** `admin2024`
- Change it in `src/constants.ts` (`ADMIN_PASSWORD`). Use proper authentication in production.

## Build for production

```bash
npm run build
```

Output is in `dist/`. Serve with any static host.

---

You can extend with a real backend, user auth, and more units or tasks as needed.
