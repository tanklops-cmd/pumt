# Prison Muster Management — Senior Officer Daily Tasks

A web app for **Prison Muster Management** and **Daily Senior Officer Tasks** for **Invercargill Prison — Unit Management System**, using Corrections Blue (#197d92) styling.

## Features

### Homepage & Navigation
- **Homepage** — Lists units: North, South, Remand, Centre. Each links to its Unit Hub.
- **Prison Selector** — Support for multiple prisons (Invercargill, OCF, Christchurch Men's, Rolleston, etc.)
- Legacy routes supported for backward compatibility (`/unit/:unitId/*`)

### Unit Hub (per unit)
- **Handover** — Standing Orders, Medical Notes, People Off Privileges, Confinement.
- **Daily tasks** — Checkbox list: PTAT, CARE Stats, Visit Bookings, Medication Rounds, Unit Inspections, Lockdown Check, Handover Complete.
- **Muster confirmation** — Unlock / Random / Lockup checkboxes.
- **Daily searches** — Generator for 3 random cell searches + 2 facility searches (unique per unit per day).
- **Weekly cell alarms** — Check off cell alarms by cell (cells come from current muster).

### Muster Page
- Per-unit prisoner list with:
  - Name, Cell, Security Classification, Job, Notes, OPs, CCs, NTDB, Location
  - Meal tracking (Breakfast, Lunch, Dinner checkboxes)
  - Hours out of unit tracking
- **Add / Edit / Remove prisoners**
- **Prisoner Induction** — When editing a prisoner, expand "Induction Details" to record:
  - Laundry Number Added (required)
  - Added to Jobs List (required)
  - SACRA Completed (optional)
  - Induction notes
  - Inducted by (name)
  - Automatic timestamp when induction is completed
- **PCO Notification** — When induction is completed, a notification appears in the PCO Hub for acknowledgment
- **Location management** — Select prisoners (or group), set location (Yard, Medical, Court, Visits, Programmes, Work, Other); records time in that location
- **Bulk operations**:
  - Set location for multiple prisoners
  - Move prisoners to different units
  - Bulk return from activities (Yard, Gym, Work)
- **Movement log** — Track all location changes with timestamps, exportable to CSV
- **Alphabetical sorting** — Prisoners sorted by last name (A-Z)
- Print options (full and compact single-page)

### Control Hub (SCO)
- **Total muster count** display with onsite/offsite breakdown
- **Incomplete task alerts** — Yellow warning banner when daily tasks incomplete
- **Manual snapshot saving** — Save hub state for audit purposes
- **Daily reset** — Reset tasks, prisoner locations, and meals for new day
- Multiple prison support

### PCO Hub (Password Protected)
- **Unit PCO Hub** (`/unit/:unitId/pco`) — Unit-specific operational analytics
- **Facility PCO Hub** — Facility-wide analytics
- **Password protected** access (set via `VITE_PCO_PASSWORD` environment variable)

#### Analytics & Alerts (Operational Status)
- **Prisoner Inductions** — Blue notification banner shows prisoners who have completed induction (Laundry Number Added + Added to Jobs List). Click "Acknowledge" to dismiss and log to audit trail.
- **Low Yard Hours** — Identifies prisoners with less than 2 hours yard time
- **Missed Meals** — Identifies prisoners who missed all meals (Breakfast, Lunch, Dinner)
- **OPs Active** — Lists prisoners with OPs (Own Property) restrictions
- **CCs Active** — Lists prisoners with CCs (Cell Confinement) restrictions
- Color-coded alerts (amber for warnings, red for critical)
- Shows up to 5 prisoners per alert with name and cell

### Admin Hub
- **Password-protected** access (`/admin`)
- View **Audit trail** of all actions (handover, tasks, muster, locations, searches, etc.)
- Load mock prisoner data for testing
- View historical **hub snapshots**

### Audit Trail
- Records all significant actions with timestamps:
  - Prisoner saved/removed/moved
  - Location updates
  - Handover changes
  - Task completions
  - Muster confirmations
  - Search generation
  - And more...
- Filterable by unit
- Exportable movement logs (CSV)

### Print Functions
- Handover report print
- Muster roll sheet (full)
- Muster compact (single page)

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

## PCO access

- **URL:** `/pco` or `/unit/:unitId/pco`
- Set password via `VITE_PCO_PASSWORD` environment variable

## Build for production

```bash
npm run build
```

Output is in `dist/`. Serve with any static host.

## Environment Variables

Create a `.env` file for local development:

```
VITE_ADMIN_PASSWORD=your_admin_password
VITE_PCO_PASSWORD=your_pco_password
```

---

You can extend with a real backend, user auth, and more units or tasks as needed.
