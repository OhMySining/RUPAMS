/**
 * RUPAMS - Central State Management & Reactive Store
 * Persistent storage with LocalStorage & event bus
 * College of Industrial Technology (CIT) - URS Morong Campus
 */

const STORAGE_KEY = 'RUPAMS_DATABASE_v5.0';

class AppState {
  constructor() {
    this.listeners = {};
    this.viewMode = 'admin'; // 'admin' | 'mobile'
    this.mobileViewFrame = false;
    this.data = this.loadState();
    this.currentUser = this.data.demoUsers.admin;
  }

  loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.rooms && parsed.schedules && parsed.schedules.length >= 300 && parsed.reports && parsed.publication) {
          if (!parsed.keyLogs) parsed.keyLogs = parsed.transfers || [];
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not parse stored state, using defaults:', err);
    }
    const initial = JSON.parse(JSON.stringify(window.INITIAL_MOCK_DATA));
    this.persist(initial);
    return initial;
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
      this.currentUser = this.data.demoUsers[roleKey];
      this.emit('userChanged', this.currentUser);
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
   * Helper: Retrieve all distinct Year & Section cohorts in database
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
   * Helper: Retrieve schedules filtered by cohort key
   */
  getSchedulesByCohortKey(key) {
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

  /**
   * Check if a cohort timetable is officially published
   */
  isCohortPublished(key) {
    if (!this.data.publication) return false;
    if (!this.data.publication.isPublishedGlobally) return false;
    if (key === 'ALL') return this.data.publication.isPublishedGlobally;

    if (this.data.publication.publishedSections && this.data.publication.publishedSections[key] !== undefined) {
      return !!this.data.publication.publishedSections[key];
    }
    return true; // Default to true if globally published
  }

  /**
   * Publish Timetable to Student & Faculty Mobile App
   */
  publishTimetable(cohortKey = 'ALL') {
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

    if (cohortKey === 'ALL') {
      const distinct = this.getDistinctYearSections();
      distinct.forEach(d => {
        this.data.publication.publishedSections[d.key] = true;
      });
    } else {
      this.data.publication.publishedSections[cohortKey] = true;
    }

    this.save();
    this.emit('publicationChanged', this.data.publication);
    return this.data.publication;
  }

  /**
   * Unpublish Timetable from Mobile App
   */
  unpublishTimetable(cohortKey = 'ALL') {
    if (!this.data.publication) return;
    if (cohortKey === 'ALL') {
      this.data.publication.isPublishedGlobally = false;
      this.data.publication.publishedSections = {};
    } else {
      this.data.publication.publishedSections[cohortKey] = false;
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
  exportSpreadsheetCSV(cohortKey = null) {
    const institution = this.data.institution;
    let schedules = this.data.schedules;
    let titleContext = `OFFICIAL SEMESTRAL TIMETABLE SPREADSHEET (${institution.semester} AY ${institution.academicYear})`;
    let filename = `CIT_Timetable_Spreadsheet_${new Date().toISOString().slice(0, 10)}.csv`;

    if (cohortKey && cohortKey !== 'ALL') {
      schedules = this.getSchedulesByCohortKey(cohortKey);
      titleContext = `OFFICIAL TIMETABLE - COHORT: ${cohortKey} (${institution.semester} AY ${institution.academicYear})`;
      filename = `CIT_Timetable_${cohortKey.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
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
