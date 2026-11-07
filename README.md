# Room Utilization and Physical Access Management System (RUPAMS)

**Undergraduate Thesis Project**  
**University of Rizal System (URS) Morong Campus — College of Industrial Technology (CIT)**

A lightweight, purely web-based platform bridging institutional facility scheduling, physical key security, and laboratory incident management.

---

## 🎨 Minimalist Light Design System

The application strictly focuses on **3 clean, cohesive colors** without flashy gradients or bright distractions:
1. **Base Light Neutral:** Off-White / Clean Slate (`#f8fafc`, `#ffffff`, `#e2e8f0`)
2. **Deep Slate Navy (Primary):** Structure, headers, active navigation, primary buttons (`#1e3a5f`)
3. **Muted Slate (Secondary):** Secondary labels, table headers, metadata (`#475569`, `#64748b`)
* *Functional status indicators:* Soft Green (`#16a34a`) for available, Soft Red (`#dc2626`) for occupied/problem, Soft Amber (`#d97706`) for review/pending.

---

## 📱 1. Mobile Web App (Students & Faculty)

The mobile view is strictly limited to the **3 essential features** needed on campus:

1. **Peer-to-Peer Key Transfer (Borrow & Return):**
   * Students or faculty can open the web app on their phone to borrow, return, or transfer keys between peers.
   * **2-Factor Authorization:** An authorized custody transfer requires:
     * **Step 1:** Scanning / tapping the physical key's **NFC Card**.
     * **Step 2:** Scanning the recipient's **Personal QR Code** containing their identity and clearance.
   * Also includes a "My Personal Identity QR" screen so students/faculty can have their own QR code scanned by another peer.
2. **Facility Problem & Incident Reporting:**
   * Students or faculty can report issues encountered in academic rooms or workshops (e.g., equipment damage, electrical hazards, AC leaks, missing tools).
   * Users write a detailed problem description and **upload a photo** directly (via camera or photo file picker) with instant preview.
   * Immediately dispatches to the Admin Desk with timestamp, reporter credentials, and image evidence.
3. **Current Rooms Dashboard:**
   * A clean, uncluttered, focused view showing **ONLY**:
     * What rooms are occupied vs available.
     * What class and faculty is currently occupying the facility.

---

## 🖥️ 2. Admin Web Portal (Web PC)

Designed for program heads, department chairs, the dean, and administrative secretaries:

1. **Manual Schedule Creation with Constraint Enforcement:**
   * *Not automated generation:* Manually input by administrators based on:
     * CIT Rooms & Laboratories
     * Faculty Workloads
     * Course Curriculum Subjects
     * Room Capacity / Section Size
   * **Real-Time Constraint Checking:** Cross-references database constraints to actively prevent:
     * Room double-bookings / overlapping times.
     * Faculty assignment clashes.
     * Student cohort / section clashes.
     * Room capacity deficiencies.
2. **Automated Spreadsheet Output Module:**
   * Replaces manual spreadsheet plotting in third-party software like Microsoft Excel.
   * The system automatically generates a formatted, institutional semester timetable spreadsheet based on the manually entered schedules.
   * **1-Click Download Spreadsheet (.CSV / Excel):** Exports an instant `.csv` file compatible with Microsoft Excel and Google Sheets.
   * **1-Click Print Spreadsheet Matrix:** Clean official print layout.
3. **Peer-to-Peer Key Transfer Audit Ledger:**
   * Immutable record of all peer-to-peer key handovers, showing timestamp, room, from/to user, verified NFC UID, and verified Personal QR token.
4. **Facility Problem Reports Desk:**
   * Review all problem reports submitted from mobile devices.
   * View full-resolution uploaded photo evidence and manage resolution statuses (*Under Review*, *In Progress*, *Resolved*).
5. **Real-Time Facility Utilization Status:**
   * Complete overview of campus facilities and live class occupancy.

---

## 📂 Project Structure

```
RUPAMS/
├── index.html              # Main single-page application entry point
├── README.md               # Complete thesis documentation & testing guide
├── .gitignore              # Git ignore rules
├── css/
│   ├── main.css            # Minimalist 3-color base tokens, layout, modals, toast
│   ├── admin.css           # Admin scheduling panel, spreadsheet output, reports desk
│   └── mobile.css          # Mobile 3-feature workflow, P2P card, photo upload
└── js/
    ├── app.js              # Application controller & view orchestrator
    ├── state.js            # Reactive state management with LocalStorage persistence
    ├── mockData.js         # Initial URS Morong CIT baseline data (rooms, keys, schedules)
    ├── scheduler.js        # Manual schedule validator & constraint enforcement
    ├── keyManagement.js    # Peer-to-Peer NFC + QR key custody processor
    ├── qrNfcSim.js         # Vector SVG personal QR code generator & camera scanner
    └── audio.js            # Web Audio API sound synthesizer
```

---

## 🚀 How to Run

1. **Direct Browser Launch (Zero Install):**
   * Double-click [index.html](file:///c:/Users/efren%20L%20Cenir/OneDrive/Desktop/RUPAMS/index.html) to open in Chrome, Edge, or Firefox.
2. **Switching Views & Personas:**
   * Top bar toggle: Switch between `Admin Portal (PC)` and `Mobile Web App`.
   * Click the user name in the top right corner to switch between **Dr. Liezel Fernando (Admin)**, **Engr. Maria Elena Bautista (Faculty)**, and **Juan Dela Cruz (Student)**.
