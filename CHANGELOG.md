# Prison Muster Management Tool (PUMT)

## Changelog & Features Document

A comprehensive guide to all features and capabilities of the Prison Unit Management Tool (PUMT).

---

## 1. Overview

**PUMT** (Prison Unit Management Tool) is a web-based application for managing prison unit muster, daily tasks, handover notes, prisoner tracking, and operational analytics for Ara Poutama Aotearoa (Department of Corrections).

### Tech Stack
- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js/Express (optional, for sync & persistence)
- **Storage**: localStorage (frontend), SQLite (backend)
- **Real-time**: WebSocket support for live updates

---

## 2. Supported Units & Prisons

### Units (Invercargill Prison - Legacy)
- North Unit
- South Unit
- Remand Unit
- Centre Unit

### Prisons (Multi-Prison Support)
- Invercargill Prison
- OCF
- Christchurch Men's Prison
- Christchurch Women's Prison
- Rolleston Prison
- Rimutaka Prison
- Manawatu Prison
- Auckland Prison
- Mt Eden
- Auckland Women's Prison
- Spring Hill Correctional Facility
- NRFC

Each prison beyond Invercargill gets 12 placeholder units (Unit 1-12).

---

## 3. Pages & Navigation

| Route | Page | Description |
|--------|------|-------------|
| `/` | Prison Selector | Select prison to manage |
| `/prison/:id` | Unit Selection | Select unit within prison |
| `/unit/:unitId` or `/prison/:prisonId/unit/:unitId` | Unit Hub | Main unit dashboard |
| `/unit/:unitId/muster` | Muster Page | Prisoner muster list |
| `/unit/:unitId/pco` | Unit PCO Hub | Unit-level analytics |
| `/prison/:prisonId/control` | Control Hub | SCO-level overview |
| `/prison/:prisonId/sco` | SCO Hub | Movement log viewer |
| `/audit` | Audit Hub | Full audit trail |
| `/admin` | Admin Hub | Admin functions |
| `/unit-config` | Unit Config | Configure cells & facilities |

---

## 4. Core Features

### 4.1 Unit Hub Features

**Handover Notes**
- Standing Orders
- Medical Notes
- People Off Privileges
- Confinement notes

**Daily Tasks Checklist**
- PTAT
- CARE Stats
- Visit Bookings
- Medication Rounds
- Unit Inspections
- Lockdown Check
- Handover Complete
- Hoffman Knife
- Cutdown Scissors

**Muster Confirmation**
- Unlock check
- Random check
- Lockup check

**Daily Searches**
- 3 random cell searches (unique per day)
- 2 facility searches

**Weekly Cell Alarms**
- Check off cell alarms by cell number
- Cells populated from current muster

---

### 4.2 Muster Page Features

**Prisoner Management**
- Add new prisoners
- Edit prisoner details
- Remove prisoners from muster

**Prisoner Fields**
| Field | Description |
|-------|-------------|
| Name | Prisoner full name |
| Cell | Cell number |
| Security | UNCLASS, L1, L2, MIN, LOW, L/MED, MED, HIGH, MAX |
| Category | RMD/ACC, RMD/CONV, CONV, RECALL |
| Job | Grounds, Horticulture, Kitchen, Wing Orderly, Laundry, Sewing Room, Custom |
| Notes | Free-form notes |
| Protection | Protection prisoner flag |

**Status Flags**
| Flag | Description |
|------|-------------|
| OPs | Own Property restrictions |
| CCs | Cell Confinement |
| NTDB | Not To Be Discharged |

**Meal Tracking**
- Breakfast checkbox
- Lunch checkbox
- Dinner checkbox

**Location Tracking**
- Current location (CELL, YARD, MEDICAL, COURT, VISITS, PROGRAMMES, WORK, OTHER)
- Hours out of unit
- Location history with timestamps

**Bulk Operations**
- Set location for multiple prisoners
- Move prisoners to different units
- Bulk return from activities (Yard, Gym, Work)

**Sorting & Filtering**
- Alphabetical by last name (A-Z)

**Print Options**
- Full muster roll sheet
- Compact single-page version

---

### 4.3 Prisoner Induction

**Required Fields**
- Laundry Number Added
- Added to Jobs List

**Optional Fields**
- SACRA Completed
- Induction notes
- Inducted by (name)

**Workflow**
1. Edit prisoner in Muster Page
2. Expand "Induction Details"
3. Check required items
4. Save - automatically timestamps and notifies PCO

---

### 4.4 Control Hub Features

**Muster Overview**
- Total prisoner count
- Onsite vs Offsite breakdown
- Per-unit breakdown

**Handover Notes**
- General notes
- Visits notes
- Other notes

**Daily Reset**
- Reset all daily tasks
- Reset prisoner locations to CELL
- Clear meal checkboxes
- Preserves handover notes

**Snapshot Saving**
- Manual save hub state
- Auto-save on daily reset
- View historical snapshots

**Quick Person Lookup**
- Search by name or ID
- Direct links to unit

---

### 4.5 PCO Hub Features

**Unit PCO Hub** (`/unit/:unitId/pco`)

**Operational Analytics**
- Total prisoners count
- By-location breakdown
- Incomplete task count

**Alerts & Notifications**
| Alert | Description |
|-------|-------------|
| Prisoner Inductions | Blue banner for completed inductions awaiting acknowledgment |
| Low Yard Hours | Prisoners with <2 hours yard time (amber) |
| Missed Meals | Prisoners who missed all meals (red) |
| OPs Active | Prisoners with OPs restrictions (red) |
| CCs Active | Prisoners with CCs restrictions (red) |

**Activity Summary**
- Movement actions count
- Tasks completed / total
- Audit entries
- Out of unit count

**Snapshot Review**
- View historical hub snapshots

**Audit Trail**
- Unit-specific audit entries

---

### 4.6 SCO Hub Features

**Movement Log**
- Real-time movement tracking
- Filtered from audit trail
- Shows moves and location updates
- Live polling mode (2s, 5s, 10s, 30s intervals)

---

### 4.7 Admin Hub Features

**Password Protected**
- Access via `/admin`
- Session-based authentication

**Functions**
- Load mock prisoner data
- View all audit entries
- Browse hub snapshots
- System configuration

---

### 4.8 Audit Trail

**Tracked Actions**
- Prisoner saved/removed/moved
- Location updates
- Handover changes
- Task completions
- Muster confirmations
- Search generation
- Induction acknowledgments
- And more...

**Features**
- Timestamp for each entry
- Unit and prisoner association
- Backend storage with screenshots
- HTML snapshot capture
- Filterable by unit
- Exportable

---

### 4.9 Unit Configuration

**Cell Configuration**
- Add cell ranges (e.g., 1-50)
- Add single cells
- Exception handling (skip numbers)
- Minimum 3 cells required

**Facility Configuration**
- Add custom facilities
- Edit existing facilities
- Remove facilities
- Minimum 2 facilities required

---

## 5. Recent Updates

### UI Improvements (2025-02)
- **GlassLayout**: Persistent sidebar navigation
- **Mobile Responsive**: Collapsible sidebar with hamburger menu
- **Splash Screen**: Reduced to 2 seconds
- **Muster Table**: Auto-adjusting columns, tighter spacing
- **Header Alignment**: Consistent column headers

### Backend Features
- **SQLite Database**: Persistent storage
- **WebSocket Support**: Real-time sync
- **Page Capture**: HTML/PDF snapshot recording
- **API Endpoints**: RESTful data management
- **Authentication**: Session-based login

---

## 6. Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_ADMIN_PASSWORD` | Admin access password | (none) |
| `VITE_PCO_PASSWORD` | PCO access password | (none) |
| `VITE_API_URL` | Backend API URL | http://localhost:3001 |

---

## 7. Running the App

### Development
```bash
cd prison-muster-app
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run build
node dist/index.js
```

### Production Build
```bash
npm run build
# Output in dist/
```

---

## 8. Security Notes

- Default admin password: `admin2024` (change in production)
- PCO password: Set via environment variable
- All passwords should be changed in production
- localStorage data is not encrypted - do not use for sensitive production data

---

## 9. Data Storage

**Frontend (localStorage)**
- Prisoners
- Daily tasks
- Handover notes
- Movement logs
- Hub snapshots
- Audit entries
- Unit configuration

**Backend (SQLite)**
- Audit records with screenshots
- Prison briefings
- Unit configurations
- User sessions

---

## 10. Future Enhancements

Potential features for future development:

- [ ] Movement log filters (by date, prisoner, location)
- [ ] Weekly trend graphs in PCO Hub
- [ ] Snapshot recovery/restore
- [ ] PDF export for all reports
- [ ] User role management
- [ ] Multi-factor authentication
- [ ] Offline mode with sync
- [ ] Mobile app companion
- [ ] Incident reporting module
- [ ] Medication tracking
- [ ] Visit scheduling integration

---

## 11. Support & Credits

**Developed for**: Ara Poutama Aotearoa (Department of Corrections NZ)

**Tech Stack**: Vite, React 18, TypeScript, Tailwind CSS, Node.js, SQLite

**Version**: 1.0.0

**Last Updated**: February 2026
