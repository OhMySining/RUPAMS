/**
 * RUPAMS - Central State Management & Reactive Store
 * Uses LocalStorage for client-side persistence and dispatches events on state changes.
 */

const STORAGE_KEY = 'RUPAMS_DATABASE_v1.0';

class AppState {
  constructor() {
    this.listeners = {};
    this.currentUser = null;
    this.viewMode = 'admin'; // 'admin' | 'mobile'
    this.mobileViewFrame = false; // whether to frame mobile as a smartphone container or responsive
    this.data = this.loadState();
    this.currentUser = this.data.demoUsers.admin;
  }

  loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure all required keys exist
        if (parsed.rooms && parsed.keys && parsed.schedules && parsed.requests) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not parse stored state, using defaults:', err);
    }
    // Default clone
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

  exportData() {
    const jsonStr = JSON.stringify(this.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RUPAMS_Backup_CIT_URS_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.rooms || !parsed.keys || !parsed.schedules) {
        throw new Error('Invalid RUPAMS database schema: Missing essential tables.');
      }
      this.data = parsed;
      this.save();
      this.emit('dataImported', this.data);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
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

  // Switch current user profile
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

  // Helper getters
  getRoom(code) {
    return this.data.rooms.find(r => r.code === code);
  }

  getKey(keyId) {
    return this.data.keys.find(k => k.keyId === keyId || k.roomCode === keyId);
  }

  getFaculty(facId) {
    return this.data.faculty.find(f => f.id === facId);
  }

  // Immutable audit log append
  addAuditLog(entry) {
    const newLog = {
      logId: 'LOG-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 899 + 100),
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.data.auditLogs.unshift(newLog); // prepend to top
    this.save();
    this.emit('auditLogAdded', newLog);
    return newLog;
  }
}

window.appState = new AppState();
