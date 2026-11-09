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
    this.initNotifications();
  }

  loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.rooms && parsed.schedules && parsed.schedules.length >= 300 && parsed.reports && parsed.publication) {
          if (!parsed.keyLogs) parsed.keyLogs = parsed.transfers || [];
          if (!parsed.registeredUsers) parsed.registeredUsers = [];
          if (!parsed.notifications) parsed.notifications = [];
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not parse stored state, using defaults:', err);
    }
    const initial = JSON.parse(JSON.stringify(window.INITIAL_MOCK_DATA));
    if (!initial.registeredUsers) initial.registeredUsers = [];
    if (!initial.notifications) initial.notifications = [];
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
      // Mark active overdue key alerts for this room as resolved/read
      if (this.data.notifications) {
        this.data.notifications.forEach(n => {
          if (n.type === 'key_unreturned_alert' && n.roomCode === logEntry.roomCode) {
            n.read = true;
          }
        });
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

    // Automatically generate notification for Admin Portal PC
    const roomIdentifier = newReport.facility || newReport.roomCode || "CIT Facility";
    this.addNotification({
      id: `NOTIF-REP-${newReport.reportId}`,
      dedupKey: `report_${newReport.reportId}`,
      type: 'problem_report',
      targetRole: 'admin',
      recipientName: 'Administrator',
      title: `⚠️ Problem Ticket: ${roomIdentifier}`,
      message: `${newReport.reporterName || 'Mobile User'} (${newReport.reporterRole || 'Student'}) filed ticket: "${newReport.category || newReport.issueType || 'Facility Issue'}" - ${(newReport.description || '').slice(0, 90)}...`,
      roomCode: roomIdentifier,
      relatedReportId: newReport.reportId,
      timestamp: newReport.timestamp,
      urgent: false
    });

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

  // ==========================================================================
  // NOTIFICATION & 7:00 PM CURFEW ALERT SYSTEM
  // ==========================================================================

  initNotifications() {
    if (!this.data.notifications) {
      this.data.notifications = [];
    }

    // Seed default notifications for initial reports if empty
    if (this.data.notifications.length === 0 && this.data.reports && this.data.reports.length > 0) {
      this.data.reports.slice(0, 3).forEach(r => {
        this.data.notifications.push({
          id: `NOTIF-INIT-REP-${r.reportId}`,
          dedupKey: `report_${r.reportId}`,
          type: 'problem_report',
          targetRole: 'admin',
          recipientName: 'Administrator',
          title: `⚠️ Problem Ticket: ${r.roomCode}`,
          message: `${r.reporterName} (${r.reporterRole}) reported: "${r.category}" - ${(r.description || '').slice(0, 80)}...`,
          roomCode: r.roomCode,
          relatedReportId: r.reportId,
          timestamp: r.timestamp || new Date().toISOString(),
          read: false,
          urgent: false
        });
      });
    }

    // Check if 7:00 PM curfew alerts apply
    this.checkCurfewKeyAlerts(false);
  }

  addNotification(notif) {
    if (!this.data.notifications) this.data.notifications = [];

    // Avoid duplicate if dedupKey matches
    if (notif.dedupKey) {
      const exists = this.data.notifications.some(n => n.dedupKey === notif.dedupKey);
      if (exists) return null;
    }

    const record = {
      id: notif.id || `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: notif.timestamp || new Date().toISOString(),
      read: !!notif.read,
      targetRole: notif.targetRole || 'all', // 'admin', 'user', 'all'
      recipientName: notif.recipientName || null,
      recipientId: notif.recipientId || null,
      type: notif.type || 'info', // 'key_unreturned_alert', 'problem_report', 'general'
      title: notif.title || 'Notification',
      message: notif.message || '',
      roomCode: notif.roomCode || null,
      keyId: notif.keyId || null,
      currentHolder: notif.currentHolder || null,
      relatedReportId: notif.relatedReportId || null,
      urgent: !!notif.urgent,
      dedupKey: notif.dedupKey || null
    };

    this.data.notifications.unshift(record);
    this.save();
    this.emit('notificationAdded', record);
    return record;
  }

  getNotificationsForUser(user = null) {
    const activeUser = user || this.getCurrentUser();
    if (!this.data.notifications) this.data.notifications = [];

    if (!activeUser) {
      return this.data.notifications;
    }

    const isAdmin = activeUser.role === 'admin';
    const userName = (activeUser.name || '').trim().toLowerCase();
    const userId = (activeUser.id || '').trim().toLowerCase();

    return this.data.notifications.filter(n => {
      if (isAdmin) {
        return n.targetRole === 'admin' || n.targetRole === 'all';
      } else {
        // Faculty or Student
        if (n.targetRole === 'admin') return false;
        if (n.targetRole === 'all') return true;
        if (n.recipientId && n.recipientId.trim().toLowerCase() === userId) return true;
        if (n.recipientName) {
          const recLower = n.recipientName.trim().toLowerCase();
          if (userName.includes(recLower) || recLower.includes(userName)) return true;
        }
        // If it is a key unreturned alert, check if currentHolder matches activeUser
        if (n.type === 'key_unreturned_alert' && n.currentHolder) {
          const holderLower = n.currentHolder.toLowerCase();
          const firstWord = userName.split(' ')[0];
          if (holderLower.includes(userName) || (firstWord && holderLower.includes(firstWord))) {
            return true;
          }
        }
        return false;
      }
    });
  }

  getUnreadNotificationCount(user = null) {
    const notifs = this.getNotificationsForUser(user);
    return notifs.filter(n => !n.read).length;
  }

  markNotificationAsRead(notifId) {
    if (!this.data.notifications) return;
    const notif = this.data.notifications.find(n => n.id === notifId);
    if (notif) {
      notif.read = true;
      this.save();
      this.emit('notificationsUpdated', this.data.notifications);
    }
  }

  markAllNotificationsAsRead(roleContext = 'admin') {
    const activeUser = this.getCurrentUser();
    const userNotifs = this.getNotificationsForUser(activeUser);
    userNotifs.forEach(n => {
      n.read = true;
    });
    this.save();
    this.emit('notificationsUpdated', this.data.notifications);
  }

  /**
   * 7:00 PM Key Curfew Audit:
   * When it turns 7:00 PM (19:00), or when simulation runs:
   * Any key that is still not returned (status is 'Borrowed')
   * triggers notifications for both the current holder and the Dean's Office Admin.
   */
  checkCurfewKeyAlerts(forceTrigger = false) {
    const now = new Date();
    const currentHour = now.getHours();
    const isPastCurfew = forceTrigger || currentHour >= 19; // 19:00 = 7:00 PM

    if (!isPastCurfew) return [];

    const rooms = this.data.rooms || [];
    const dateStr = now.toISOString().slice(0, 10);
    const generatedAlerts = [];

    rooms.forEach(r => {
      const isBorrowed = r.keyStatus === 'Borrowed' || r.status === 'occupied';
      if (isBorrowed) {
        const holder = r.keyHolder || "Unassigned Custodian";
        const keyId = `KEY-${r.code}`;
        const dedupBase = `curfew_${r.code}_${dateStr}`;

        // 1. Notify current key holder (Student / Faculty)
        const userAlert = this.addNotification({
          id: `NOTIF-USER-${r.code}-${Date.now()}`,
          dedupKey: `${dedupBase}_user`,
          type: 'key_unreturned_alert',
          targetRole: 'user',
          recipientName: holder,
          title: `⚠️ 7:00 PM Curfew Alert: Unreturned Key (${r.code})`,
          message: `Campus safety protocol requires physical keys returned to Dean's Office by 7:00 PM. You are currently logged as custodian for facility ${r.code} (${r.name}). Please surrender the physical key immediately or perform an authorized handover.`,
          roomCode: r.code,
          keyId: keyId,
          currentHolder: holder,
          urgent: true
        });

        // 2. Notify Admin Portal PC
        const adminAlert = this.addNotification({
          id: `NOTIF-ADMIN-${r.code}-${Date.now()}`,
          dedupKey: `${dedupBase}_admin`,
          type: 'key_unreturned_alert',
          targetRole: 'admin',
          recipientName: 'Administrator',
          title: `🚨 Unreturned Key Past 7:00 PM: ${r.code}`,
          message: `Physical key for ${r.code} (${r.name}) has not been returned to the Dean's Office cabinet as of 7:00 PM. Current Custodian: ${holder}.`,
          roomCode: r.code,
          keyId: keyId,
          currentHolder: holder,
          urgent: true
        });

        if (userAlert) generatedAlerts.push(userAlert);
        if (adminAlert) generatedAlerts.push(adminAlert);
      }
    });

    if (generatedAlerts.length > 0 && window.SoundManager && window.SoundManager.playOverdueAlarm) {
      window.SoundManager.playOverdueAlarm();
    }

    return generatedAlerts;
  }

  // Room schedule session status forwarding
  getRoomSessionInfo(roomCode, refDate = null) {
    if (window.SchedulerEngine && window.SchedulerEngine.getRoomSessionInfo) {
      return window.SchedulerEngine.getRoomSessionInfo(roomCode, refDate);
    }
    return {
      status: 'vacant',
      isOngoing: false,
      hasSession: false,
      text: 'No class currently occupying facility.'
    };
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
