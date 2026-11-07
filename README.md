# Room Utilization and Physical Access Management System (RUPAMS)

Developed as an undergraduate thesis project for the **University of Rizal System (URS) Morong Campus**, **College of Industrial Technology (CIT)**.

RUPAMS bridges institutional facility scheduling and physical key security by separating functionality into an **Admin Web Portal** (desktop-focused for centralized scheduling, automated conflict prevention, and real-time dashboards) and a **Mobile Web App** (for students and faculty handling digital borrowing requests, returns, and simulated NFC/QR multi-modal key transactions). Built purely with frontend web technologies (HTML5, CSS3, and JavaScript), state and application data are handled client-side using reactive LocalStorage persistence.

---

## 🏛️ Institutional Context

* **Institution:** University of Rizal System (URS)
* **Campus:** Morong Campus, Rizal, Philippines
* **Department:** College of Industrial Technology (CIT)
* **Facilities Covered:**
  * Lecture Halls (CIT 101, CIT 102, CIT 103)
  * Computer & CADD Laboratories (CIT CompLab 1, CIT CompLab 2)
  * Electronics & Robotics Laboratory (CIT-ELX)
  * Electrical Workshop & Motor Controls (CIT-ELEC)
  * Automotive Technology Service Bay (CIT-AUTO)
  * Mechanical Fabrication & Welding Shop (CIT-MECH)
  * Food Service & Hospitality Lab (CIT-FSM)

---

## 🚀 Key System Modules & Features

### 1. Admin Web Portal (Desktop)
* **Centralized Real-Time Room Monitoring Dashboard:**
  * Live visibility of facility utilization: *Available*, *Occupied*, *Reserved*, or *Overdue*.
  * Instant room status indicators with live occupant tracking and scheduled class timetables.
* **Automated Timetable Generation Module:**
  * Eliminates manual schedule plotting in Microsoft Excel with a 1-click constraint-satisfaction scheduling engine.
  * Ingests faculty workloads, room capacities, and equipment requirements to generate conflict-free class matrices.
* **Real-Time Conflict Detection & Double-Occupancy Prevention:**
  * Cross-references active database constraints in real-time.
  * Detects and blocks room double-bookings, faculty scheduling overlaps, and section collisions.
* **Digital Review and Approval Workflow Portal:**
  * Multi-stage review lifecycle: `Draft` ➔ `Program Head Review` ➔ `Dean Approval` ➔ `Official Published`.
  * Preserves review audit trails and timestamped administrative endorsements.
* **Digital Key Registry & Smart Cabinet Monitor:**
  * Replaces vulnerable paper logbooks with a centralized digital tracking registry.
  * Visual representation of physical key cabinet hooks (Slots #01 to #10) with real-time custody states.
* **Rapid Incident Tracing & Digital History Logs:**
  * Forensic query engine allowing campus security and administrators to filter access logs by room, date range, or keyword to instantly trace who held the key during specific operational windows.
* **Automated Overdue Key Tracking & Alerts:**
  * Background monitoring scheduler running continuous interval checks that flags overdue keys, calculates overdue minutes, and dispatches sound/visual alerts.

### 2. Mobile Web App (Students & Faculty)
* **Digital Key Borrowing Requests:**
  * Allows students and faculty to submit borrowing requests directly from mobile devices, specifying room, purpose, expected duration, and faculty endorsement.
* **Digital Key Pass & Dynamic QR Code:**
  * Displays an authorized digital pass ticket with dynamic vector QR code validation tokens and real-time return countdown timer.
* **NFC Key Identification & Virtual Tap Simulator:**
  * Simulates physical NFC RFID key tag scanning with Web Audio sound synthesis, haptic wave visual animations, and support for hardware Web NFC API (`NDEFReader`).
* **Instant Returns & Overdue Resolution:**
  * One-touch return verification that instantly logs custody back to the smart cabinet slot and clears facility occupancy.

---

## 🛠️ Tech Stack

* **Frontend:** Vanilla HTML5, CSS3 (Custom Responsive Layouts with URS Morong Theme Tokens), JavaScript (ES6 Modules)
* **Audio Feedback:** Web Audio API (Synthesized high-frequency NFC chimes, laser scan tones, and overdue alarms with zero external asset dependencies)
* **Camera / QR:** WebRTC `getUserMedia` with HTML5 Canvas / `BarcodeDetector` API and client-side vector SVG QR rendering
* **Data Persistence:** Client-side JavaScript LocalStorage with JSON backup export, import, and default database reset
* **Version Control:** Git & GitHub

---

## 📂 Project Structure

```
RUPAMS/
├── index.html              # Main single-page application entry point
├── css/
│   ├── main.css            # Base design system, URS color palette, typography, modals
│   ├── admin.css           # Admin dashboard, weekly matrix grid, cabinet visualizer
│   └── mobile.css          # Mobile web app interface, phone frame bezel, digital pass
├── js/
│   ├── app.js              # Application controller, view routing, role switching
│   ├── state.js            # Reactive state management with LocalStorage persistence
│   ├── mockData.js         # Initial URS Morong CIT baseline data (rooms, keys, schedules)
│   ├── scheduler.js        # Automated timetable generation engine & conflict detector
│   ├── keyManagement.js    # Key borrowing, return, overdue background monitor, forensic tracer
│   ├── audio.js            # Web Audio API sound synthesizer
│   └── qrNfcSim.js         # Multi-modal NFC tap simulator and camera QR scanner
└── README.md               # System documentation & usage guide
```

---

## 🏁 Getting Started

### Prerequisites

You only need a modern web browser:
* Google Chrome (recommended for Web NFC & BarcodeDetector support)
* Mozilla Firefox
* Microsoft Edge
* Apple Safari

### Running the System

1. **Option A: Direct Browser Launch (Zero Install)**
   * Simply double-click `index.html` or drag it into any web browser.

2. **Option B: Local HTTP Server (Optional)**
   Using Python:
   ```bash
   python -m http.server 8000
   ```
   Or using Node.js:
   ```bash
   npx serve .
   ```
   Open `http://localhost:8000` in your web browser.

---

## 🧪 Demonstration & Testing Guide

1. **Switching Between Admin Portal and Mobile Web App:**
   * Use the `🖥️ Admin Portal` and `📱 Mobile App` pill buttons in the top header.
   * When in Mobile App mode, click `📱 Device Bezel` to toggle between realistic smartphone frame and full responsive view.

2. **Testing Role Switching (Personas):**
   * Click the user profile badge in the top right corner:
     * **Dr. Liezel Fernando (Admin):** Full scheduling, review, and cabinet access.
     * **Engr. Maria Elena Bautista (Faculty):** Electronics Dept. Chair view.
     * **Juan Dela Cruz (Student):** 3rd Year BSIT Electronics student with active key pass.

3. **Testing Automated Timetable Generation:**
   * Go to **Timetable Generator** in the Admin sidebar.
   * Click **⚡ Generate Optimized Timetable** to run the constraint-satisfaction engine and observe the 0% conflict rate.

4. **Testing Real-Time Conflict Detection:**
   * Go to **Conflict Detection** in the Admin sidebar.
   * Click the preset buttons:
     * *Test Preset: Room Double-Booking* (Instantly flags facility collisions in red).
     * *Test Preset: Faculty Overlap* (Flags instructor double-booking).

5. **Testing NFC & QR Key Handovers:**
   * Click **📡 NFC Key Tap Simulator** from any screen to simulate tapping physical keys (`KEY-CIT-101`, `KEY-CIT-AUTO`, `KEY-CIT-ELX`).
   * Listen to the Web Audio digital chimes and watch the cabinet hook lights update in real time.

6. **Testing Automated Overdue Key Tracking:**
   * Notice the overdue key `KEY-CIT-AUTO` pre-loaded in the system.
   * The background monitor flags the overdue status, triggers the top red alarm badge, and flashes the countdown timer.

7. **Testing Rapid Incident Tracing:**
   * Go to **Incident Tracing** in the Admin sidebar.
   * Select a room (e.g. `CIT-AUTO` or `CIT-ELX`) and click **Execute Forensic Search** to extract historical key holders and custody windows.

---

## 📜 Thesis Attribution

* **Project:** Room Utilization and Physical Access Management System (RUPAMS)
* **Institution:** University of Rizal System Morong Campus
* **College:** College of Industrial Technology (CIT)
* **Year:** Academic Year 2026-2027
