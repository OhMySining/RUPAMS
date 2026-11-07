/**
 * RUPAMS - Initial Seed Data (Minimalist Light Palette Edition)
 * University of Rizal System Morong Campus
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
      code: "CIT-101",
      name: "CIT Lecture Hall 101",
      building: "CIT Main Academic Wing",
      capacity: 45,
      type: "Lecture",
      keyId: "KEY-CIT-101",
      status: "available", // available | occupied
      occupancy: null
    },
    {
      code: "CIT-102",
      name: "CIT Lecture Hall 102",
      building: "CIT Main Academic Wing",
      capacity: 40,
      type: "Lecture",
      keyId: "KEY-CIT-102",
      status: "available",
      occupancy: null
    },
    {
      code: "CIT-103",
      name: "CIT Lecture Hall 103",
      building: "CIT Main Academic Wing",
      capacity: 40,
      type: "Lecture",
      keyId: "KEY-CIT-103",
      status: "available",
      occupancy: null
    },
    {
      code: "CIT-CL1",
      name: "Computer & CADD Lab 1",
      building: "CIT Technology Center",
      capacity: 35,
      type: "Computer Lab",
      keyId: "KEY-CIT-CL1",
      status: "occupied",
      occupancy: {
        class: "COMP 202 - Database Systems",
        section: "BSIT-COMP-2A",
        faculty: "Prof. Liezel Fernando",
        time: "08:00 - 11:00"
      }
    },
    {
      code: "CIT-CL2",
      name: "Advanced IT & Multimedia Lab 2",
      building: "CIT Technology Center",
      capacity: 35,
      type: "Computer Lab",
      keyId: "KEY-CIT-CL2",
      status: "available",
      occupancy: null
    },
    {
      code: "CIT-ELX",
      name: "Electronics & Robotics Laboratory",
      building: "CIT Engineering Laboratories",
      capacity: 30,
      type: "Electronics Lab",
      keyId: "KEY-CIT-ELX",
      status: "occupied",
      occupancy: {
        class: "ELX 315 - Robotics Capstone",
        section: "BSIT-ELX-3A",
        faculty: "Engr. Maria Elena Bautista",
        time: "09:30 - 12:30"
      }
    },
    {
      code: "CIT-ELEC",
      name: "Electrical Workshop & Motor Controls",
      building: "CIT Heavy Industries Bldg",
      capacity: 30,
      type: "Electrical Workshop",
      keyId: "KEY-CIT-ELEC",
      status: "available",
      occupancy: null
    },
    {
      code: "CIT-AUTO",
      name: "Automotive Technology Bay",
      building: "CIT Heavy Industries Bldg",
      capacity: 25,
      type: "Automotive Shop",
      keyId: "KEY-CIT-AUTO",
      status: "occupied",
      occupancy: {
        class: "AUTO 211 - Engine Management",
        section: "BSIT-AUTO-2A",
        faculty: "Prof. Roberto Santos",
        time: "07:30 - 10:30"
      }
    },
    {
      code: "CIT-MECH",
      name: "Mechanical Fabrication & Machine Shop",
      building: "CIT Heavy Industries Bldg",
      capacity: 25,
      type: "Mechanical Shop",
      keyId: "KEY-CIT-MECH",
      status: "available",
      occupancy: null
    },
    {
      code: "CIT-FSM",
      name: "Food & Service Management Lab",
      building: "CIT Main Academic Wing",
      capacity: 30,
      type: "Food Tech",
      keyId: "KEY-CIT-FSM",
      status: "available",
      occupancy: null
    }
  ],

  faculty: [
    { id: "FAC-001", name: "Engr. Maria Elena Bautista", department: "Electronics Technology", email: "mebautista@urs.edu.ph" },
    { id: "FAC-002", name: "Prof. Roberto Santos", department: "Automotive Technology", email: "rsantos@urs.edu.ph" },
    { id: "FAC-003", name: "Dr. Arnel Cruz", department: "Electrical Technology", email: "acruz@urs.edu.ph" },
    { id: "FAC-004", name: "Prof. Liezel Fernando", department: "Computer Technology", email: "lfernando@urs.edu.ph" },
    { id: "FAC-005", name: "Engr. Danilo Reyes", department: "Mechanical Technology", email: "dreyes@urs.edu.ph" },
    { id: "FAC-006", name: "Prof. Carmela Dela Cruz", department: "Drafting & Design", email: "cdelacruz@urs.edu.ph" },
    { id: "FAC-007", name: "Chef Antonio Morales", department: "Food & Service Management", email: "amorales@urs.edu.ph" }
  ],

  courses: [
    { code: "AUTO 211", title: "Automotive Engine Management & Fuel Systems", units: 3, roomType: "Automotive Shop" },
    { code: "ELX 315", title: "Microcontroller Systems & Robotics Interfacing", units: 3, roomType: "Electronics Lab" },
    { code: "ELEC 112", title: "Industrial Motor Control & Programmable Logic", units: 3, roomType: "Electrical Workshop" },
    { code: "COMP 202", title: "Relational Database Management & Web Integration", units: 3, roomType: "Computer Lab" },
    { code: "DRAFT 101", title: "Parametric 3D CAD & Engineering Drawing", units: 3, roomType: "Computer Lab" },
    { code: "MECH 214", title: "Precision Machining & Metallurgy Laboratory", units: 3, roomType: "Mechanical Shop" },
    { code: "FSM 103", title: "Commercial Culinary Operations & Sanitation", units: 3, roomType: "Food Tech" },
    { code: "CIT 100", title: "Occupational Safety and Health in Industrial Facilities", units: 2, roomType: "Lecture" }
  ],

  keys: [
    { keyId: "KEY-CIT-101", roomCode: "CIT-101", nfcUid: "04:B2:77:A1:9F:80", currentHolder: "In Cabinet", status: "in_cabinet" },
    { keyId: "KEY-CIT-102", roomCode: "CIT-102", nfcUid: "04:C3:88:B2:AE:81", currentHolder: "In Cabinet", status: "in_cabinet" },
    { keyId: "KEY-CIT-103", roomCode: "CIT-103", nfcUid: "04:D4:99:C3:BD:82", currentHolder: "In Cabinet", status: "in_cabinet" },
    { keyId: "KEY-CIT-CL1", roomCode: "CIT-CL1", nfcUid: "04:E5:AA:D4:CE:83", currentHolder: "Prof. Liezel Fernando (Faculty)", status: "held" },
    { keyId: "KEY-CIT-CL2", roomCode: "CIT-CL2", nfcUid: "04:F6:BB:E5:DF:84", currentHolder: "In Cabinet", status: "in_cabinet" },
    { keyId: "KEY-CIT-ELX", roomCode: "CIT-ELX", nfcUid: "04:17:CC:F6:E0:85", currentHolder: "Juan Dela Cruz (Student)", status: "held" },
    { keyId: "KEY-CIT-ELEC", roomCode: "CIT-ELEC", nfcUid: "04:28:DD:07:F1:86", currentHolder: "In Cabinet", status: "in_cabinet" },
    { keyId: "KEY-CIT-AUTO", roomCode: "CIT-AUTO", nfcUid: "04:39:EE:18:02:87", currentHolder: "Mark Jayson Rivera (Student)", status: "held" },
    { keyId: "KEY-CIT-MECH", roomCode: "CIT-MECH", nfcUid: "04:4A:FF:29:13:88", currentHolder: "In Cabinet", status: "in_cabinet" },
    { keyId: "KEY-CIT-FSM", roomCode: "CIT-FSM", nfcUid: "04:5B:00:3A:24:89", currentHolder: "In Cabinet", status: "in_cabinet" }
  ],

  // Manually entered official schedule records
  schedules: [
    {
      id: "SCH-001",
      courseCode: "COMP 202",
      courseTitle: "Relational Database Management & Web Integration",
      facultyId: "FAC-004",
      facultyName: "Prof. Liezel Fernando",
      roomCode: "CIT-CL1",
      day: "Monday",
      startTime: "08:00",
      endTime: "11:00",
      section: "BSIT-COMP-2A",
      enrolled: 30
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
      enrolled: 28
    },
    {
      id: "SCH-003",
      courseCode: "AUTO 211",
      courseTitle: "Automotive Engine Management & Fuel Systems",
      facultyId: "FAC-002",
      facultyName: "Prof. Roberto Santos",
      roomCode: "CIT-AUTO",
      day: "Tuesday",
      startTime: "07:30",
      endTime: "10:30",
      section: "BSIT-AUTO-2A",
      enrolled: 24
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
      enrolled: 26
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
      enrolled: 30
    },
    {
      id: "SCH-006",
      courseCode: "MECH 214",
      courseTitle: "Precision Machining & Metallurgy Laboratory",
      facultyId: "FAC-005",
      facultyName: "Engr. Danilo Reyes",
      roomCode: "CIT-MECH",
      day: "Thursday",
      startTime: "13:00",
      endTime: "16:00",
      section: "BSIT-MECH-2B",
      enrolled: 22
    },
    {
      id: "SCH-007",
      courseCode: "FSM 103",
      courseTitle: "Commercial Culinary Operations & Sanitation",
      facultyId: "FAC-007",
      facultyName: "Chef Antonio Morales",
      roomCode: "CIT-FSM",
      day: "Friday",
      startTime: "08:00",
      endTime: "11:00",
      section: "BSIT-FSM-1A",
      enrolled: 28
    }
  ],

  // Peer-to-Peer Key Transfer Records
  transfers: [
    {
      transferId: "TRF-2026-001",
      timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      roomCode: "CIT-ELX",
      keyId: "KEY-CIT-ELX",
      fromUser: "Engr. Maria Elena Bautista (Faculty)",
      toUser: "Juan Dela Cruz (Student)",
      nfcUidVerified: "04:17:CC:F6:E0:85",
      qrTokenVerified: "QR-STU-2024-0012-JUAN",
      actionType: "BORROW_TRANSFER",
      purpose: "Robotics Laboratory Circuit Fabrication"
    },
    {
      transferId: "TRF-2026-002",
      timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      roomCode: "CIT-CL1",
      keyId: "KEY-CIT-CL1",
      fromUser: "Key Cabinet (Slot #04)",
      toUser: "Prof. Liezel Fernando (Faculty)",
      nfcUidVerified: "04:E5:AA:D4:CE:83",
      qrTokenVerified: "QR-FAC-004-FERNANDO",
      actionType: "CABINET_CHECKOUT",
      purpose: "COMP 202 Official Class Session"
    }
  ],

  // Facility Problem Reports submitted by students or faculty
  reports: [
    {
      reportId: "REP-2026-101",
      timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      roomCode: "CIT-ELX",
      reporterName: "Juan Dela Cruz",
      reporterRole: "Student",
      reporterId: "2024-0012-MR",
      category: "Equipment Malfunction",
      description: "Digital Oscilloscope Bench #4 power supply is tripping the circuit breaker whenever channel 2 is probed.",
      photoBase64: null, // sample preview will be handled
      status: "Under Review" // Under Review | In Progress | Resolved
    },
    {
      reportId: "REP-2026-098",
      timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      roomCode: "CIT-CL1",
      reporterName: "Prof. Liezel Fernando",
      reporterRole: "Faculty",
      reporterId: "FAC-004",
      category: "Facility Air Conditioning",
      description: "Split-type AC unit near the whiteboard is leaking condensation water onto the front floor.",
      photoBase64: null,
      status: "In Progress"
    }
  ],

  // Standard demo users for testing
  demoUsers: {
    admin: {
      id: "ADM-001",
      name: "Dr. Liezel Fernando",
      role: "admin",
      title: "Program Head / Dean's Office",
      qrCodeData: "QR-ADM-001-LIEZEL"
    },
    faculty: {
      id: "FAC-001",
      name: "Engr. Maria Elena Bautista",
      role: "faculty",
      department: "Electronics Technology",
      qrCodeData: "QR-FAC-001-BAUTISTA"
    },
    student: {
      id: "STU-2024-0012",
      name: "Juan Dela Cruz",
      role: "student",
      studentId: "2024-0012-MR",
      course: "BSIT Electronics Technology (3rd Year)",
      qrCodeData: "QR-STU-2024-0012-JUAN"
    }
  }
};

window.INITIAL_MOCK_DATA = INITIAL_MOCK_DATA;
