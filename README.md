# Room Utilization and Physical Access Management System (RUPAMS)

**System Analysis and Design Project**  
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

## 📂 Multi-Page Architecture & Access Control

The application is structured into dedicated, role-separated HTML entrypoints:

1. **`index.html` — Portal Landing & Authentication Page:**
   * **PC Layout:** Left 65% width features the URS Morong campus background (`assets/urs-morong-campus-02-place.jfif`) and institutional pillars, while the right 35% contains the modern Sign In & Registration forms.
   * **Mobile Layout:** Elegant, simple centered card over the campus backdrop.
   * **Authentication:**
     * Admin Sign In and Registration (with administrative security key verification).
     * Faculty (Professors) Sign In and Registration (department workload assignments).
     * Students Sign In and Registration (Year and Section assignments).
     * **1-Click Quick Demo Sign In:** Instant evaluation logins for Dr. Liezel Fernando (Admin), Engr. Maria Elena Bautista (Faculty), and Juan Dela Cruz (Student).
   * **Automatic Redirection:** Automatically routes Admins to `admin.html`, and Faculty/Students to `mobile.html`.

2. **`admin.html` — Admin Portal (Web PC):**
   * **Strict Access Control:** Restricted exclusively to administrators, department heads, and Dean's Office personnel.
   * If an unauthorized account (faculty, student, or unauthenticated) attempts to access, an access restriction overlay blocks viewing and redirects to the mobile portal.
   * Features:
     1. **Real-Time Facility & Key Status Dashboard:** Room availability & physical key custody.
     2. **Manual Schedule Creator:** Real-time collision checking across 84 Year & Sections.
     3. **Automated Spreadsheet Output Module:** Export semestral timetables to CSV/Excel or print official matrix.
     4. **Key Counter Terminal:** Dean's Office station for checking out/in physical keys.
     5. **Key Logs Ledger:** Immutable RFID/QR key transactions history.
     6. **Problem Reports Desk:** Review facility issues and full-resolution photo evidence.

3. **`mobile.html` — Mobile Web App (Students & Faculty):**
   * **Role-Tailored Access:** Built specifically for Faculty and Students on smartphones or desktop viewports.
   * Features:
     1. **Rooms Availability Dashboard:** Real-time room status and key holder status.
     2. **Class Schedule Timetable:** Filtered by student's/faculty's **Year and Section** with day-by-day tabs.
     3. **Peer-to-Peer Key Transfer:** 2-Factor NFC & QR key handover between professors and student class representatives.
     4. **Facility Problem Report:** Submit maintenance and safety incident reports with camera/photo upload.

---

## 🖼️ Assets & Icons

* **Favicon & Touch Icon:** `assets/CITLogo.jpg` is used as the browser favicon and mobile web app home screen icon across all pages.
* **Header Branding:** CIT Logo (`assets/CITLogo.jpg`) is prominently displayed in the upper-left of every header with automatic fallback to the CIT badge if the image is loading.
* **Campus Backdrop:** `assets/urs-morong-campus-02-place.jfif` powers the 65% PC hero panel and mobile frosted landing background.

---

## 📑 Nomenclature Update

* **Year and Section:** All previous references to "cohorts" have been replaced across the entire database, user interface, scheduling validator, spreadsheet generator, and mobile timetable with the standard academic designation: **"Year and Section"** (e.g. `3rd Year - Section A (BSIT - Electronics Technology)`).
