/**
 * RUPAMS - Central State Management & Reactive Store
 * Persistent storage with LocalStorage & event bus
 */

const STORAGE_KEY = 'RUPAMS_DATABASE_v2.0';

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
        if (parsed.rooms && parsed.schedules && parsed.reports && parsed.transfers) {
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

  // Peer-to-Peer key transfer log
  addTransfer(transferRecord) {
    const record = {
      transferId: "TRF-" + Date.now().toString(36).toUpperCase(),
      timestamp: new Date().toISOString(),
      ...transferRecord
    };
    this.data.transfers.unshift(record);

    // Update key custody
    const key = this.getKey(transferRecord.keyId || transferRecord.roomCode);
    if (key) {
      key.currentHolder = transferRecord.toUser;
      key.status = transferRecord.toUser.includes("Cabinet") ? "in_cabinet" : "held";
    }

    // Update room occupancy state
    const room = this.getRoom(transferRecord.roomCode);
    if (room) {
      if (transferRecord.actionType === 'RETURN_TO_CABINET') {
        room.status = 'available';
        room.occupancy = null;
      } else {
        room.status = 'occupied';
        room.occupancy = {
          class: transferRecord.purpose || "Laboratory Activity",
          faculty: transferRecord.toUser,
          section: "Custody Released",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
    }

    this.save();
    this.emit('transferAdded', record);
    return record;
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
   * Converts the manually input schedules into an instant downloadable spreadsheet.
   */
  exportSpreadsheetCSV() {
    const schedules = this.data.schedules;
    const institution = this.data.institution;

    let csvContent = `\uFEFF${institution.university} - ${institution.campus}\n`;
    csvContent += `${institution.college}\n`;
    csvContent += `OFFICIAL SEMESTRAL TIMETABLE SPREADSHEET (${institution.semester} AY ${institution.academicYear})\n\n`;
    
    // Headers
    csvContent += "Schedule ID,Course Code,Descriptive Title,Faculty / Instructor,Day,Start Time,End Time,Assigned Room,Section,Enrolled Count\n";

    schedules.forEach(s => {
      const row = [
        s.id,
        `"${s.courseCode}"`,
        `"${s.courseTitle}"`,
        `"${s.facultyName}"`,
        s.day,
        s.startTime,
        s.endTime,
        s.roomCode,
        `"${s.section}"`,
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
