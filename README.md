# Room Utilization and Physical Access Management System (RUPAMS)

**Undergraduate Thesis Project**  
**University of Rizal System (URS) Morong Campus — College of Industrial Technology (CIT)**

A lightweight, purely web-based platform bridging institutional facility scheduling, physical key security, and laboratory incident management.

---

## 🎨 Minimalist Light Design System

The application strictly focuses on **3 clean, cohesive colors** without flashy gradients or bright distractions:
1. **Base Light Neutral:** Off-White / Clean Slate (`#f8fafc`, `#ffffff`, `#e2e8f0`)
2. **Deep Slate Navy (Primary):** System headers, primary action buttons, dark text, and active navigation indicators (`#1e3a5f`)
3. **Muted Slate (Secondary):** Table headers, secondary buttons, labels, and captions (`#475569`, `#64748b`)
* *Functional status indicators:* Soft Green (`#16a34a`) for available/in cabinet, Soft Red (`#dc2626`) for occupied/borrowed, Soft Amber (`#d97706`) for review/pending.

---

## 📱 1. Mobile Web App (Students & Faculty)

The mobile view is strictly limited to the **3 essential features** needed on campus:

1. **Current Rooms Dashboard (with Key Status):**
   * A clean, uncluttered, focused view showing:
     * Room code & facility name.
     * Room Status: *Available* or *Occupied*.
     * **Key Status:** *In Cabinet (Dean's Office)* (🟢) or *Borrowed* (🔴) with current holder.
     * What class and faculty is currently occupying the facility.
2. **Key Handover / Transfer (Borrow, Return, Transfer):**
   * Students or faculty can borrow, return, or transfer keys between peers.
   * **2-Factor Authorization Workflow:**
     * **Step 1 (Physical Key NFC):** Shows the animated **NFC Scanner** visual sensor to tap and verify the physical key card UID.
     * **Step 2 (Personal QR):** Shows the live **Camera / QR Scanner** to align and verify the recipient's personal identity QR code.
     * **Step 3 (Authorize):** Summary review and completion with instant custody update.
   * Also includes a "My Personal Identity QR" screen so students/faculty can present their QR code to peers or at the Dean's counter.
3. **Facility Problem & Incident Reporting:**
   * Students or faculty can report issues encountered in academic rooms or workshops (e.g., equipment damage, electrical hazards, AC leaks, missing tools).
   * Users write a detailed problem description and **upload a photo** directly (via camera or photo file picker) with instant preview.
   * Immediately dispatches to the Admin Desk with timestamp, reporter credentials, and image evidence.

---

## 🖥️ 2. Admin Web Portal (Web PC)

Designed for program heads, department chairs, the dean, and administrative secretaries:

1. **Dedicated "Key Counter" Tab (Dean's Office Station):**
   * A dedicated counter terminal where students and faculty can log key check-outs, returns, or custody transfers in the Dean's Office.
   * Follows the exact same 3-step verification workflow as the mobile app:
     * Choose Action: **Borrowed** (from cabinet to student/faculty), **Returned** (back to cabinet), or **Transfered** (custody transfer logged at counter).
     * **Step 1:** Key NFC Scanner to scan/verify key tag.
     * **Step 2:** Camera / QR Scanner to scan personnel QR badge.
     * **Step 3:** Authorize & save directly into the Key Logs ledger.
   * Displays a live **Dean's Cabinet Status Board** showing all 10 cabinet slots and who holds each key.
2. **Manual Schedule Creation with Program, Year & Section Breakdown:**
   * *Not automated generation:* Manually input by administrators based on:
     * Student Program (`BSIT - Automotive`, `Electrical`, `Electronics`, `Computer`, `Mechanical`, `Drafting`, `Food Service`)
     * Year Level (`1st Year`, `2nd Year`, `3rd Year`, `4th Year`)
     * Section (`Section A`, `Section B`, `Section C`)
     * CIT Facility / Room
     * Faculty Workload
     * Course Curriculum Subject
     * Total Section Occupancy
   * **Real-Time Constraint Checking:** Cross-references database constraints to actively prevent:
     * Room double-bookings / overlapping times.
     * Faculty assignment clashes.
     * Student cohort / section clashes.
     * Room capacity deficiencies.
   * **Cohort Filtering:** Filter committed schedules on the right panel by **Program**, **Year Level**, and **Section** to view any specific cohort's timetable.
3. **Automated Spreadsheet Output Module:**
   * Replaces manual spreadsheet plotting in third-party software like Microsoft Excel.
   * Automatically compiles all manually entered schedules into an institutional semestral timetable spreadsheet.
   * **1-Click Download Spreadsheet (.CSV / Excel):** Exports an instant `.csv` file compatible with Microsoft Excel and Google Sheets.
   * **1-Click Print Spreadsheet Matrix:** Clean official print layout.
4. **Key Logs Ledger:**
   * Official immutable audit record of all key borrowings, returns, and transfers.
   * Action types strictly: **Borrowed**, **Returned**, **Transfered**.
   * Shows whether the transaction occurred at the **Dean's Office Counter** or via the **Mobile App**, with verified NFC UID and Personal QR token.
5. **Facility Problem Reports Desk:**
   * Review all problem reports submitted from mobile devices.
   * View full-resolution uploaded photo evidence and manage resolution statuses (*Under Review*, *In Progress*, *Resolved*).
6. **Real-Time Facility & Key Status Dashboard:**
   * Complete overview of campus facilities, live class occupancy, and explicit physical key custody status (*In Cabinet* vs *Borrowed*).

---

## 📂 Project Structure

```
RUPAMS/
├── index.html              # Main single-page application entry point
├── README.md               # Complete thesis documentation & testing guide
├── .gitignore              # Git ignore rules
├── css/
│   ├── main.css            # Minimalist 3-color base tokens, layout, modals, toast
│   ├── admin.css           # Admin scheduling panel, Key Counter terminal, reports desk
│   └── mobile.css          # Mobile 3-feature workflow, NFC wave scanner, camera viewport
└── js/
    ├── app.js              # Application controller & view orchestrator
    ├── state.js            # Reactive state management with LocalStorage persistence
    ├── mockData.js         # Initial URS Morong CIT baseline data (rooms, keys, schedules)
    ├── scheduler.js        # Manual schedule validator & constraint enforcement
    ├── keyManagement.js    # Key transaction processor (Borrowed, Returned, Transfered)
    ├── qrNfcSim.js         # Camera QR scanner & vector SVG QR code generator
    └── audio.js            # Web Audio API sound synthesizer
```

---

## 🚀 How to Run

1. **Direct Browser Launch (Zero Install):**
   * Double-click [index.html](file:///c:/Users/efren L Cenir/OneDrive/Desktop/RUPAMS/index.html) to open in Chrome, Edge, or Firefox.
2. **Switching Views & Personas:**
   * Top bar toggle: Switch between `Admin Portal (PC)` and `Mobile Web App`.
   * Click the user name in the top right to switch between **Dr. Liezel Fernando (Admin)**, **Engr. Maria Elena Bautista (Faculty)**, and **Juan Dela Cruz (Student)**.
