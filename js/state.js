/**
 * RUPAMS - Central State Management & Reactive Store
 * Persistent storage with LocalStorage & event bus
 */

const STORAGE_KEY = 'RUPAMS_DATABASE_v3.0';

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
        if (parsed.rooms && parsed.schedules && parsed.reports && (parsed.keyLogs || parsed.transfers)) {
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
   * Includes Program, Year Level, and Section
   */
  exportSpreadsheetCSV() {
    const schedules = this.data.schedules;
    const institution = this.data.institution;

    let csvContent = `\uFEFF${institution.university} - ${institution.campus}\n`;
    csvContent += `${institution.college}\n`;
    csvContent += `OFFICIAL SEMESTRAL TIMETABLE SPREADSHEET (${institution.semester} AY ${institution.academicYear})\n\n`;

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
    link.setAttribute("download", `CIT_Timetable_Spreadsheet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

window.appState = new AppState();
