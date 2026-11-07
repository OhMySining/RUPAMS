/**
 * RUPAMS - Initial Seed Data
 * University of Rizal System (URS) Morong Campus
 * College of Industrial Technology (CIT)
 */

const INITIAL_MOCK_DATA = {
  institution: {
    university: "University of Rizal System",
    campus: "Morong Campus",
    college: "College of Industrial Technology (CIT)",
    academicYear: "2026-2027",
    semester: "1st Semester",
    systemName: "RUPAMS",
    fullTitle: "Room Utilization & Physical Access Management System"
  },

  rooms: [
    {
      id: "ROOM-01",
      code: "CIT-101",
      name: "CIT Lecture Hall 101",
      building: "CIT Main Academic Wing",
      floor: "1st Floor",
      capacity: 45,
      type: "Lecture",
      keyId: "KEY-CIT-101",
      equipment: ["Overhead Laser Projector", "Smart Podium", "Wall-mount Split AC", "45 Tablet Armchairs"],
      status: "available", // available | occupied | reserved | maintenance
      currentOccupant: null,
      activeSchedule: null
    },
    {
      id: "ROOM-02",
      code: "CIT-102",
      name: "CIT Lecture Hall 102",
      building: "CIT Main Academic Wing",
      floor: "1st Floor",
      capacity: 40,
      type: "Lecture",
      keyId: "KEY-CIT-102",
      equipment: ["Multimedia Projector", "Whiteboard", "35 Armchairs"],
      status: "available",
      currentOccupant: null,
      activeSchedule: null
    },
    {
      id: "ROOM-03",
      code: "CIT-103",
      name: "CIT Lecture Hall 103",
      building: "CIT Main Academic Wing",
      floor: "2nd Floor",
      capacity: 40,
      type: "Lecture",
      keyId: "KEY-CIT-103",
      equipment: ["Interactive Display", "Sound System", "Faculty Workstation"],
      status: "available",
      currentOccupant: null,
      activeSchedule: null
    },
    {
      id: "ROOM-04",
      code: "CIT-CL1",
      name: "Computer & CADD Lab 1",
      building: "CIT Technology Center",
      floor: "2nd Floor",
      capacity: 35,
      type: "Computer Lab",
      keyId: "KEY-CIT-CL1",
      equipment: ["35 Core-i7 Workstations", "AutoCAD 2026 Licenses", "Gigabit Managed Switch", "Duplex Laser Plotter"],
      status: "occupied",
      currentOccupant: {
        name: "Prof. Liezel Fernando",
        role: "Faculty",
        course: "COMP 202 - Database Systems",
        startTime: "08:00",
        expectedEnd: "11:00",
        keyStatus: "borrowed"
      },
      activeSchedule: {
        courseCode: "COMP 202",
        section: "BSIT-3A",
        faculty: "Prof. Liezel Fernando",
        time: "08:00 - 11:00"
      }
    },
    {
      id: "ROOM-05",
      code: "CIT-CL2",
      name: "Advanced IT & Multimedia Lab 2",
      building: "CIT Technology Center",
      floor: "2nd Floor",
      capacity: 35,
      type: "Computer Lab",
      keyId: "KEY-CIT-CL2",
      equipment: ["35 High-spec Workstations", "CISCO Networking Racks", "Dual Projection Systems"],
      status: "reserved",
      currentOccupant: {
        name: "Engr. Danilo Reyes",
        role: "Faculty",
        course: "Special Simulation Lab",
        startTime: "13:00",
        expectedEnd: "16:00",
        keyStatus: "in_cabinet"
      },
      activeSchedule: null
    },
    {
      id: "ROOM-06",
      code: "CIT-ELX",
      name: "Electronics & Robotics Laboratory",
      building: "CIT Engineering Laboratories",
      floor: "1st Floor",
      capacity: 30,
      type: "Electronics Lab",
      keyId: "KEY-CIT-ELX",
      equipment: ["15 Digital Storage Oscilloscopes", "Dual-output DC Power Supplies", "SMD Rework Stations", "Arduino & STM32 Dev Kits"],
      status: "occupied",
      currentOccupant: {
        name: "Juan Dela Cruz (Student Rep)",
        role: "Student",
        course: "ELX 315 - Robotics Capstone",
        startTime: "09:30",
        expectedEnd: "11:30",
        keyStatus: "borrowed"
      },
      activeSchedule: null
    },
    {
      id: "ROOM-07",
      code: "CIT-ELEC",
      name: "Electrical Workshop & Motor Controls",
      building: "CIT Heavy Industries Bldg",
      floor: "Ground Floor",
      capacity: 30,
      type: "Electrical Workshop",
      keyId: "KEY-CIT-ELEC",
      equipment: ["Three-Phase Motor Test Benches", "Siemens S7-1200 PLCs", "Industrial Control Panels", "Megger Insulation Testers"],
      status: "available",
      currentOccupant: null,
      activeSchedule: null
    },
    {
      id: "ROOM-08",
      code: "CIT-AUTO",
      name: "Automotive Technology Bay",
      building: "CIT Heavy Industries Bldg",
      floor: "Ground Floor",
      capacity: 25,
      type: "Automotive Shop",
      keyId: "KEY-CIT-AUTO",
      equipment: ["Hydraulic 2-Post Vehicle Lift", "Engine OBD-II Diagnostic Scanners", "Engine Dynamometer", "Wheel Alignment Rig"],
      status: "overdue", // Demonstrates overdue state!
      currentOccupant: {
        name: "Mark Jayson Rivera (Student)",
        role: "Student",
        course: "AUTO 211 - Engine Overhaul Lab",
        startTime: "07:00",
        expectedEnd: "09:30",
        keyStatus: "overdue"
      },
      activeSchedule: null
    },
    {
      id: "ROOM-09",
      code: "CIT-MECH",
      name: "Mechanical Fabrication & Machine Shop",
      building: "CIT Heavy Industries Bldg",
      floor: "Ground Floor",
      capacity: 25,
      type: "Mechanical Shop",
      keyId: "KEY-CIT-MECH",
      equipment: ["Engine Lathe Machines", "Universal Milling Machine", "MIG/TIG Welding Stations", "Hydraulic Shear & Bender"],
      status: "available",
      currentOccupant: null,
      activeSchedule: null
    },
    {
      id: "ROOM-10",
      code: "CIT-FSM",
      name: "Food & Service Management Lab",
      building: "CIT Main Academic Wing",
      floor: "3rd Floor",
      capacity: 30,
      type: "Food Tech",
      keyId: "KEY-CIT-FSM",
      equipment: ["Commercial Gas Ranges & Hoods", "Stainless Prep Stations", "Deck Baking Ovens", "Refrigerated Walk-in Cooler"],
      status: "available",
      currentOccupant: null,
      activeSchedule: null
    }
  ],

  faculty: [
    {
      id: "FAC-001",
      name: "Engr. Maria Elena Bautista",
      role: "Faculty / Program Head",
      department: "Electronics Technology",
      email: "mebautista@urs.edu.ph",
      phone: "+63 917 554 1201",
      maxUnits: 21,
      preferredDays: ["Monday", "Wednesday", "Friday"]
    },
    {
      id: "FAC-002",
      name: "Prof. Roberto Santos",
      role: "Faculty",
      department: "Automotive Technology",
      email: "rsantos@urs.edu.ph",
      phone: "+63 920 441 3392",
      maxUnits: 24,
      preferredDays: ["Tuesday", "Thursday", "Saturday"]
    },
    {
      id: "FAC-003",
      name: "Dr. Arnel Cruz",
      role: "Faculty",
      department: "Electrical Technology",
      email: "acruz@urs.edu.ph",
      phone: "+63 918 776 2209",
      maxUnits: 21,
      preferredDays: ["Monday", "Tuesday", "Thursday"]
    },
    {
      id: "FAC-004",
      name: "Prof. Liezel Fernando",
      role: "Faculty / Schedule Coordinator",
      department: "Computer Technology",
      email: "lfernando@urs.edu.ph",
      phone: "+63 927 332 8841",
      maxUnits: 21,
      preferredDays: ["Monday", "Wednesday", "Friday"]
    },
    {
      id: "FAC-005",
      name: "Engr. Danilo Reyes",
      role: "Faculty",
      department: "Mechanical Technology",
      email: "dreyes@urs.edu.ph",
      phone: "+63 905 889 4412",
      maxUnits: 24,
      preferredDays: ["Tuesday", "Thursday", "Saturday"]
    },
    {
      id: "FAC-006",
      name: "Prof. Carmela Dela Cruz",
      role: "Faculty",
      department: "Drafting & Design",
      email: "cdelacruz@urs.edu.ph",
      phone: "+63 939 123 4567",
      maxUnits: 18,
      preferredDays: ["Monday", "Tuesday", "Wednesday"]
    },
    {
      id: "FAC-007",
      name: "Chef Antonio Morales",
      role: "Faculty",
      department: "Food & Service Management",
      email: "amorales@urs.edu.ph",
      phone: "+63 915 990 1283",
      maxUnits: 21,
      preferredDays: ["Wednesday", "Thursday", "Friday"]
    },
    {
      id: "FAC-008",
      name: "Prof. Ramon Garcia",
      role: "Faculty",
      department: "Applied Sciences & Safety",
      email: "rgarcia@urs.edu.ph",
      phone: "+63 922 456 7890",
      maxUnits: 21,
      preferredDays: ["Monday", "Thursday", "Saturday"]
    }
  ],

  courses: [
    {
      code: "AUTO 211",
      title: "Automotive Engine Management & Fuel Systems",
      units: 3,
      hours: 5,
      facultyId: "FAC-002",
      roomType: "Automotive Shop",
      section: "BSIT-AUTO-2A",
      enrolled: 24
    },
    {
      code: "ELX 315",
      title: "Microcontroller Systems & Robotics Interfacing",
      units: 3,
      hours: 5,
      facultyId: "FAC-001",
      roomType: "Electronics Lab",
      section: "BSIT-ELX-3A",
      enrolled: 28
    },
    {
      code: "ELEC 112",
      title: "Industrial Motor Control & Programmable Logic",
      units: 3,
      hours: 5,
      facultyId: "FAC-003",
      roomType: "Electrical Workshop",
      section: "BSIT-ELEC-1B",
      enrolled: 26
    },
    {
      code: "COMP 202",
      title: "Relational Database Management & Integration",
      units: 3,
      hours: 5,
      facultyId: "FAC-004",
      roomType: "Computer Lab",
      section: "BSIT-COMP-2A",
      enrolled: 32
    },
    {
      code: "DRAFT 101",
      title: "Parametric 3D CAD & Engineering Drawing",
      units: 3,
      hours: 5,
      facultyId: "FAC-006",
      roomType: "Computer Lab",
      section: "BSIT-DRAFT-1A",
      enrolled: 30
    },
    {
      code: "MECH 214",
      title: "Precision Machining & Metallurgy Laboratory",
      units: 3,
      hours: 5,
      facultyId: "FAC-005",
      roomType: "Mechanical Shop",
      section: "BSIT-MECH-2B",
      enrolled: 22
    },
    {
      code: "FSM 103",
      title: "Commercial Culinary Operations & Sanitation",
      units: 3,
      hours: 5,
      facultyId: "FAC-007",
      roomType: "Food Tech",
      section: "BSIT-FSM-1A",
      enrolled: 28
    },
    {
      code: "CIT 100",
      title: "Occupational Safety and Health in Industrial Facilities",
      units: 2,
      hours: 2,
      facultyId: "FAC-008",
      roomType: "Lecture",
      section: "BSIT-GEN-1A",
      enrolled: 38
    },
    {
      code: "ELX 420",
      title: "Mechatronics & IoT Automation Capstone",
      units: 3,
      hours: 5,
      facultyId: "FAC-001",
      roomType: "Electronics Lab",
      section: "BSIT-ELX-4A",
      enrolled: 25
    },
    {
      code: "AUTO 322",
      title: "Electric & Hybrid Vehicle Powertrains",
      units: 3,
      hours: 5,
      facultyId: "FAC-002",
      roomType: "Automotive Shop",
      section: "BSIT-AUTO-3A",
      enrolled: 20
    }
  ],

  keys: [
    {
      keyId: "KEY-CIT-101",
      roomCode: "CIT-101",
      label: "CIT Lecture 101 Master Key",
      nfcUid: "04:B2:77:A1:9F:80",
      qrPayload: "RUPAMS-KEY-CIT-101-SECURE",
      cabinetSlot: "Slot #01",
      status: "in_cabinet", // in_cabinet | borrowed | overdue | maintenance
      currentHolder: null,
      borrowHistoryCount: 42
    },
    {
      keyId: "KEY-CIT-102",
      roomCode: "CIT-102",
      label: "CIT Lecture 102 Master Key",
      nfcUid: "04:C3:88:B2:AE:81",
      qrPayload: "RUPAMS-KEY-CIT-102-SECURE",
      cabinetSlot: "Slot #02",
      status: "in_cabinet",
      currentHolder: null,
      borrowHistoryCount: 38
    },
    {
      keyId: "KEY-CIT-103",
      roomCode: "CIT-103",
      label: "CIT Lecture 103 Master Key",
      nfcUid: "04:D4:99:C3:BD:82",
      qrPayload: "RUPAMS-KEY-CIT-103-SECURE",
      cabinetSlot: "Slot #03",
      status: "in_cabinet",
      currentHolder: null,
      borrowHistoryCount: 31
    },
    {
      keyId: "KEY-CIT-CL1",
      roomCode: "CIT-CL1",
      label: "CIT CompLab 1 Master Key",
      nfcUid: "04:E5:AA:D4:CE:83",
      qrPayload: "RUPAMS-KEY-CIT-CL1-SECURE",
      cabinetSlot: "Slot #04",
      status: "borrowed",
      currentHolder: {
        userId: "FAC-004",
        name: "Prof. Liezel Fernando",
        role: "Faculty",
        contact: "+63 927 332 8841",
        purpose: "COMP 202 Official Class Schedule",
        checkedOutAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 mins ago
        dueAt: new Date(Date.now() + 75 * 60 * 1000).toISOString(), // 75 mins from now
        verificationMode: "NFC_TAP",
        requestId: "REQ-2026-104"
      },
      borrowHistoryCount: 88
    },
    {
      keyId: "KEY-CIT-CL2",
      roomCode: "CIT-CL2",
      label: "CIT CompLab 2 Master Key",
      nfcUid: "04:F6:BB:E5:DF:84",
      qrPayload: "RUPAMS-KEY-CIT-CL2-SECURE",
      cabinetSlot: "Slot #05",
      status: "in_cabinet",
      currentHolder: null,
      borrowHistoryCount: 64
    },
    {
      keyId: "KEY-CIT-ELX",
      roomCode: "CIT-ELX",
      label: "Electronics Lab Master Key",
      nfcUid: "04:17:CC:F6:E0:85",
      qrPayload: "RUPAMS-KEY-CIT-ELX-SECURE",
      cabinetSlot: "Slot #06",
      status: "borrowed",
      currentHolder: {
        userId: "STU-2024-0012",
        name: "Juan Dela Cruz",
        role: "Student (BSIT 3rd Year)",
        contact: "+63 917 111 2233",
        purpose: "Senior Capstone Robot Assembly Testing",
        facultyEndorser: "Engr. Maria Elena Bautista",
        checkedOutAt: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
        dueAt: new Date(Date.now() + 50 * 60 * 1000).toISOString(),
        verificationMode: "QR_SCAN",
        requestId: "REQ-2026-102"
      },
      borrowHistoryCount: 95
    },
    {
      keyId: "KEY-CIT-ELEC",
      roomCode: "CIT-ELEC",
      label: "Electrical Workshop Master Key",
      nfcUid: "04:28:DD:07:F1:86",
      qrPayload: "RUPAMS-KEY-CIT-ELEC-SECURE",
      cabinetSlot: "Slot #07",
      status: "in_cabinet",
      currentHolder: null,
      borrowHistoryCount: 71
    },
    {
      keyId: "KEY-CIT-AUTO",
      roomCode: "CIT-AUTO",
      label: "Automotive Shop Master Key",
      nfcUid: "04:39:EE:18:02:87",
      qrPayload: "RUPAMS-KEY-CIT-AUTO-SECURE",
      cabinetSlot: "Slot #08",
      status: "overdue", // Flagged overdue!
      currentHolder: {
        userId: "STU-2023-0891",
        name: "Mark Jayson Rivera",
        role: "Student (BSIT Auto 4th Year)",
        contact: "+63 920 882 1245",
        purpose: "Engine Teardown Project Completion",
        facultyEndorser: "Prof. Roberto Santos",
        checkedOutAt: new Date(Date.now() - 190 * 60 * 1000).toISOString(), // 3 hours ago
        dueAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // was due 35 mins ago!
        verificationMode: "NFC_TAP",
        requestId: "REQ-2026-098"
      },
      borrowHistoryCount: 112
    },
    {
      keyId: "KEY-CIT-MECH",
      roomCode: "CIT-MECH",
      label: "Mechanical Workshop Master Key",
      nfcUid: "04:4A:FF:29:13:88",
      qrPayload: "RUPAMS-KEY-CIT-MECH-SECURE",
      cabinetSlot: "Slot #09",
      status: "in_cabinet",
      currentHolder: null,
      borrowHistoryCount: 57
    },
    {
      keyId: "KEY-CIT-FSM",
      roomCode: "CIT-FSM",
      label: "Food & Service Lab Master Key",
      nfcUid: "04:5B:00:3A:24:89",
      qrPayload: "RUPAMS-KEY-CIT-FSM-SECURE",
      cabinetSlot: "Slot #10",
      status: "in_cabinet",
      currentHolder: null,
      borrowHistoryCount: 49
    }
  ],

  // Active timetable entries (Pre-calculated clean baseline)
  schedules: [
    {
      id: "SCH-001",
      courseCode: "COMP 202",
      courseTitle: "Relational Database Management & Integration",
      facultyId: "FAC-004",
      facultyName: "Prof. Liezel Fernando",
      roomCode: "CIT-CL1",
      day: "Monday",
      startTime: "08:00",
      endTime: "11:00",
      section: "BSIT-COMP-2A",
      status: "published"
    },
    {
      id: "SCH-002",
      courseCode: "ELX 315",
      courseTitle: "Microcontroller Systems & Robotics Interfacing",
      facultyId: "FAC-001",
      facultyName: "Engr. Maria Elena Bautista",
      roomCode: "CIT-ELX",
      day: "Monday",
      startTime: "13:00",
      endTime: "16:00",
      section: "BSIT-ELX-3A",
      status: "published"
    },
    {
      id: "SCH-003",
      courseCode: "AUTO 211",
      courseTitle: "Automotive Engine Management & Fuel Systems",
      facultyId: "FAC-002",
      facultyName: "Prof. Roberto Santos",
      roomCode: "CIT-AUTO",
      day: "Tuesday",
      startTime: "08:00",
      endTime: "11:00",
      section: "BSIT-AUTO-2A",
      status: "published"
    },
    {
      id: "SCH-004",
      courseCode: "ELEC 112",
      courseTitle: "Industrial Motor Control & Programmable Logic",
      facultyId: "FAC-003",
      facultyName: "Dr. Arnel Cruz",
      roomCode: "CIT-ELEC",
      day: "Tuesday",
      startTime: "13:00",
      endTime: "16:00",
      section: "BSIT-ELEC-1B",
      status: "published"
    },
    {
      id: "SCH-005",
      courseCode: "DRAFT 101",
      courseTitle: "Parametric 3D CAD & Engineering Drawing",
      facultyId: "FAC-006",
      facultyName: "Prof. Carmela Dela Cruz",
      roomCode: "CIT-CL2",
      day: "Wednesday",
      startTime: "08:00",
      endTime: "11:00",
      section: "BSIT-DRAFT-1A",
      status: "published"
    },
    {
      id: "SCH-006",
      courseCode: "MECH 214",
      courseTitle: "Precision Machining & Metallurgy Laboratory",
      facultyId: "FAC-005",
      facultyName: "Engr. Danilo Reyes",
      roomCode: "CIT-MECH",
      day: "Wednesday",
      startTime: "13:00",
      endTime: "16:00",
      section: "BSIT-MECH-2B",
      status: "published"
    },
    {
      id: "SCH-007",
      courseCode: "FSM 103",
      courseTitle: "Commercial Culinary Operations & Sanitation",
      facultyId: "FAC-007",
      facultyName: "Chef Antonio Morales",
      roomCode: "CIT-FSM",
      day: "Thursday",
      startTime: "08:00",
      endTime: "11:00",
      section: "BSIT-FSM-1A",
      status: "published"
    },
    {
      id: "SCH-008",
      courseCode: "CIT 100",
      courseTitle: "Occupational Safety and Health in Industrial Facilities",
      facultyId: "FAC-008",
      facultyName: "Prof. Ramon Garcia",
      roomCode: "CIT-101",
      day: "Thursday",
      startTime: "13:00",
      endTime: "15:00",
      section: "BSIT-GEN-1A",
      status: "published"
    },
    {
      id: "SCH-009",
      courseCode: "ELX 420",
      courseTitle: "Mechatronics & IoT Automation Capstone",
      facultyId: "FAC-001",
      facultyName: "Engr. Maria Elena Bautista",
      roomCode: "CIT-ELX",
      day: "Friday",
      startTime: "09:00",
      endTime: "12:00",
      section: "BSIT-ELX-4A",
      status: "published"
    },
    {
      id: "SCH-010",
      courseCode: "AUTO 322",
      courseTitle: "Electric & Hybrid Vehicle Powertrains",
      facultyId: "FAC-002",
      facultyName: "Prof. Roberto Santos",
      roomCode: "CIT-AUTO",
      day: "Saturday",
      startTime: "08:00",
      endTime: "11:00",
      section: "BSIT-AUTO-3A",
      status: "published"
    }
  ],

  // Timetable review & approval workflow state
  timetableWorkflow: {
    version: "v2.4-CIT-Final",
    semester: "1st Semester AY 2026-2027",
    status: "published", // draft | pending_review | approved | published
    currentReviewer: "Dr. Virgilio R. Cruz (College Dean)",
    lastUpdated: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    history: [
      {
        step: 1,
        action: "Generated Conflict-Free Draft via Engine",
        by: "Prof. Liezel Fernando (Scheduler Admin)",
        timestamp: "2026-11-04 09:15:00",
        notes: "Automated engine passed 10/10 room capacity and faculty constraint checks."
      },
      {
        step: 2,
        action: "Submitted for Program Heads Review",
        by: "Prof. Liezel Fernando",
        timestamp: "2026-11-04 14:30:00",
        notes: "Dispatched review link to Automotive, Electronics, Electrical, Computer, Mechanical heads."
      },
      {
        step: 3,
        action: "Program Head Approvals Consolidated",
        by: "Engr. Maria Elena Bautista (CIT Department Chair)",
        timestamp: "2026-11-05 11:20:00",
        notes: "Verified lab tool safety spacing and instructor workload allocations."
      },
      {
        step: 4,
        action: "Official Dean Sign-off & Published Live",
        by: "Dr. Virgilio R. Cruz (CIT Dean)",
        timestamp: "2026-11-06 08:00:00",
        notes: "Published to campus real-time displays and mobile access registries."
      }
    ]
  },

  // Borrow requests in flight
  requests: [
    {
      requestId: "REQ-2026-104",
      requesterId: "FAC-004",
      requesterName: "Prof. Liezel Fernando",
      role: "faculty",
      roomCode: "CIT-CL1",
      purpose: "COMP 202 Official Class Schedule",
      date: new Date().toISOString().split('T')[0],
      startTime: "08:00",
      durationHours: 3,
      facultyEndorsement: "Self (Faculty)",
      status: "active", // pending | approved | rejected | active | returned
      keyIssued: "KEY-CIT-CL1",
      submittedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    },
    {
      requestId: "REQ-2026-102",
      requesterId: "STU-2024-0012",
      requesterName: "Juan Dela Cruz",
      role: "student",
      studentId: "2024-0012-MR",
      roomCode: "CIT-ELX",
      purpose: "Senior Capstone Robot Assembly Testing",
      date: new Date().toISOString().split('T')[0],
      startTime: "09:30",
      durationHours: 2,
      facultyEndorsement: "Engr. Maria Elena Bautista",
      status: "active",
      keyIssued: "KEY-CIT-ELX",
      submittedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString()
    },
    {
      requestId: "REQ-2026-098",
      requesterId: "STU-2023-0891",
      requesterName: "Mark Jayson Rivera",
      role: "student",
      studentId: "2023-0891-MR",
      roomCode: "CIT-AUTO",
      purpose: "Engine Teardown Project Completion",
      date: new Date().toISOString().split('T')[0],
      startTime: "07:00",
      durationHours: 2.5,
      facultyEndorsement: "Prof. Roberto Santos",
      status: "overdue",
      keyIssued: "KEY-CIT-AUTO",
      submittedAt: new Date(Date.now() - 210 * 60 * 1000).toISOString()
    },
    {
      requestId: "REQ-2026-109",
      requesterId: "STU-2024-0419",
      requesterName: "Ana Rose Morales",
      role: "student",
      studentId: "2024-0419-MR",
      roomCode: "CIT-CL2",
      purpose: "Multimedia Rendering & Video Editing for CIT TechFest",
      date: new Date().toISOString().split('T')[0],
      startTime: "14:00",
      durationHours: 2,
      facultyEndorsement: "Prof. Liezel Fernando",
      status: "pending",
      keyIssued: null,
      submittedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString()
    },
    {
      requestId: "REQ-2026-110",
      requesterId: "STU-2023-0105",
      requesterName: "Christian Paul Ramos",
      role: "student",
      studentId: "2023-0105-MR",
      roomCode: "CIT-ELEC",
      purpose: "PLC Automation Ladder Logic Troubleshooting",
      date: new Date().toISOString().split('T')[0],
      startTime: "15:30",
      durationHours: 2,
      facultyEndorsement: "Dr. Arnel Cruz",
      status: "pending",
      keyIssued: null,
      submittedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString()
    }
  ],

  // Immutable audit trail for physical key handovers, scans, incidents
  auditLogs: [
    {
      logId: "LOG-2026-8801",
      timestamp: new Date(Date.now() - 190 * 60 * 1000).toISOString(),
      eventType: "KEY_CHECKOUT",
      roomCode: "CIT-AUTO",
      keyId: "KEY-CIT-AUTO",
      actorName: "Mark Jayson Rivera",
      actorId: "STU-2023-0891",
      actorRole: "Student",
      verificationMode: "NFC_TAP",
      nfcUid: "04:39:EE:18:02:87",
      details: "Key released from Cabinet Slot #08. Endorsed by Prof. Roberto Santos. Expected return 09:30 AM."
    },
    {
      logId: "LOG-2026-8802",
      timestamp: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
      eventType: "KEY_CHECKOUT",
      roomCode: "CIT-ELX",
      keyId: "KEY-CIT-ELX",
      actorName: "Juan Dela Cruz",
      actorId: "STU-2024-0012",
      actorRole: "Student",
      verificationMode: "QR_SCAN",
      details: "Mobile Pass QR scanned at Admin Station. Verified endorsement by Engr. Bautista. Due 11:30 AM."
    },
    {
      logId: "LOG-2026-8803",
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      eventType: "KEY_CHECKOUT",
      roomCode: "CIT-CL1",
      keyId: "KEY-CIT-CL1",
      actorName: "Prof. Liezel Fernando",
      actorId: "FAC-004",
      actorRole: "Faculty",
      verificationMode: "NFC_TAP",
      nfcUid: "04:E5:AA:D4:CE:83",
      details: "Official scheduled class session checkout. Slot #04 verified."
    },
    {
      logId: "LOG-2026-8804",
      timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      eventType: "KEY_OVERDUE",
      roomCode: "CIT-AUTO",
      keyId: "KEY-CIT-AUTO",
      actorName: "Mark Jayson Rivera",
      actorId: "STU-2023-0891",
      actorRole: "Student",
      verificationMode: "SYSTEM_AUTO",
      details: "ALERT: Automated background monitor flagged key as OVERDUE (+35 mins). Automated dispatch alert sent to Faculty advisor Prof. Santos."
    },
    {
      logId: "LOG-2026-8799",
      timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      eventType: "KEY_RETURN",
      roomCode: "CIT-MECH",
      keyId: "KEY-CIT-MECH",
      actorName: "Engr. Danilo Reyes",
      actorId: "FAC-005",
      actorRole: "Faculty",
      verificationMode: "NFC_TAP",
      details: "Key safely returned to Cabinet Slot #09. Facility inspection cleared: zero equipment discrepancy."
    },
    {
      logId: "LOG-2026-8798",
      timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      eventType: "KEY_CHECKOUT",
      roomCode: "CIT-MECH",
      keyId: "KEY-CIT-MECH",
      actorName: "Engr. Danilo Reyes",
      actorId: "FAC-005",
      actorRole: "Faculty",
      verificationMode: "NFC_TAP",
      details: "Checked out for Machine Shop practical training session."
    },
    {
      logId: "LOG-2026-8795",
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      eventType: "KEY_RETURN",
      roomCode: "CIT-101",
      keyId: "KEY-CIT-101",
      actorName: "Prof. Ramon Garcia",
      actorId: "FAC-008",
      actorRole: "Faculty",
      verificationMode: "QR_SCAN",
      details: "Key returned after OSH lecture. Cabinet Slot #01 verified."
    }
  ],

  // Preset demo users so evaluator can switch identities with one click
  demoUsers: {
    admin: {
      id: "ADMIN-001",
      name: "Dr. Liezel Fernando",
      role: "admin",
      title: "CIT Central Scheduling & Security Administrator",
      department: "CIT Dean's Office / Scheduling Board",
      avatar: "LF"
    },
    faculty: {
      id: "FAC-001",
      name: "Engr. Maria Elena Bautista",
      role: "faculty",
      title: "Program Head, Electronics Technology",
      department: "Electronics Technology",
      avatar: "MB"
    },
    student: {
      id: "STU-2024-0012",
      name: "Juan Dela Cruz",
      role: "student",
      studentId: "2024-0012-MR",
      section: "BSIT-ELX-3A",
      program: "Bachelor of Science in Industrial Technology (Electronics)",
      avatar: "JD"
    }
  }
};

window.INITIAL_MOCK_DATA = INITIAL_MOCK_DATA;
