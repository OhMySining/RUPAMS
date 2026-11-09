/**
 * RUPAMS - Central State Management & Reactive Store
 * Persistent storage with LocalStorage & event bus
 * College of Industrial Technology (CIT) - URS Morong Campus
 */

const STORAGE_KEY = 'RUPAMS_DATABASE_v5.0';
const ACTIVE_USER_KEY = 'RUPAMS_ACTIVE_USER';

class AppState {
  constructor() {
    this.listeners = {};
    this.viewMode = 'admin'; // 'admin' | 'mobile'
    this.mobileViewFrame = false;
    this.data = this.loadState();
    this.currentUser = this.loadCurrentUser();
  }

  loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.rooms && parsed.schedules && parsed.schedules.length >= 300 && parsed.reports && parsed.publication) {
          if (!parsed.keyLogs) parsed.keyLogs = parsed.transfers || [];
          if (!parsed.registeredUsers) parsed.registeredUsers = [];
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not parse stored state, using defaults:', err);
    }
    const initial = JSON.parse(JSON.stringify(window.INITIAL_MOCK_DATA));
    if (!initial.registeredUsers) initial.registeredUsers = [];
    this.persist(initial);
    return initial;
  }

  loadCurrentUser() {
    try {
      const storedUser = localStorage.getItem(ACTIVE_USER_KEY);
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (e) {
      console.warn('Could not parse stored active user:', e);
    }
    // Default fallback to Admin demo user if no active user exists yet
    return this.data.demoUsers ? this.data.demoUsers.admin : null;
  }

  setCurrentUser(user) {
    this.currentUser = user;
    if (user) {
      try {
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
      } catch (e) {
        console.error('Failed to store active user:', e);
      }
    } else {
      localStorage.removeItem(ACTIVE_USER_KEY);
    }
    this.emit('userChanged', this.currentUser);
  }

  getCurrentUser() {
    return this.currentUser || this.loadCurrentUser();
  }

  /**
   * User Authentication: Sign In
   */
  login(identifier, password, expectedRole = null) {
    const term = (identifier || '').trim().toLowerCase();
    const demo = this.data.demoUsers || {};
    const registered = this.data.registeredUsers || [];

    // All available accounts
    const allUsers = [
      demo.admin,
      demo.faculty,
      demo.student,
      ...registered
    ].filter(Boolean);

    // Find matching account by ID, username, name, or studentId
    const matched = allUsers.find(u => {
      const idMatch = u.id && u.id.toLowerCase() === term;
      const nameMatch = u.name && u.name.toLowerCase().includes(term);
      const studentIdMatch = u.studentId && u.studentId.toLowerCase() === term;
      const emailMatch = u.email && u.email.toLowerCase() === term;
      const demoRoleMatch = term === u.role || (term === 'admin' && u.role === 'admin') || (term === 'faculty' && u.role === 'faculty') || (term === 'student' && u.role === 'student');
      return idMatch || nameMatch || studentIdMatch || emailMatch || demoRoleMatch;
    });

    if (!matched) {
      return { success: false, message: 'Account not found. Please verify your ID or username, or sign up for a new account.' };
    }

    // Role verification if requested from specific portal
    if (expectedRole) {
      if (expectedRole === 'admin' && matched.role !== 'admin') {
        return { 
          success: false, 
          message: `Access Restricted: "${matched.name}" is registered as a ${matched.role.toUpperCase()}. The Admin Portal (PC) is restricted to administrative staff only. Please sign in via the Mobile Web App.` 
        };
      }
      if ((expectedRole === 'faculty' || expectedRole === 'student') && matched.role === 'admin') {
        return { 
          success: false, 
          message: `Notice: "${matched.name}" is an Administrator. Please use the Admin Portal (PC) to access management controls.` 
        };
      }
    }

    // Check password if set (Demo users accept demo password or any non-empty password)
    if (matched.password && matched.password !== password) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    this.setCurrentUser(matched);
    return { success: true, user: matched };
  }

  /**
   * User Authentication: Sign Up
   */
  signup(data) {
    const role = data.role || 'student';

    // Verify Admin Passcode for admin signups
    if (role === 'admin') {
      const requiredPasscode = 'CIT-ADMIN-2026';
      if ((data.authPasscode || '').trim() !== requiredPasscode && (data.authPasscode || '').trim().toLowerCase() !== 'admin') {
        return { 
          success: false, 
          message: 'Invalid Administrative Authorization Key. (Dean\'s Office security authorization is required to register an Admin account).' 
        };
      }
    }

    if (!data.name || !data.name.trim()) {
      return { success: false, message: 'Full Name is required.' };
    }

    if (!this.data.registeredUsers) {
      this.data.registeredUsers = [];
    }

    const newUser = {
      id: data.id || (role === 'admin' ? `ADM-${Date.now().toString().slice(-4)}` : role === 'faculty' ? `FAC-${Date.now().toString().slice(-4)}` : `STU-${Date.now().toString().slice(-4)}`),
      name: data.name.trim(),
      role: role,
      email: data.email || '',
      password: data.password || 'password123',
      title: data.title || (role === 'admin' ? (data.office || "Dean's Office Staff") : null),
      department: data.department || (role === 'faculty' ? "CIT Faculty" : null),
      program: data.program || (role === 'student' ? "BSIT - Electronics Technology" : null),
      year: data.year || (role === 'student' ? "1st Year" : null),
      section: data.section || (role === 'student' ? "Section A" : null),
      studentId: role === 'student' ? (data.studentId || data.id || `2026-${Date.now().toString().slice(-4)}-MR`) : null,
      course: role === 'student' ? `${data.program || 'BSIT'} (${data.year || '1st Year'} - ${data.section || 'Section A'})` : null,
      qrCodeData: `QR-${role.toUpperCase()}-${Date.now().toString().slice(-6)}`
    };

    this.data.registeredUsers.push(newUser);
    this.save();
    this.setCurrentUser(newUser);

    return { success: true, user: newUser };
  }

  /**
   * User Authentication: Sign Out
   */
  logout() {
    this.setCurrentUser(null);
    window.location.href = 'index.html';
  }

  persist(dataToSave) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave || this.data));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }

  save() {
    this.persist(this.data);
    this.emit('stateChanged', this.data);
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(window.INITIAL_MOCK_DATA));
    if (!this.data.registeredUsers) this.data.registeredUsers = [];
    this.save();
    this.emit('databaseReset', this.data);
  }

  // Pub-sub
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, payload) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`Error in listener for ${event}:`, e);
        }
      });
    }
  }

  setUser(roleKey) {
    if (this.data.demoUsers && this.data.demoUsers[roleKey]) {
      this.setCurrentUser(this.data.demoUsers[roleKey]);
    }
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.emit('viewModeChanged', mode);
  }

  setMobileFrame(framed) {
    this.mobileViewFrame = framed;
    this.emit('mobileFrameChanged', framed);
  }

  getRoom(code) {
    return this.data.rooms.find(r => r.code === code);
  }

  getKey(keyId) {
    return this.data.keys.find(k => k.keyId === keyId || k.roomCode === keyId);
  }

  // Schedule creation and removal
  addSchedule(scheduleItem) {
    this.data.schedules.push(scheduleItem);
    this.save();
    this.emit('scheduleAdded', scheduleItem);
  }

  deleteSchedule(scheduleId) {
    this.data.schedules = this.data.schedules.filter(s => s.id !== scheduleId);
    this.save();
    this.emit('scheduleDeleted', scheduleId);
  }

  /**
   * Helper: Retrieve all distinct Year & Section combinations in database
   * (Replaces previous cohort nomenclature)
   */
  getDistinctYearSections() {
    const schedules = this.data.schedules || [];
    const map = new Map();

    schedules.forEach(s => {
      const prog = s.program || 'BSIT';
      const yr = s.year || '1st Year';
      const sec = s.section || 'Section A';
      const key = `${prog} | ${yr} - ${sec}`;
      if (!map.has(key)) {
        map.set(key, {
          key: key,
          program: prog,
          year: yr,
          section: sec,
          displayName: `${yr} - ${sec} (${prog})`,
          shortName: `${yr} - ${sec}`
        });
      }
    });

    const arr = Array.from(map.values());
    const yearOrder = { "1st Year": 1, "2nd Year": 2, "3rd Year": 3, "4th Year": 4 };
    arr.sort((a, b) => {
      if (a.program !== b.program) return a.program.localeCompare(b.program);
      const ya = yearOrder[a.year] || 99;
      const yb = yearOrder[b.year] || 99;
      if (ya !== yb) return ya - yb;
      return a.section.localeCompare(b.section);
    });
    return arr;
  }

  /**
   * Helper: Retrieve schedules filtered by Year & Section key
   */
  getSchedulesByYearSection(key) {
    if (!key || key === 'ALL') return this.data.schedules || [];
    const parts = key.split(' | ');
    const prog = parts[0];
    const yrSec = parts[1] || '';
    const [yr, sec] = yrSec.split(' - ');

    return (this.data.schedules || []).filter(s => {
      if (prog && s.program !== prog) return false;
      if (yr && s.year !== yr) return false;
      if (sec && s.section !== sec) return false;
      return true;
    });
  }

  // Backward compatibility alias for previous method name
  getSchedulesByCohortKey(key) {
    return this.getSchedulesByYearSection(key);
  }

  /**
   * Check if a Year & Section timetable is officially published
   */
  isYearSectionPublished(key) {
    if (!this.data.publication) return false;
    if (!this.data.publication.isPublishedGlobally) return false;
    if (key === 'ALL') return this.data.publication.isPublishedGlobally;

    if (this.data.publication.publishedSections && this.data.publication.publishedSections[key] !== undefined) {
      return !!this.data.publication.publishedSections[key];
    }
    return true; // Default to true if globally published
  }

  // Backward compatibility alias
  isCohortPublished(key) {
    return this.isYearSectionPublished(key);
  }

  /**
   * Publish Timetable to Student & Faculty Mobile App
   */
  publishTimetable(yearSectionKey = 'ALL') {
    if (!this.data.publication) {
      this.data.publication = {
        isPublishedGlobally: true,
        publishedAt: new Date().toISOString(),
        publishedBy: this.currentUser ? `${this.currentUser.name} (${this.currentUser.role.toUpperCase()})` : "Dean's Office",
        publishedSections: {}
      };
    }
    this.data.publication.isPublishedGlobally = true;
    this.data.publication.publishedAt = new Date().toISOString();
    this.data.publication.publishedBy = this.currentUser ? `${this.currentUser.name} (${this.currentUser.role.toUpperCase()})` : "Dean's Office";

    if (yearSectionKey === 'ALL') {
      const distinct = this.getDistinctYearSections();
      distinct.forEach(d => {
        this.data.publication.publishedSections[d.key] = true;
      });
    } else {
      this.data.publication.publishedSections[yearSectionKey] = true;
    }

    this.save();
    this.emit('publicationChanged', this.data.publication);
    return this.data.publication;
  }

  /**
   * Unpublish Timetable from Mobile App
   */
  unpublishTimetable(yearSectionKey = 'ALL') {
    if (!this.data.publication) return;
    if (yearSectionKey === 'ALL') {
      this.data.publication.isPublishedGlobally = false;
      this.data.publication.publishedSections = {};
    } else {
      this.data.publication.publishedSections[yearSectionKey] = false;
    }
    this.save();
    this.emit('publicationChanged', this.data.publication);
    return this.data.publication;
  }

  /**
   * Log Key Transaction (Borrowed, Returned, Transfered)
   * Can be initiated either from Mobile or at the Dean's Office Web Counter.
   */
  addKeyLog(logEntry) {
    const record = {
      logId: "LOG-" + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString(),
      actionType: logEntry.actionType, // "Borrowed" | "Returned" | "Transfered"
      roomCode: logEntry.roomCode,
      keyId: logEntry.keyId,
      fromUser: logEntry.fromUser || "In Cabinet",
      toUser: logEntry.toUser,
      nfcUidVerified: logEntry.nfcUidVerified,
      qrTokenVerified: logEntry.qrTokenVerified,
      purpose: logEntry.purpose || "Academic / Laboratory Access",
      loggedLocation: logEntry.loggedLocation || "Dean's Office Counter"
    };

    if (!this.data.keyLogs) this.data.keyLogs = [];
    this.data.keyLogs.unshift(record);

    // Update Key and Room custody state
    const key = this.getKey(logEntry.keyId || logEntry.roomCode);
    const room = this.getRoom(logEntry.roomCode);

    if (logEntry.actionType === 'Returned') {
      if (key) {
        key.status = "In Cabinet";
        key.currentHolder = "In Cabinet (Dean's Office)";
      }
      if (room) {
        room.status = "available";
        room.keyStatus = "In Cabinet";
        room.keyHolder = "In Cabinet (Dean's Office)";
        room.occupancy = null;
      }
    } else {
      // Borrowed or Transfered
      if (key) {
        key.status = "Borrowed";
        key.currentHolder = logEntry.toUser;
      }
      if (room) {
        room.status = "occupied";
        room.keyStatus = "Borrowed";
        room.keyHolder = logEntry.toUser;
        room.occupancy = {
          class: logEntry.purpose || "Laboratory Activity",
          faculty: logEntry.toUser,
          section: logEntry.actionType === 'Transfered' ? 'Transferred Key' : 'Official Borrow',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
    }

    this.save();
    this.emit('keyLogAdded', record);
    return record;
  }

  // Backwards compatibility alias
  addTransfer(transferRecord) {
    return this.addKeyLog(transferRecord);
  }

  // Problem report submission
  addProblemReport(reportData) {
    const newReport = {
      reportId: "REP-" + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString(),
      status: "Under Review",
      ...reportData
    };
    this.data.reports.unshift(newReport);
    this.save();
    this.emit('reportAdded', newReport);
    return newReport;
  }

  updateReportStatus(reportId, newStatus) {
    const report = this.data.reports.find(r => r.reportId === reportId);
    if (report) {
      report.status = newStatus;
      this.save();
      this.emit('reportUpdated', report);
    }
  }

  /**
   * Automated Spreadsheet Export (CSV / Excel format)
   * Can export full college spreadsheet or filtered specifically to a selected Year & Section
   */
  exportSpreadsheetCSV(yearSectionKey = null) {
    const institution = this.data.institution;
    let schedules = this.data.schedules;
    let titleContext = `OFFICIAL SEMESTRAL TIMETABLE SPREADSHEET (${institution.semester} AY ${institution.academicYear})`;
    let filename = `CIT_Timetable_Spreadsheet_${new Date().toISOString().slice(0, 10)}.csv`;

    if (yearSectionKey && yearSectionKey !== 'ALL') {
      schedules = this.getSchedulesByYearSection(yearSectionKey);
      titleContext = `OFFICIAL TIMETABLE - YEAR & SECTION: ${yearSectionKey} (${institution.semester} AY ${institution.academicYear})`;
      filename = `CIT_Timetable_${yearSectionKey.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    let csvContent = `\uFEFF${institution.university} - ${institution.campus}\n`;
    csvContent += `${institution.college}\n`;
    csvContent += `${titleContext}\n\n`;

    // Headers with Program, Year, Section
    csvContent += "Schedule ID,Program,Year Level,Section,Course Code,Descriptive Title,Faculty / Instructor,Day,Start Time,End Time,Assigned Room,Enrolled Count\n";

    schedules.forEach(s => {
      const row = [
        s.id,
        `"${s.program || 'BSIT'}"`,
        `"${s.year || 'N/A'}"`,
        `"${s.section || 'Section A'}"`,
        `"${s.courseCode}"`,
        `"${s.courseTitle}"`,
        `"${s.facultyName}"`,
        s.day,
        s.startTime,
        s.endTime,
        s.roomCode,
        s.enrolled || 30
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

window.appState = new AppState();
