/**
 * RUPAMS - Main Application Controller & View Orchestrator
 * University of Rizal System Morong Campus - College of Industrial Technology
 * Minimalist Light Edition
 */

const appUi = {
  activeAdminTab: 'dashboard',
  activeMobileTab: 'rooms',
  
  // Schedule table filters
  schFilterProgram: 'ALL',
  schFilterYear: 'ALL',
  schFilterSection: 'ALL',

  // Key Logs filter
  keyLogFilterAction: 'ALL',

  // Mobile Handover flow state
  currentP2PStep: 1,
  selectedP2PKey: null,
  verifiedNfcUid: null,
  verifiedQrToken: null,
  verifiedToUser: null,
  mobileSelectedAction: 'Borrowed', // "Borrowed" | "Returned" | "Transfered"

  // Admin Portal "Key Counter" Dedicated Tab flow state
  adminCounterStep: 1,
  adminCounterAction: 'Borrowed', // "Borrowed" | "Returned" | "Transfered"
  adminCounterSelectedKey: null,
  adminCounterNfcUid: null,
  adminCounterQrToken: null,
  adminCounterToUser: null,

  uploadedPhotoBase64: null,

  init() {
    this.setupEventListeners();
    this.startLiveClock();
    this.render();

    // Listen to state events
    window.appState.on('stateChanged', () => this.render());
    window.appState.on('userChanged', () => this.render());
    window.appState.on('viewModeChanged', () => this.render());
    window.appState.on('publicationChanged', () => this.render());
    window.appState.on('keyLogAdded', (log) => {
      this.showToast(`[${log.actionType}] Key for ${log.roomCode} logged (${log.loggedLocation}).`, 'success');
    });
    window.appState.on('reportAdded', (r) => {
      this.showToast(`Problem report submitted for ${r.roomCode}.`, 'success');
    });
  },

  setupEventListeners() {
    const btnAdminView = document.getElementById('btnAdminView');
    const btnMobileView = document.getElementById('btnMobileView');

    if (btnAdminView) {
      btnAdminView.addEventListener('click', () => {
        window.QRNfcSimulator.stopCamera();
        window.appState.setViewMode('admin');
      });
    }
    if (btnMobileView) {
      btnMobileView.addEventListener('click', () => {
        window.QRNfcSimulator.stopCamera();
        window.appState.setViewMode('mobile');
      });
    }

    // Global Logout handlers for all sign out triggers
    document.querySelectorAll('.btn-logout-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.appState.logout();
      });
    });

    // Role switcher modal click (desktop header and mobile topbar)
    const userBadge = document.getElementById('userProfileTrigger');
    if (userBadge) {
      userBadge.addEventListener('click', () => this.openUserSwitcherModal());
    }
    const mobileUserBadge = document.getElementById('mobileUserNameTag');
    if (mobileUserBadge) {
      mobileUserBadge.addEventListener('click', () => this.openUserSwitcherModal());
    }

    // Admin Sidebar navigation
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        if (tab) this.switchAdminTab(tab);
      });
    });

    // Mobile Navigation tabs
    document.querySelectorAll('.mobile-tabs-nav .m-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        if (tab) this.switchMobileTab(tab);
      });
    });
  },

  startLiveClock() {
    const update = () => {
      const now = new Date();
      const clockEl = document.getElementById('liveClockTime');
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }) + ' (PST)';
      }
    };
    update();
    setInterval(update, 1000);
  },

  switchAdminTab(tabId) {
    window.QRNfcSimulator.stopCamera();
    this.activeAdminTab = tabId;
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    this.renderAdminView();
  },

  switchMobileTab(tabId) {
    window.QRNfcSimulator.stopCamera();
    this.activeMobileTab = tabId;
    document.querySelectorAll('.mobile-tabs-nav .m-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    this.renderMobileView();
  },

  render() {
    this.updateUserHeader();

    const adminContainer = document.getElementById('adminPortalContainer');
    const mobileContainer = document.getElementById('mobileAppContainer');

    // Standalone Admin Portal (admin.html)
    if (adminContainer && !mobileContainer) {
      if (!this.checkAdminAccess()) return;
      adminContainer.classList.remove('hidden');
      this.renderAdminView();
      return;
    }

    // Standalone Mobile Web App (mobile.html)
    if (mobileContainer && !adminContainer) {
      if (!this.checkMobileAccess()) return;
      mobileContainer.classList.remove('hidden');
      this.renderMobileView();
      return;
    }

    // Dual-container fallback
    const isMobileMode = window.appState.viewMode === 'mobile';
    const btnAdminView = document.getElementById('btnAdminView');
    const btnMobileView = document.getElementById('btnMobileView');

    if (btnAdminView) btnAdminView.classList.toggle('active', !isMobileMode);
    if (btnMobileView) btnMobileView.classList.toggle('active', isMobileMode);

    if (isMobileMode) {
      if (adminContainer) adminContainer.classList.add('hidden');
      if (mobileContainer) mobileContainer.classList.remove('hidden');
      this.renderMobileView();
    } else {
      if (adminContainer) adminContainer.classList.remove('hidden');
      if (mobileContainer) mobileContainer.classList.add('hidden');
      this.renderAdminView();
    }
  },

  checkAdminAccess() {
    const user = window.appState.getCurrentUser();
    const overlay = document.getElementById('accessRestrictionOverlay');
    if (!user || user.role !== 'admin') {
      if (overlay) {
        overlay.classList.remove('hidden');
        const roleSpan = document.getElementById('currentRestrictedRole');
        if (roleSpan) roleSpan.textContent = user ? `${user.name} (${user.role.toUpperCase()})` : 'Not Signed In';
      } else {
        window.location.href = 'index.html';
      }
      return false;
    }
    if (overlay) overlay.classList.add('hidden');
    return true;
  },

  checkMobileAccess() {
    const user = window.appState.getCurrentUser();
    if (!user) {
      window.location.href = 'index.html';
      return false;
    }
    const adminNotice = document.getElementById('mobileAdminNotice');
    if (user.role === 'admin') {
      if (adminNotice) adminNotice.classList.remove('hidden');
    } else {
      if (adminNotice) adminNotice.classList.add('hidden');
    }
    return true;
  },

  updateUserHeader() {
    const user = window.appState.getCurrentUser();
    if (!user) return;
    const nameEl = document.getElementById('headerUserName');
    const roleEl = document.getElementById('headerUserRole');
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role.toUpperCase();

    const mobileNameEl = document.getElementById('mobileUserNameTag');
    if (mobileNameEl) mobileNameEl.textContent = `${user.name} (${user.role.toUpperCase()}) â–¾`;
  },

  /* ==========================================================================
     ADMIN WEB PORTAL (WEB PC)
     ========================================================================== */
  renderAdminView() {
    const content = document.getElementById('adminDynamicContent');
    if (!content) return;

    switch (this.activeAdminTab) {
      case 'dashboard':
        content.innerHTML = this.getAdminDashboardHTML();
        break;
      case 'schedules':
        content.innerHTML = this.getAdminScheduleBuilderHTML();
        this.bindAdminScheduleEvents();
        break;
      case 'spreadsheet':
        content.innerHTML = this.getAdminSpreadsheetHTML();
        this.bindAdminSpreadsheetEvents();
        break;
      case 'keycounter':
        content.innerHTML = this.getAdminKeyCounterHTML();
        this.bindAdminKeyCounterEvents();
        break;
      case 'keylogs':
        content.innerHTML = this.getAdminKeyLogsHTML();
        this.bindKeyLogsEvents();
        break;
      case 'reports':
        content.innerHTML = this.getAdminReportsHTML();
        break;
      default:
        content.innerHTML = this.getAdminDashboardHTML();
    }
  },

  /**
   * 1. Admin: Centralized Real-Time Room Status
   * Explicitly displays Key Status for every room (In Cabinet vs Borrowed)
   */
  getAdminDashboardHTML() {
    const rooms = window.appState.data.rooms;
    const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
    const availableCount = rooms.filter(r => r.status === 'available').length;
    const borrowedKeysCount = rooms.filter(r => r.keyStatus === 'Borrowed').length;

    return `
      <div class="content-title-bar">
        <div>
          <h2>Facility & Key Utilization Dashboard</h2>
          <p>Real-time room availability, active class occupancy, and physical key custody in Dean's Office.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="appUi.switchAdminTab('keycounter')">
          📟 Open Key Counter Station
        </button>
      </div>

      <div style="display: flex; gap: 14px; margin-bottom: 16px; font-size: 0.82rem; color: var(--c-secondary);">
        <span>Available Facilities: <strong>${availableCount}</strong></span>
        <span>•</span>
        <span>Occupied Facilities: <strong>${occupiedCount}</strong></span>
        <span>•</span>
        <span>Keys Borrowed: <strong>${borrowedKeysCount}</strong></span>
        <span>•</span>
        <span>Keys in Cabinet: <strong>${rooms.length - borrowedKeysCount}</strong></span>
      </div>

      <div class="room-status-grid">
        ${rooms.map(r => {
          const isOcc = r.status === 'occupied';
          const isKeyBorrowed = r.keyStatus === 'Borrowed';
          const keyHolder = r.keyHolder || (isKeyBorrowed ? "In Custody" : "In Cabinet (Dean's Office)");

          return `
            <div class="room-status-card">
              <div class="room-card-head">
                <span class="room-card-code">${r.code}</span>
                <span class="badge-status ${r.status}">${r.status}</span>
              </div>
              <div class="room-card-body">
                <div>${r.name}</div>
                <small style="color: var(--c-text-muted);">Cap: ${r.capacity} seats • ${r.type}</small>
              </div>

              <!-- Explicit Key Status Display -->
              <div style="margin-top: 10px; padding: 6px 8px; border-radius: var(--radius-sm); border: 1px solid var(--c-border); background: #ffffff; display: flex; align-items: center; justify-content: space-between; font-size: 0.74rem;">
                <span style="color: var(--c-secondary);">🔑 <strong>Key Status:</strong></span>
                <span class="badge-status ${isKeyBorrowed ? 'occupied' : 'available'}">
                  ${isKeyBorrowed ? 'Borrowed' : 'In Cabinet'}
                </span>
              </div>
              <div style="font-size: 0.7rem; color: var(--c-text-muted); margin-top: 2px;">
                Holder: <strong>${keyHolder}</strong>
              </div>

              <!-- Occupancy Info -->
              <div class="room-occupancy-info ${isOcc ? '' : 'vacant'}">
                ${isOcc && r.occupancy ? `
                  <strong>Class:</strong> ${r.occupancy.class}<br>
                  <strong>Faculty / Occupant:</strong> ${r.occupancy.faculty}<br>
                  <strong>Time:</strong> ${r.occupancy.time}
                ` : `
                  No class currently occupying facility.
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  /**
   * 2. Admin: Manual Schedule Creation with Program, Year, and Section Dropdowns
   * and Filterable "Currently Committed Schedules" table by Year & Section
   */
  getAdminScheduleBuilderHTML() {
    const data = window.appState.data;
    const programs = data.programs || [];
    const yearLevels = data.yearLevels || ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    const sections = data.sections || ["Section A", "Section B", "Section C"];

    // Filter schedules
    const filteredSchedules = data.schedules.filter(s => {
      if (this.schFilterProgram !== 'ALL' && s.program !== this.schFilterProgram) return false;
      if (this.schFilterYear !== 'ALL' && s.year !== this.schFilterYear) return false;
      if (this.schFilterSection !== 'ALL' && s.section !== this.schFilterSection) return false;
      return true;
    });

    return `
      <div class="content-title-bar">
        <div>
          <h2>Manual Schedule Creation & Constraint Enforcement</h2>
          <p>Manual course scheduling with student program, year level, and section breakdowns.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="appUi.switchAdminTab('spreadsheet')">
          View Automated Spreadsheet Output
        </button>
      </div>

      <div class="schedule-builder-panel">
        <!-- Manual Input Form -->
        <div class="panel-card">
          <div class="panel-card-header">Manual Course Schedule Input</div>
          <form id="manualScheduleForm">
            <!-- Student Program Dropdown -->
            <div class="form-group">
              <label class="form-label">Student Program</label>
              <select id="schProgramSelect" class="form-control" required>
                <option value="" selected disabled>Select a program</option>
                ${programs.map(p => `<option value="${p}">${p}</option>`).join('')}
              </select>
            </div>

            <!-- Year Level & Section Dropdowns -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="form-group">
                <label class="form-label">Year Level</label>
                <select id="schYearSelect" class="form-control" required>
                  <option value="" selected disabled>Select a year</option>
                  ${yearLevels.map(y => `<option value="${y}">${y}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Section</label>
                <select id="schSectionSelect" class="form-control" required>
                  <option value="" selected disabled>Select a section</option>
                  ${sections.map(sec => `<option value="${sec}">${sec}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Facility / Room -->
            <div class="form-group">
              <label class="form-label">CIT Facility / Room</label>
              <select id="schRoomSelect" class="form-control" required>
                <option value="" selected disabled>Select a room</option>
                ${data.rooms.map(r => `<option value="${r.code}">${r.code} - ${r.name} (Cap: ${r.capacity})</option>`).join('')}
              </select>
            </div>

            <!-- Subject / Course -->
            <div class="form-group">
              <label class="form-label">Subject / Course</label>
              <select id="schCourseSelect" class="form-control" required>
                <option value="" selected disabled>Select a course</option>
                ${data.courses.map(c => `<option value="${c.code}">${c.code} - ${c.title}</option>`).join('')}
              </select>
            </div>

            <!-- Faculty Instructor -->
            <div class="form-group">
              <label class="form-label">Faculty Workload / Instructor</label>
              <select id="schFacultySelect" class="form-control" required>
                <option value="" selected disabled>Select an instructor</option>
                ${data.faculty.map(f => `<option value="${f.id}">${f.name} (${f.department})</option>`).join('')}
              </select>
            </div>

            <!-- Section Occupancy / Enrollment -->
            <div class="form-group">
              <label class="form-label">Total Section Occupancy / Enrollment</label>
              <input type="number" id="schEnrollmentInput" class="form-control" value="28" min="1" max="60" required>
            </div>

            <!-- Day of Week -->
            <div class="form-group">
              <label class="form-label">Day of Week</label>
              <select id="schDaySelect" class="form-control" required>
                <option value="" selected disabled>Select a day</option>
                ${window.SchedulerEngine.DAYS.map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>

            <!-- Time Slots -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="form-group">
                <label class="form-label">Start Time</label>
                <input type="time" id="schStartTime" class="form-control" required>
              </div>
              <div class="form-group">
                <label class="form-label">End Time</label>
                <input type="time" id="schEndTime" class="form-control" required>
              </div>
            </div>

            <!-- Live Constraint Alert Feedback -->
            <div id="scheduleConstraintAlert"></div>

            <button type="submit" id="btnSaveSchedule" class="btn btn-primary" style="width: 100%; margin-top: 12px;">
              Save to Timetable
            </button>
          </form>
        </div>

        <!-- Currently Committed Schedules Table with Year & Section Filters -->
        <div class="table-wrapper">
          <div style="padding: 12px 16px; border-bottom: 1px solid var(--c-border); display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="font-size: 0.88rem; color: var(--c-primary);">Currently Committed Schedules (${filteredSchedules.length})</strong>
              <small style="color: var(--c-text-muted);">Total: ${data.schedules.length}</small>
            </div>

            <!-- Year and Section Filter Bar -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap; background: var(--c-secondary-light); padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--c-border); font-size: 0.76rem;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <label>Program:</label>
                <select id="filterProgramSelect" class="form-control" style="font-size: 0.72rem; padding: 3px 6px;">
                  <option value="ALL" ${this.schFilterProgram === 'ALL' ? 'selected' : ''}>All Programs</option>
                  ${programs.map(p => `<option value="${p}" ${this.schFilterProgram === p ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
              </div>

              <div style="display: flex; align-items: center; gap: 4px;">
                <label>Year:</label>
                <select id="filterYearSelect" class="form-control" style="font-size: 0.72rem; padding: 3px 6px;">
                  <option value="ALL" ${this.schFilterYear === 'ALL' ? 'selected' : ''}>All Years</option>
                  ${yearLevels.map(y => `<option value="${y}" ${this.schFilterYear === y ? 'selected' : ''}>${y}</option>`).join('')}
                </select>
              </div>

              <div style="display: flex; align-items: center; gap: 4px;">
                <label>Section:</label>
                <select id="filterSectionSelect" class="form-control" style="font-size: 0.72rem; padding: 3px 6px;">
                  <option value="ALL" ${this.schFilterSection === 'ALL' ? 'selected' : ''}>All Sections</option>
                  ${sections.map(s => `<option value="${s}" ${this.schFilterSection === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </div>

              ${(this.schFilterProgram !== 'ALL' || this.schFilterYear !== 'ALL' || this.schFilterSection !== 'ALL') ? `
                <button class="btn btn-outline btn-sm" id="btnResetSchFilter" style="padding: 2px 6px; font-size: 0.7rem;">
                  Clear Filters
                </button>
              ` : ''}
            </div>
          </div>

          <table class="clean-table">
            <thead>
              <tr>
                <th>Day & Time</th>
                <th>Program & Section</th>
                <th>Course</th>
                <th>Instructor</th>
                <th>Room</th>
                <th>Cap</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSchedules.length > 0 ? filteredSchedules.map(s => `
                <tr>
                  <td><strong>${s.day}</strong><br><small style="color: var(--c-text-muted);">${window.ScheduleEngine.formatRange(s.startTime, s.endTime)}</small></td>
                  <td>
                    <strong>${s.year || 'N/A'} - ${s.section || 'A'}</strong>
                    <div style="font-size: 0.7rem; color: var(--c-text-muted);">${s.program || 'BSIT'}</div>
                  </td>
                  <td><strong>${s.courseCode}</strong><br><small style="color: var(--c-text-muted);">${s.courseTitle || ''}</small></td>
                  <td>${s.facultyName}</td>
                  <td><strong>${s.roomCode}</strong></td>
                  <td>${s.enrolled || 30}</td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick="appUi.deleteSchedule('${s.id}')" title="Delete Schedule">
                      ✕
                    </button>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="7" style="text-align: center; color: var(--c-text-muted); padding: 20px;">
                    No schedules found matching selected Year and Section filters.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  bindAdminScheduleEvents() {
    const validateLive = () => {
      const room = document.getElementById('schRoomSelect').value;
      const courseCode = document.getElementById('schCourseSelect').value;
      const faculty = document.getElementById('schFacultySelect').value;
      const day = document.getElementById('schDaySelect').value;
      const start = document.getElementById('schStartTime').value;
      const end = document.getElementById('schEndTime').value;
      const program = document.getElementById('schProgramSelect').value;
      const year = document.getElementById('schYearSelect').value;
      const section = document.getElementById('schSectionSelect').value;
      const enrolled = Number(document.getElementById('schEnrollmentInput').value) || 30;

      const candidate = {
        roomCode: room,
        facultyId: faculty,
        day: day,
        startTime: start,
        endTime: end,
        program: program,
        year: year,
        section: section,
        enrolled: enrolled
      };

      const alertBox = document.getElementById('scheduleConstraintAlert');
      const submitBtn = document.getElementById('btnSaveSchedule');

      if (![room, courseCode, faculty, day, start, end, program, year, section].every(Boolean)) {
        if (alertBox) {
          alertBox.innerHTML = `
            <div class="constraint-alert info">
              Select the course, year & section, room, instructor, day, and times to check for conflicts.
            </div>
          `;
        }
        if (submitBtn) submitBtn.disabled = true;
        return;
      }

      const result = window.SchedulerEngine.validateSchedule(candidate);
      if (!result.isValid) {
        if (alertBox) {
          alertBox.innerHTML = `
            <div class="constraint-alert danger">
              <strong>Schedule Constraints Detected:</strong><br>
              ${result.errors.join('<br>')}
            </div>
          `;
        }
        if (submitBtn) submitBtn.disabled = true;
      } else {
        if (alertBox) {
          alertBox.innerHTML = `
            <div class="constraint-alert success">
              <strong>Constraint Check: Clear</strong><br>
              No room, faculty, or section collisions detected for this Year and Section time slot.
            </div>
          `;
        }
        if (submitBtn) submitBtn.disabled = false;
      }
    };

    ['schProgramSelect', 'schYearSelect', 'schSectionSelect', 'schRoomSelect', 'schCourseSelect', 'schFacultySelect', 'schDaySelect', 'schStartTime', 'schEndTime', 'schEnrollmentInput'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', validateLive);
    });

    // Form submission
    const form = document.getElementById('manualScheduleForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const room = document.getElementById('schRoomSelect').value;
        const courseCode = document.getElementById('schCourseSelect').value;
        const facultyId = document.getElementById('schFacultySelect').value;
        const day = document.getElementById('schDaySelect').value;
        const start = document.getElementById('schStartTime').value;
        const end = document.getElementById('schEndTime').value;
        const program = document.getElementById('schProgramSelect').value;
        const year = document.getElementById('schYearSelect').value;
        const section = document.getElementById('schSectionSelect').value;
        const enrolled = Number(document.getElementById('schEnrollmentInput').value) || 30;

        const course = window.appState.data.courses.find(c => c.code === courseCode);
        const faculty = window.appState.data.faculty.find(f => f.id === facultyId);

        const res = window.SchedulerEngine.addManualSchedule({
          courseCode: courseCode,
          courseTitle: course ? course.title : courseCode,
          facultyId: facultyId,
          facultyName: faculty ? faculty.name : "Assigned Faculty",
          roomCode: room,
          day: day,
          startTime: start,
          endTime: end,
          program: program,
          year: year,
          section: section,
          enrolled: enrolled
        });

        if (res.success) {
          this.showToast(`Schedule added for ${courseCode} (${program} - ${year} ${section}).`, 'success');
          this.renderAdminView();
        } else {
          this.showToast(`Error: ${res.errors[0]}`, 'error');
        }
      });
    }

    // Filter Listeners
    const filterProg = document.getElementById('filterProgramSelect');
    if (filterProg) {
      filterProg.addEventListener('change', (e) => {
        this.schFilterProgram = e.target.value;
        this.renderAdminView();
      });
    }

    const filterYear = document.getElementById('filterYearSelect');
    if (filterYear) {
      filterYear.addEventListener('change', (e) => {
        this.schFilterYear = e.target.value;
        this.renderAdminView();
      });
    }

    const filterSec = document.getElementById('filterSectionSelect');
    if (filterSec) {
      filterSec.addEventListener('change', (e) => {
        this.schFilterSection = e.target.value;
        this.renderAdminView();
      });
    }

    const btnReset = document.getElementById('btnResetSchFilter');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.schFilterProgram = 'ALL';
        this.schFilterYear = 'ALL';
        this.schFilterSection = 'ALL';
        this.renderAdminView();
      });
    }

    validateLive();
  },

  deleteSchedule(scheduleId) {
    if (confirm("Remove this course schedule record?")) {
      window.appState.deleteSchedule(scheduleId);
      this.showToast("Schedule removed.", "info");
      this.renderAdminView();
    }
  },

  /**
   * 3. Admin: Automated Spreadsheet Output
   * Displays distinct Year & Section selector, weekly schedule matrix, and mobile publishing
   */
  getAdminSpreadsheetHTML() {
    const data = window.appState.data;
    const inst = data.institution;
    const distinctSections = window.appState.getDistinctYearSections();

    if (!this.spreadsheetSelectedSectionKey && distinctSections.length > 0) {
      this.spreadsheetSelectedSectionKey = distinctSections[0].key;
    }

    const selectedKey = this.spreadsheetSelectedSectionKey || (distinctSections[0] ? distinctSections[0].key : 'ALL');
    const isAll = selectedKey === 'ALL';
    const schedules = window.appState.getSchedulesByYearSection(selectedKey);
    const isPublished = window.appState.isYearSectionPublished(selectedKey);

    const totalUnits = schedules.reduce((sum, s) => {
      const course = data.courses.find(c => c.code === s.courseCode);
      return sum + (course ? course.units : 3);
    }, 0);

    const matrixDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const timeSlots = [
      { label: "07:30 AM - 10:30 AM", start: "07:30", end: "10:30", desc: "Morning Block" },
      { label: "10:30 AM - 01:30 PM", start: "10:30", end: "13:30", desc: "Mid-Day Block" },
      { label: "01:30 PM - 04:30 PM", start: "13:30", end: "16:30", desc: "Afternoon Block" },
      { label: "04:30 PM - 07:30 PM", start: "16:30", end: "19:30", desc: "Evening Extension" }
    ];

    const findCourseInSlot = (day, slot) => {
      return schedules.find(s => {
        if (s.day !== day) return false;
        return window.SchedulerEngine.isOverlapping(slot.start, slot.end, s.startTime, s.endTime);
      });
    };

    return `
      <div class="content-title-bar">
        <div>
          <h2>Automated Spreadsheet Output Module</h2>
          <p>Official Semestral Academic Timetables with distinct Year and Sections, weekly schedule matrix, and direct publishing to student & faculty mobile apps.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-primary btn-sm" onclick="window.appState.exportSpreadsheetCSV('${selectedKey}')">
            Download CSV / Excel
          </button>
          <button class="btn btn-outline btn-sm" onclick="window.print()">
            Print Timetable Matrix
          </button>
        </div>
      </div>

      <div class="spreadsheet-container">
        <div class="spreadsheet-header-block">
          <h3>${inst.university} - ${inst.campus}</h3>
          <p><strong>${inst.college}</strong></p>
          <p>Official Semestral Timetable Spreadsheet (${inst.semester} AY ${inst.academicYear})</p>
        </div>

        <!-- Distinct Year & Section Dropdown & Publication Toolbar -->
        <div class="spreadsheet-toolbar">
          <div class="spreadsheet-selector-group">
            <label for="spreadsheetSectionSelect">Select Year & Section:</label>
            <select id="spreadsheetSectionSelect" class="form-control" style="font-weight: 600; font-size: 0.82rem; min-width: 320px;">
              ${distinctSections.map(c => `
                <option value="${c.key}" ${selectedKey === c.key ? 'selected' : ''}>
                  ${c.displayName} [${window.appState.getSchedulesByYearSection(c.key).length} Courses]
                </option>
              `).join('')}
              <option value="ALL" ${selectedKey === 'ALL' ? 'selected' : ''}>
                ALL Year & Sections / Full Master Timetable (${data.schedules.length} Courses)
              </option>
            </select>
          </div>

          <div class="spreadsheet-pub-controls">
            <span class="pub-status-badge ${isPublished ? 'published' : 'draft'}">
              ${isPublished ? '● Officially Published to Mobile' : '○ Draft Mode (Not Published)'}
            </span>
            <button id="btnTogglePublishSection" class="btn ${isPublished ? 'btn-outline' : 'btn-primary'} btn-sm">
              ${isPublished ? 'Unpublish from Mobile' : '📢 Publish Timetable to Mobile App'}
            </button>
            <button id="btnPublishAllSections" class="btn btn-outline btn-sm" title="Publish all distinct year & sections to mobile">
              Publish All Year and Sections
            </button>
          </div>
        </div>

        <!-- Year & Section Summary Stats -->
        ${!isAll ? `
          <div class="year-section-info-card">
            <div class="year-section-stat-item">
              <span class="year-section-stat-label">Program & Major</span>
              <span class="year-section-stat-val" style="font-size: 0.82rem;">${schedules[0] ? schedules[0].program : 'CIT Program'}</span>
            </div>
            <div class="year-section-stat-item">
              <span class="year-section-stat-label">Year & Section</span>
              <span class="year-section-stat-val">${schedules[0] ? `${schedules[0].year} - ${schedules[0].section}` : 'N/A'}</span>
            </div>
            <div class="year-section-stat-item">
              <span class="year-section-stat-label">Scheduled Courses</span>
              <span class="year-section-stat-val">${schedules.length} Subjects</span>
            </div>
            <div class="year-section-stat-item">
              <span class="year-section-stat-label">Total Units</span>
              <span class="year-section-stat-val">${totalUnits} Units</span>
            </div>
            <div class="year-section-stat-item">
              <span class="year-section-stat-label">Section Size</span>
              <span class="year-section-stat-val">${schedules[0] ? schedules[0].enrolled : 28} Students</span>
            </div>
            <div class="year-section-stat-item">
              <span class="year-section-stat-label">Constraint Status</span>
              <span class="year-section-stat-val" style="color: var(--c-green); font-size: 0.8rem;">✓ 0 Collisions</span>
            </div>
          </div>

          <!-- Visual Weekly Timetable Matrix -->
          <div style="margin-bottom: 8px;">
            <strong style="font-size: 0.86rem; color: var(--c-primary);">Weekly Timetable Matrix (${selectedKey.split(' | ')[1] || selectedKey})</strong>
            <small style="color: var(--c-text-muted); display: block; font-size: 0.72rem; margin-top: 2px;">
              Visual timetable distribution across weekly days and laboratory/lecture blocks.
            </small>
          </div>

          <div class="matrix-wrapper">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th style="width: 110px;">Time Slot</th>
                  ${matrixDays.map(d => `<th>${d}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${timeSlots.map(slot => `
                  <tr>
                    <td class="matrix-time-col">
                      <strong>${slot.label}</strong><br>
                      <small style="color: var(--c-text-muted); font-size: 0.65rem;">${slot.desc}</small>
                    </td>
                    ${matrixDays.map(day => {
                      const match = findCourseInSlot(day, slot);
                      if (match) {
                        return `
                          <td>
                            <div class="matrix-course-cell">
                              <div>
                                <strong>${match.courseCode}</strong>
                                <small>${match.courseTitle || ''}</small>
                              </div>
                              <div style="margin-top: 4px;">
                                <span class="matrix-course-tag">📍 ${match.roomCode}</span>
                                <div style="font-size: 0.68rem; color: var(--c-secondary); margin-top: 2px;">
                                  👨‍🏫 ${match.facultyName}
                                </div>
                                <div style="font-size: 0.65rem; color: var(--c-text-muted);">
                                  ⏰ ${window.ScheduleEngine.formatRange(match.startTime, match.endTime)}
                                </div>
                              </div>
                            </div>
                          </td>
                        `;
                      } else {
                        return `<td><span style="color: #cbd5e1; font-size: 0.75rem;">—</span></td>`;
                      }
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Detailed Institutional Schedule Ledger -->
        <div style="margin-bottom: 8px;">
          <strong style="font-size: 0.86rem; color: var(--c-primary);">Official Course Offerings & Room Assignments Ledger</strong>
          <small style="color: var(--c-text-muted); display: block; font-size: 0.72rem; margin-top: 2px;">
            Full descriptive titles, assigned faculty instructors, and physical classroom keys.
          </small>
        </div>

        <div class="table-wrapper" style="box-shadow: none; border-radius: 0;">
          <table class="clean-table" style="font-size: 0.8rem;">
            <thead>
              <tr style="background: var(--c-primary); color: #ffffff;">
                <th style="color: #fff; background: var(--c-primary);">Day & Time</th>
                <th style="color: #fff; background: var(--c-primary);">Program</th>
                <th style="color: #fff; background: var(--c-primary);">Year & Section</th>
                <th style="color: #fff; background: var(--c-primary);">Course Code</th>
                <th style="color: #fff; background: var(--c-primary);">Descriptive Title</th>
                <th style="color: #fff; background: var(--c-primary);">Room</th>
                <th style="color: #fff; background: var(--c-primary);">Units</th>
                <th style="color: #fff; background: var(--c-primary);">Faculty / Instructor</th>
                <th style="color: #fff; background: var(--c-primary);">Enrolled</th>
              </tr>
            </thead>
            <tbody>
              ${schedules.map((s, idx) => {
                const courseInfo = data.courses.find(c => c.code === s.courseCode);
                const units = courseInfo ? courseInfo.units : 3;

                return `
                  <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                    <td>
                      <strong>${s.day}</strong><br>
                      <small style="color: var(--c-text-muted);">${window.ScheduleEngine.formatRange(s.startTime, s.endTime)}</small>
                    </td>
                    <td>${s.program || 'BSIT'}</td>
                    <td><strong>${s.year || ''} - ${s.section || ''}</strong></td>
                    <td><strong>${s.courseCode}</strong></td>
                    <td>${s.courseTitle || '—'}</td>
                    <td><strong>${s.roomCode}</strong></td>
                    <td>${units}</td>
                    <td>${s.facultyName}</td>
                    <td>${s.enrolled || 30}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  bindAdminSpreadsheetEvents() {
    const sectionSelect = document.getElementById('spreadsheetSectionSelect');
    if (sectionSelect) {
      sectionSelect.addEventListener('change', (e) => {
        this.spreadsheetSelectedSectionKey = e.target.value;
        this.renderAdminView();
      });
    }

    const btnTogglePublish = document.getElementById('btnTogglePublishSection');
    if (btnTogglePublish) {
      btnTogglePublish.addEventListener('click', () => {
        const key = this.spreadsheetSelectedSectionKey;
        const isPub = window.appState.isYearSectionPublished(key);
        if (isPub) {
          window.appState.unpublishTimetable(key);
          this.showToast(`Timetable for "${key}" unpublished from Mobile App.`, 'info');
        } else {
          window.appState.publishTimetable(key);
          this.showToast(`Timetable for "${key}" published to Student & Faculty Mobile App!`, 'success');
        }
        this.renderAdminView();
      });
    }

    const btnPublishAll = document.getElementById('btnPublishAllSections');
    if (btnPublishAll) {
      btnPublishAll.addEventListener('click', () => {
        window.appState.publishTimetable('ALL');
        this.showToast('All Year & Section timetables published to Mobile App!', 'success');
        this.renderAdminView();
      });
    }
  },


  /**
   * 4. Admin Dedicated Tab: "Key Counter"
   * Dedicated terminal station in the Dean's Office for Borrowing, Returning, and Transferring keys.
   * Same 3-step process as the mobile app (Step 1 NFC Scanner -> Step 2 QR Scanner -> Step 3 Authorize).
   */
  getAdminKeyCounterHTML() {
    const keys = window.appState.data.keys;

    return `
      <div class="content-title-bar">
        <div>
          <h2>Dean's Office Key Counter Station</h2>
          <p>Official terminal station in Dean's office for authorized key borrowing, returns to cabinet, or custody transfers.</p>
        </div>
        <button class="btn btn-outline btn-sm" onclick="appUi.switchAdminTab('keylogs')">
          View Key Logs Ledger
        </button>
      </div>

      <div class="key-counter-panel">
        <!-- Interactive Terminal Card -->
        <div class="key-counter-card">
          <!-- Step Indicator -->
          <div class="step-indicator-box">
            <span class="step-badge ${this.adminCounterStep >= 1 ? (this.adminCounterStep > 1 ? 'done' : 'active') : ''}">
              1. Key NFC ${this.adminCounterStep > 1 ? '✓' : ''}
            </span>
            <span class="step-badge ${this.adminCounterStep >= 2 ? (this.adminCounterStep > 2 ? 'done' : 'active') : ''}">
              2. Personal QR ${this.adminCounterStep > 2 ? '✓' : ''}
            </span>
            <span class="step-badge ${this.adminCounterStep === 3 ? 'active' : ''}">
              3. Authorize
            </span>
          </div>

          ${this.renderAdminKeyCounterBody()}
        </div>

        <!-- Cabinet Status Overview -->
        <div class="panel-card">
          <div class="panel-card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span>Dean's Office Key Cabinet (Live Sensors)</span>
            <span style="font-size: 0.72rem; color: var(--c-text-muted);">Click key to select for counter</span>
          </div>

          <div class="cabinet-status-grid">
            ${keys.map(k => {
              const inCab = k.status === 'In Cabinet';
              return `
                <div class="cabinet-slot-card ${inCab ? 'in-cabinet' : 'borrowed'}" 
                     style="cursor: pointer;" 
                     onclick="appUi.selectKeyForAdminCounter('${k.keyId}')"
                     title="Click to load into Key Counter">
                  <strong style="color: var(--c-primary);">${k.roomCode}</strong>
                  <div style="font-size: 0.7rem; color: var(--c-text-muted);">${k.keyId}</div>
                  <div style="margin-top: 4px;">
                    <span class="badge-status ${inCab ? 'available' : 'occupied'}" style="font-size: 0.65rem;">
                      ${k.status}
                    </span>
                  </div>
                  <div style="font-size: 0.68rem; color: var(--c-secondary); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${k.currentHolder}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  selectKeyForAdminCounter(keyId) {
    this.adminCounterSelectedKey = keyId;
    this.adminCounterStep = 1;
    this.renderAdminView();
    const sel = document.getElementById('adminKeySelect');
    if (sel) sel.value = keyId;
  },

  renderAdminKeyCounterBody() {
    const keys = window.appState.data.keys;

    if (this.adminCounterStep === 1) {
      return `
        <div class="p2p-verification-screen">
          <div class="form-group" style="text-align: left; margin-bottom: 14px;">
            <label class="form-label">Dean's Office Transaction Type:</label>
            <select id="adminActionTypeSelect" class="form-control">
              <option value="Borrowed" ${this.adminCounterAction === 'Borrowed' ? 'selected' : ''}>Borrowed (Release key from cabinet to student/faculty)</option>
              <option value="Returned" ${this.adminCounterAction === 'Returned' ? 'selected' : ''}>Returned (Surrender key back to Dean's Office cabinet)</option>
              <option value="Transfered" ${this.adminCounterAction === 'Transfered' ? 'selected' : ''}>Transfered (Custody transfer logged at Dean's office)</option>
            </select>
          </div>

          <!-- Step 1: NFC Scanner Visual Box -->
          <div class="nfc-scanner-box">
            <div class="nfc-wave-container">
              <div class="nfc-wave-circle"></div>
              <div class="nfc-wave-circle"></div>
              <div class="nfc-wave-circle"></div>
              <div class="nfc-core-icon">📡</div>
            </div>
            <strong style="font-size: 0.9rem; color: var(--c-primary); display: block;">Step 1: Physical Key NFC Card Scanner</strong>
            <p style="font-size: 0.75rem; color: var(--c-text-muted); margin: 6px 0 14px 0;">
              Hold physical RFID/NFC key tag over USB NFC reader or select from cabinet below.
            </p>

            <div class="form-group" style="text-align: left;">
              <label class="form-label">Key Tag Detected / Selected:</label>
              <select id="adminKeySelect" class="form-control" style="font-size: 0.82rem;">
                ${keys.map(k => `
                  <option value="${k.keyId}" ${this.adminCounterSelectedKey === k.keyId ? 'selected' : ''}>
                    ${k.roomCode} Key (${k.keyId}) - NFC UID: ${k.nfcUid} [${k.status}]
                  </option>
                `).join('')}
              </select>
            </div>

            <button class="btn btn-primary" id="btnAdminConfirmNfc" style="width: 100%;">
              Tap & Verify Physical Key NFC Tag
            </button>
          </div>
        </div>
      `;
    } else if (this.adminCounterStep === 2) {
      return `
        <div class="p2p-verification-screen">
          <strong style="font-size: 0.9rem; color: var(--c-primary); display: block; margin-bottom: 4px;">
            Step 2: Personnel Personal QR Scanner
          </strong>
          <p style="font-size: 0.74rem; color: var(--c-text-muted); margin-bottom: 12px;">
            Key <strong>${this.adminCounterSelectedKey}</strong> verified via NFC. Now scan the student/faculty's personal QR code.
          </p>

          <!-- Camera Viewfinder -->
          <div class="camera-scanner-viewport">
            <video id="adminCameraVideo" autoplay playsinline muted></video>
            <div class="camera-guide-box">
              <div class="camera-laser-bar"></div>
            </div>
          </div>
          <div id="adminCameraVideo_status" style="font-size: 0.72rem; color: var(--c-text-muted); margin-bottom: 12px;">
            Active camera viewfinder: Align personnel QR badge in target box
          </div>

          <!-- Quick Simulation Personnel Selector -->
          <div style="font-size: 0.76rem; text-align: left; background: var(--c-secondary-light); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--c-border); margin-bottom: 12px;">
            <label class="form-label">Or Select Personnel to Simulate Scan:</label>
            <select id="adminUserSelect" class="form-control" style="font-size: 0.8rem;">
              <option value="Juan Dela Cruz (Student)|QR-STU-2024-0012-JUAN">Juan Dela Cruz (Student ID: 2024-0012-MR)</option>
              <option value="Engr. Maria Elena Bautista (Faculty)|QR-FAC-001-BAUTISTA">Engr. Maria Elena Bautista (Faculty FAC-001)</option>
              <option value="Prof. Roberto Santos (Faculty)|QR-FAC-002-SANTOS">Prof. Roberto Santos (Faculty FAC-002)</option>
              <option value="Prof. Liezel Fernando (Faculty)|QR-FAC-004-FERNANDO">Prof. Liezel Fernando (Faculty FAC-004)</option>
              <option value="In Cabinet (Dean's Office)|QR-CABINET-DEAN">In Cabinet (Dean's Office)</option>
            </select>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline" id="btnAdminBackToNfc" style="flex: 1;">Back</button>
            <button class="btn btn-primary" id="btnAdminConfirmQr" style="flex: 2;">Verify Personal QR</button>
          </div>
        </div>
      `;
    } else {
      // Step 3
      return `
        <div class="p2p-verification-screen" style="text-align: left;">
          <strong style="font-size: 0.9rem; color: var(--c-primary); display: block; margin-bottom: 8px;">
            Step 3: Authorize Dean's Office Key Transaction
          </strong>

          <div style="background: var(--c-secondary-light); border: 1px solid var(--c-border); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 14px; font-size: 0.8rem;">
            <div>Transaction Type: <strong>${this.adminCounterAction}</strong></div>
            <div>Key ID: <strong>${this.adminCounterSelectedKey}</strong></div>
            <div>Verified NFC Tag: <code>${this.adminCounterNfcUid}</code></div>
            <div>Authorized Person: <strong>${this.adminCounterToUser}</strong></div>
            <div>Verified QR Token: <code>${this.adminCounterQrToken}</code></div>
            <div>Logging Terminal: <strong>Dean's Office Counter (Web Portal)</strong></div>
          </div>

          <div class="form-group">
            <label class="form-label">Purpose / Class / Operational Session:</label>
            <input type="text" id="adminCounterPurpose" class="form-control" value="Official CIT Academic Session" placeholder="e.g. Lab Make-up Class, Thesis Assembly">
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline" id="btnAdminCancelCounter" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" id="btnAdminExecuteCounter" style="flex: 2;">
              Complete & Log ${this.adminCounterAction}
            </button>
          </div>
        </div>
      `;
    }
  },

  bindAdminKeyCounterEvents() {
    const actionSelect = document.getElementById('adminActionTypeSelect');
    if (actionSelect) {
      actionSelect.addEventListener('change', (e) => {
        this.adminCounterAction = e.target.value;
      });
    }

    const btnConfirmNfc = document.getElementById('btnAdminConfirmNfc');
    if (btnConfirmNfc) {
      btnConfirmNfc.addEventListener('click', () => {
        const keyId = document.getElementById('adminKeySelect').value;
        const key = window.appState.getKey(keyId);
        this.adminCounterSelectedKey = keyId;
        this.adminCounterNfcUid = key ? key.nfcUid : "04:B2:77:A1:9F:80";
        if (actionSelect) this.adminCounterAction = actionSelect.value;

        if (window.SoundManager) window.SoundManager.playNfcTap();
        this.adminCounterStep = 2;
        this.renderAdminView();
      });
    }

    // When step 2 loads, start camera
    if (this.adminCounterStep === 2) {
      setTimeout(() => {
        window.QRNfcSimulator.startCamera('adminCameraVideo', (code) => {
          this.adminCounterToUser = "Personnel (" + code.slice(0, 10) + ")";
          this.adminCounterQrToken = code;
          this.adminCounterStep = 3;
          this.renderAdminView();
        });
      }, 50);
    }

    const btnBack = document.getElementById('btnAdminBackToNfc');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        window.QRNfcSimulator.stopCamera();
        this.adminCounterStep = 1;
        this.renderAdminView();
      });
    }

    const btnConfirmQr = document.getElementById('btnAdminConfirmQr');
    if (btnConfirmQr) {
      btnConfirmQr.addEventListener('click', () => {
        window.QRNfcSimulator.stopCamera();
        const val = document.getElementById('adminUserSelect').value;
        const [userName, token] = val.split('|');
        this.adminCounterToUser = userName;
        this.adminCounterQrToken = token;

        if (window.SoundManager) window.SoundManager.playQrScan();
        this.adminCounterStep = 3;
        this.renderAdminView();
      });
    }

    const btnCancel = document.getElementById('btnAdminCancelCounter');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        this.adminCounterStep = 1;
        this.renderAdminView();
      });
    }

    const btnExec = document.getElementById('btnAdminExecuteCounter');
    if (btnExec) {
      btnExec.addEventListener('click', () => {
        const purpose = document.getElementById('adminCounterPurpose').value;
        const key = window.appState.getKey(this.adminCounterSelectedKey);

        const res = window.KeyManager.processKeyTransaction({
          keyId: this.adminCounterSelectedKey,
          roomCode: key ? key.roomCode : "CIT-101",
          nfcUid: this.adminCounterNfcUid,
          qrToken: this.adminCounterQrToken,
          fromUser: this.adminCounterAction === 'Borrowed' ? "In Cabinet (Dean's Office)" : (this.adminCounterAction === 'Returned' ? this.adminCounterToUser : "Dean's Office Counter"),
          toUser: this.adminCounterAction === 'Returned' ? "In Cabinet (Dean's Office)" : this.adminCounterToUser,
          actionType: this.adminCounterAction, // "Borrowed" | "Returned" | "Transfered"
          purpose: purpose,
          loggedLocation: "Dean's Office Counter"
        });

        if (res.success) {
          this.adminCounterStep = 1;
          this.showToast(`[${this.adminCounterAction}] Logged successfully at Dean's Office Counter.`, 'success');
          this.renderAdminView();
        }
      });
    }
  },

  /**
   * 5. Admin: Key Logs (Renamed from P2P Key Transfers)
   * Action Types strictly: "Borrowed", "Returned", "Transfered"
   */
  getAdminKeyLogsHTML() {
    const rawLogs = window.appState.data.keyLogs || window.appState.data.transfers || [];
    
    const filteredLogs = rawLogs.filter(l => {
      if (this.keyLogFilterAction !== 'ALL' && l.actionType !== this.keyLogFilterAction) return false;
      return true;
    });

    return `
      <div class="content-title-bar">
        <div>
          <h2>Key Logs</h2>
          <p>Official ledger of all key borrowings, returns, and transfers logged in the Dean's Office or via mobile.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="appUi.switchAdminTab('keycounter')">
          📟 Open Key Counter Station
        </button>
      </div>

      <!-- Action Type Filter -->
      <div style="display: flex; gap: 8px; margin-bottom: 14px; font-size: 0.78rem;">
        <button class="btn ${this.keyLogFilterAction === 'ALL' ? 'btn-primary' : 'btn-outline'} btn-sm" data-filter="ALL">All Key Logs</button>
        <button class="btn ${this.keyLogFilterAction === 'Borrowed' ? 'btn-primary' : 'btn-outline'} btn-sm" data-filter="Borrowed">Borrowed</button>
        <button class="btn ${this.keyLogFilterAction === 'Returned' ? 'btn-primary' : 'btn-outline'} btn-sm" data-filter="Returned">Returned</button>
        <button class="btn ${this.keyLogFilterAction === 'Transfered' ? 'btn-primary' : 'btn-outline'} btn-sm" data-filter="Transfered">Transfered</button>
      </div>

      <div class="table-wrapper">
        <table class="clean-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Room & Key ID</th>
              <th>From Custody</th>
              <th>To Personnel</th>
              <th>Logging Location</th>
              <th>Verified NFC Tag</th>
              <th>Verified Personal QR</th>
              <th>Purpose / Notes</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLogs.length > 0 ? filteredLogs.map(t => {
              const actionClass = t.actionType === 'Returned' ? 'available' : t.actionType === 'Borrowed' ? 'occupied' : 'pending';
              return `
                <tr>
                  <td style="white-space: nowrap; font-family: monospace; font-size: 0.76rem;">
                    ${new Date(t.timestamp).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}
                  </td>
                  <td>
                    <span class="badge-status ${actionClass}">
                      ${t.actionType}
                    </span>
                  </td>
                  <td><strong>${t.roomCode}</strong><br><small style="color: var(--c-text-muted);">${t.keyId}</small></td>
                  <td>${t.fromUser}</td>
                  <td><strong>${t.toUser}</strong></td>
                  <td>
                    <span style="font-size: 0.72rem; color: var(--c-secondary); background: var(--c-secondary-light); padding: 2px 6px; border-radius: 3px;">
                      ${t.loggedLocation || "Dean's Office Counter"}
                    </span>
                  </td>
                  <td><code style="font-size: 0.72rem;">${t.nfcUidVerified}</code></td>
                  <td><code style="font-size: 0.72rem;">${t.qrTokenVerified}</code></td>
                  <td>${t.purpose}</td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="9" style="text-align: center; color: var(--c-text-muted); padding: 20px;">
                  No key logs found for the selected filter.
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    `;
  },

  bindKeyLogsEvents() {
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.keyLogFilterAction = e.currentTarget.getAttribute('data-filter');
        this.renderAdminView();
      });
    });
  },

  /**
   * 6. Admin: Facility Problem Reports Desk
   */
  getAdminReportsHTML() {
    const reports = window.appState.data.reports || [];

    return `
      <div class="content-title-bar">
        <div>
          <h2>Facility Problem Reports Desk</h2>
          <p>Reports submitted by students and faculty encountering laboratory issues, with photo evidence.</p>
        </div>
        <div style="font-size: 0.82rem; color: var(--c-secondary);">
          Total Reports: <strong>${reports.length}</strong>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="clean-table">
          <thead>
            <tr>
              <th>Report ID & Time</th>
              <th>Facility</th>
              <th>Category</th>
              <th>Description</th>
              <th>Reporter</th>
              <th>Attached Photo</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${reports.map(r => `
              <tr>
                <td>
                  <strong>${r.reportId}</strong><br>
                  <small style="color: var(--c-text-muted);">${new Date(r.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</small>
                </td>
                <td><strong>${r.roomCode}</strong></td>
                <td><span style="font-weight: 600; color: var(--c-primary);">${r.category}</span></td>
                <td style="max-width: 280px; font-size: 0.78rem;">${r.description}</td>
                <td>
                  <strong>${r.reporterName}</strong><br>
                  <small style="color: var(--c-text-muted);">${r.reporterRole} (${r.reporterId})</small>
                </td>
                <td>
                  ${r.photoBase64 ? `
                    <img src="${r.photoBase64}" class="report-photo-thumb" onclick="appUi.viewFullPhoto('${r.photoBase64}')" title="Click to view full photo" alt="Problem photo">
                  ` : `
                    <span style="color: var(--c-text-muted); font-size: 0.75rem;">No Photo Attached</span>
                  `}
                </td>
                <td>
                  <span class="badge-status ${r.status === 'Resolved' ? 'available' : r.status === 'In Progress' ? 'pending' : 'occupied'}">
                    ${r.status}
                  </span>
                </td>
                <td>
                  <select class="form-control" style="font-size: 0.72rem; padding: 4px;" onchange="window.appState.updateReportStatus('${r.reportId}', this.value)">
                    <option value="Under Review" ${r.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                    <option value="In Progress" ${r.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Resolved" ${r.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  viewFullPhoto(base64Src) {
    const modal = document.getElementById('genericDetailModal');
    if (!modal) return;
    document.getElementById('genericModalTitle').textContent = "Uploaded Problem Photo Evidence";
    document.getElementById('genericModalBody').innerHTML = `
      <div style="text-align: center;">
        <img src="${base64Src}" style="max-width: 100%; max-height: 400px; border-radius: 4px; border: 1px solid var(--c-border);" alt="Uploaded report evidence">
      </div>
    `;
    modal.classList.add('active');
  },

  /* ==========================================================================
     MOBILE WEB APP (STUDENTS & FACULTY)
     ========================================================================== */
  renderMobileView() {
    const mobileBody = document.getElementById('mobileDynamicBody');
    if (!mobileBody) return;

    const user = window.appState.getCurrentUser() || (window.appState.data.demoUsers ? window.appState.data.demoUsers.student : null);
    const nameEl = document.getElementById('mobileUserNameTag');
    if (nameEl) nameEl.textContent = `${user.name} (${user.role.toUpperCase()}) ▾`;

    switch (this.activeMobileTab) {
      case 'rooms':
        mobileBody.innerHTML = this.getMobileRoomsHTML();
        break;
      case 'schedule':
        mobileBody.innerHTML = this.getMobileScheduleHTML();
        this.bindMobileScheduleEvents();
        break;
      case 'transfer':
        mobileBody.innerHTML = this.getMobileTransferHTML();
        this.bindMobileTransferEvents();
        break;
      case 'report':
        mobileBody.innerHTML = this.getMobileReportHTML();
        this.bindMobileReportEvents();
        break;
      default:
        mobileBody.innerHTML = this.getMobileRoomsHTML();
    }
  },

  /**
   * Mobile Feature 2: Published Class Schedule Timetable
   * Filtered by student's/faculty's Year & Section with quick selector and day filtering
   */
  getMobileScheduleHTML() {
    const user = window.appState.getCurrentUser() || (window.appState.data.demoUsers ? window.appState.data.demoUsers.student : null);
    const data = window.appState.data;
    const distinctSections = window.appState.getDistinctYearSections();

    // Default Year & Section based on active user
    let sectionKey = this.mobileSelectedSectionKey;
    if (!sectionKey) {
      if (user.role === 'student' && user.program && user.year && user.section) {
        sectionKey = `${user.program} | ${user.year} - ${user.section}`;
      } else {
        sectionKey = distinctSections[0] ? distinctSections[0].key : 'ALL';
      }
      this.mobileSelectedSectionKey = sectionKey;
    }

    const isFaculty = user.role === 'faculty';
    const isTeachingLoadMode = isFaculty && this.mobileFacultyViewMode === 'myload';

    let schedulesToShow = [];
    if (isTeachingLoadMode) {
      schedulesToShow = (data.schedules || []).filter(s => {
        return s.facultyId === user.id || (user.name && s.facultyName && s.facultyName.includes(user.name.split(' ').pop()));
      });
    } else {
      schedulesToShow = window.appState.getSchedulesByYearSection(sectionKey);
    }

    // Filter by day if selected
    const activeDay = this.mobileScheduleDayFilter || 'ALL';
    const filteredCourses = activeDay === 'ALL'
      ? schedulesToShow
      : schedulesToShow.filter(s => s.day === activeDay);

    const isPublished = isTeachingLoadMode ? true : window.appState.isYearSectionPublished(sectionKey);
    const days = ["ALL", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return `
      <div class="mobile-schedule-wrap">
        <div>
          <strong style="font-size: 0.95rem; color: var(--c-primary);">CIT Official Class Schedule</strong>
          <p style="font-size: 0.74rem; color: var(--c-text-muted);">
            Official semester timetables published for student and faculty access.
          </p>
        </div>

        ${isFaculty ? `
          <div style="display: flex; gap: 6px; background: var(--c-secondary-light); padding: 4px; border-radius: var(--radius-sm); border: 1px solid var(--c-border);">
            <button class="btn btn-sm ${isTeachingLoadMode ? 'btn-primary' : 'btn-outline'}" id="btnMobileFacultyMyLoad" style="flex: 1; font-size: 0.72rem; padding: 4px;">
              My Teaching Load (${(data.schedules || []).filter(s => s.facultyId === user.id).length})
            </button>
            <button class="btn btn-sm ${!isTeachingLoadMode ? 'btn-primary' : 'btn-outline'}" id="btnMobileFacultySection" style="flex: 1; font-size: 0.72rem; padding: 4px;">
              Year and Section Timetable
            </button>
          </div>
        ` : ''}

        ${!isTeachingLoadMode ? `
          <div class="mobile-section-selector-box">
            <label for="mobileSectionSelect">Select Year & Section:</label>
            <select id="mobileSectionSelect" class="form-control" style="font-size: 0.78rem; font-weight: 600;">
              ${distinctSections.map(c => `
                <option value="${c.key}" ${sectionKey === c.key ? 'selected' : ''}>
                  ${c.displayName}
                </option>
              `).join('')}
            </select>
            <div class="mobile-section-meta">
              <span>Courses: <strong>${schedulesToShow.length} Subjects</strong></span>
              <span>Enrollment: <strong>${schedulesToShow[0] ? schedulesToShow[0].enrolled : 28} Students</strong></span>
            </div>
          </div>
        ` : `
          <div style="background: var(--c-surface); border: 1px solid var(--c-border); border-left: 3px solid var(--c-primary); border-radius: var(--radius-sm); padding: 10px 12px; font-size: 0.75rem;">
            <strong style="color: var(--c-primary);">${user.name}</strong> (${user.department})<br>
            <span style="color: var(--c-text-muted);">Total Assigned Teaching Load: <strong>${schedulesToShow.length} Classes / Laboratories</strong></span>
          </div>
        `}

        <!-- Publication Status Banner -->
        <div class="mobile-pub-banner ${isPublished ? 'published' : 'draft'}">
          <span style="font-size: 1rem;">${isPublished ? '✓' : '⚠️'}</span>
          <div>
            <strong>${isPublished ? "Officially Published by CIT Dean's Office" : 'Draft Timetable (Unpublished)'}</strong><br>
            <span>${isPublished ? 'Live semestral schedule synchronized with facility keys and room counters.' : 'Administrative review pending. Courses shown are preview only.'}</span>
          </div>
        </div>

        <!-- Day Filter Bar -->
        <div class="day-filter-bar">
          ${days.map(d => `
            <button class="day-filter-btn ${activeDay === d ? 'active' : ''}" data-day="${d}">
              ${d === 'ALL' ? 'All Days' : d.slice(0, 3)}
            </button>
          `).join('')}
        </div>

        <!-- Courses List -->
        <div class="mobile-course-list">
          ${filteredCourses.length > 0 ? filteredCourses.map(s => {
            const courseInfo = data.courses.find(c => c.code === s.courseCode);
            const units = courseInfo ? courseInfo.units : 3;
            const roomInfo = data.rooms.find(r => r.code === s.roomCode);

            return `
              <div class="mobile-course-card">
                <div class="mobile-course-top">
                  <span class="mobile-day-tag">📅 ${s.day}</span>
                  <span class="mobile-time-pill">⏰ ${window.ScheduleEngine.formatRange(s.startTime, s.endTime)}</span>
                </div>
                <div class="mobile-course-code">${s.courseCode}</div>
                <div class="mobile-course-title">${s.courseTitle || 'Laboratory Course'}</div>
                <div class="mobile-course-details">
                  <span>📍 <strong>Facility:</strong> ${s.roomCode} - ${roomInfo ? roomInfo.name : 'Lab'}</span>
                  <span>👨‍🏫 <strong>Instructor:</strong> ${s.facultyName}</span>
                  <span>👥 <strong>Year and Section:</strong> ${s.year} - ${s.section} (${s.program})</span>
                  <span>📊 <strong>Academic Units:</strong> ${units} Units • Cap: ${s.enrolled || 28} Students</span>
                </div>
              </div>
            `;
          }).join('') : `
            <div style="text-align: center; padding: 24px 12px; color: var(--c-text-muted); font-size: 0.78rem; background: var(--c-surface); border: 1px dashed var(--c-border); border-radius: var(--radius-sm);">
              No scheduled classes on ${activeDay} for this selection.
            </div>
          `}
        </div>
      </div>
    `;
  },

  bindMobileScheduleEvents() {
    const sectionSelect = document.getElementById('mobileSectionSelect');
    if (sectionSelect) {
      sectionSelect.addEventListener('change', (e) => {
        this.mobileSelectedSectionKey = e.target.value;
        this.renderMobileView();
      });
    }

    document.querySelectorAll('.day-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.mobileScheduleDayFilter = e.currentTarget.getAttribute('data-day');
        this.renderMobileView();
      });
    });

    const btnMyLoad = document.getElementById('btnMobileFacultyMyLoad');
    if (btnMyLoad) {
      btnMyLoad.addEventListener('click', () => {
        this.mobileFacultyViewMode = 'myload';
        this.renderMobileView();
      });
    }

    const btnSection = document.getElementById('btnMobileFacultySection');
    if (btnSection) {
      btnSection.addEventListener('click', () => {
        this.mobileFacultyViewMode = 'section';
        this.renderMobileView();
      });
    }
  },


  /**
   * Mobile Feature 1: Minimalist Room Availability Dashboard
   * Explicitly displays Key Status for every room!
   */
  getMobileRoomsHTML() {
    const rooms = window.appState.data.rooms;

    return `
      <div style="margin-bottom: 12px;">
        <strong style="font-size: 0.92rem; color: var(--c-primary);">CIT Facilities Status</strong>
        <p style="font-size: 0.75rem; color: var(--c-text-muted);">Current facility availability & ongoing classes.</p>
      </div>

      <div class="room-minimal-list">
        ${rooms.map(room => {
          const isOcc = room.status === 'occupied';
          const isKeyBorrowed = room.keyStatus === 'Borrowed';
          const keyHolder = room.keyHolder || (isKeyBorrowed ? "In Custody" : "In Cabinet (Dean's Office)");

          return `
            <div class="room-minimal-item ${isOcc ? 'occupied' : 'available'}">
              <div class="room-min-header">
                <span class="room-min-code">${room.code} - ${room.name}</span>
                <span class="badge-status ${room.status}">${room.status}</span>
              </div>

              <!-- Explicit Key Status Row in Mobile -->
              <div class="room-key-status-row">
                <span>🔑 <strong>Key Status:</strong></span>
                <span class="badge-status ${isKeyBorrowed ? 'occupied' : 'available'}">
                  ${isKeyBorrowed ? 'Borrowed' : 'In Cabinet'}
                </span>
              </div>
              <div style="font-size: 0.7rem; color: var(--c-text-muted); margin-bottom: 4px;">
                Key Holder: <strong>${keyHolder}</strong>
              </div>

              <div class="room-min-occupant">
                ${isOcc && room.occupancy ? `
                  <strong>Class:</strong> ${room.occupancy.class} (${room.occupancy.faculty || 'In session'})
                ` : `
                  Facility is available.
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  /**
   * Mobile Feature 2: Peer-to-Peer Key Transfer (Borrow, Return, Transfer)
   * Step 1: Shows NFC Scanner UI
   * Step 2: Shows Camera / QR Scanner UI
   */
  getMobileTransferHTML() {
    const user = window.appState.getCurrentUser() || (window.appState.data.demoUsers ? window.appState.data.demoUsers.student : null);
    const personalQrSvg = window.QRNfcSimulator.generatePersonalQRSVG(user.qrCodeData || user.id, 130);

    return `
      <div style="margin-bottom: 12px;">
        <strong style="font-size: 0.92rem; color: var(--c-primary);">Key Handover (Borrow, Return, Transfer)</strong>
        <p style="font-size: 0.74rem; color: var(--c-text-muted);">
          Authorized key logging requires both the <strong>Physical Key NFC Card</strong> and <strong>Personal QR Code</strong>.
        </p>
      </div>

      <div class="p2p-card">
        <div class="step-indicator-box">
          <span class="step-badge ${this.currentP2PStep >= 1 ? (this.currentP2PStep > 1 ? 'done' : 'active') : ''}">
            1. Key NFC ${this.currentP2PStep > 1 ? '✓' : ''}
          </span>
          <span class="step-badge ${this.currentP2PStep >= 2 ? (this.currentP2PStep > 2 ? 'done' : 'active') : ''}">
            2. Personal QR ${this.currentP2PStep > 2 ? '✓' : ''}
          </span>
          <span class="step-badge ${this.currentP2PStep === 3 ? 'active' : ''}">
            3. Authorize
          </span>
        </div>

        ${this.renderP2PStepBody()}
      </div>

      <!-- Option to show personal QR for peer scanning -->
      <div style="background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-sm); padding: 14px; text-align: center;">
        <strong style="font-size: 0.8rem; color: var(--c-primary);">My Personal Identity QR</strong>
        <p style="font-size: 0.72rem; color: var(--c-text-muted); margin-bottom: 10px;">
          Present this QR code when receiving a key transfer or borrowing in Dean's office.
        </p>
        <div style="display: flex; justify-content: center; margin-bottom: 6px;">
          ${personalQrSvg}
        </div>
        <div style="font-size: 0.74rem; color: var(--c-secondary);">
          <strong>${user.name}</strong> (${user.role.toUpperCase()})
        </div>
      </div>
    `;
  },

  renderP2PStepBody() {
    const keys = window.appState.data.keys;

    if (this.currentP2PStep === 1) {
      return `
        <div class="p2p-verification-screen">
          <div class="form-group" style="text-align: left; margin-bottom: 10px;">
            <label class="form-label">Action to Perform:</label>
            <select id="mobileActionTypeSelect" class="form-control" style="font-size: 0.8rem;">
              <option value="Borrowed" ${this.mobileSelectedAction === 'Borrowed' ? 'selected' : ''}>Borrowed (Borrow physical key)</option>
              <option value="Returned" ${this.mobileSelectedAction === 'Returned' ? 'selected' : ''}>Returned (Surrender key to cabinet)</option>
              <option value="Transfered" ${this.mobileSelectedAction === 'Transfered' ? 'selected' : ''}>Transfered (P2P Handover to peer)</option>
            </select>
          </div>

          <!-- Step 1: NFC Scanner Visual Box -->
          <div class="nfc-scanner-box">
            <div class="nfc-wave-container">
              <div class="nfc-wave-circle"></div>
              <div class="nfc-wave-circle"></div>
              <div class="nfc-wave-circle"></div>
              <div class="nfc-core-icon">📡</div>
            </div>
            <strong style="font-size: 0.88rem; color: var(--c-primary); display: block;">Step 1: Physical Key NFC Scanner</strong>
            <p style="font-size: 0.72rem; color: var(--c-text-muted); margin: 4px 0 12px 0;">
              Hold device against physical RFID/NFC key tag or select below.
            </p>

            <div class="form-group" style="text-align: left;">
              <label class="form-label">Select Key Tag Detected:</label>
              <select id="p2pKeySelect" class="form-control" style="font-size: 0.8rem;">
                ${keys.map(k => `
                  <option value="${k.keyId}" ${this.selectedP2PKey === k.keyId ? 'selected' : ''}>
                    ${k.roomCode} Key (${k.keyId}) - NFC: ${k.nfcUid} [${k.status}]
                  </option>
                `).join('')}
              </select>
            </div>
            <button class="btn btn-primary" id="btnConfirmNfcStep" style="width: 100%;">
              Tap & Verify Key NFC Card
            </button>
          </div>
        </div>
      `;
    } else if (this.currentP2PStep === 2) {
      return `
        <div class="p2p-verification-screen">
          <strong style="font-size: 0.88rem; color: var(--c-primary); display: block; margin-bottom: 4px;">
            Step 2: Camera Personal QR Scanner
          </strong>
          <p style="font-size: 0.72rem; color: var(--c-text-muted); margin-bottom: 10px;">
            Key <strong>${this.selectedP2PKey}</strong> verified. Now scan recipient / borrower QR code.
          </p>

          <!-- Live Camera Viewport -->
          <div class="camera-scanner-viewport">
            <video id="mobileCameraVideo" autoplay playsinline muted></video>
            <div class="camera-guide-box">
              <div class="camera-laser-bar"></div>
            </div>
          </div>
          <div id="mobileCameraVideo_status" style="font-size: 0.7rem; color: var(--c-text-muted); margin-bottom: 10px;">
            Camera active: Point at personnel QR badge
          </div>

          <div style="font-size: 0.74rem; text-align: left; background: var(--c-surface); padding: 8px; border-radius: 4px; border: 1px solid var(--c-border); margin-bottom: 10px;">
            <label class="form-label">Or Select Personnel to Simulate Scan:</label>
            <select id="p2pRecipientSelect" class="form-control" style="font-size: 0.78rem;">
              <option value="Juan Dela Cruz (Student)|QR-STU-2024-0012-JUAN">Juan Dela Cruz (Student ID: 2024-0012-MR)</option>
              <option value="Engr. Maria Elena Bautista (Faculty)|QR-FAC-001-BAUTISTA">Engr. Maria Elena Bautista (Faculty FAC-001)</option>
              <option value="Prof. Roberto Santos (Faculty)|QR-FAC-002-SANTOS">Prof. Roberto Santos (Faculty FAC-002)</option>
              <option value="In Cabinet (Dean's Office)|QR-CABINET-SLOT-01">In Cabinet (Dean's Office)</option>
            </select>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline" id="btnBackToNfcStep" style="flex: 1;">Back</button>
            <button class="btn btn-primary" id="btnConfirmQrStep" style="flex: 2;">Verify Scanned QR</button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="p2p-verification-screen" style="text-align: left;">
          <div style="background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 12px; font-size: 0.8rem;">
            <strong style="color: var(--c-primary); display: block; margin-bottom: 6px;">Authorization Summary:</strong>
            <div>Action Type: <strong>${this.mobileSelectedAction}</strong></div>
            <div>Key: <strong>${this.selectedP2PKey}</strong></div>
            <div>NFC Tag: <code>${this.verifiedNfcUid}</code></div>
            <div>Authorized Person: <strong>${this.verifiedToUser}</strong></div>
            <div>Location: <strong>Mobile App</strong></div>
          </div>

          <div class="form-group">
            <label class="form-label">Purpose:</label>
            <input type="text" id="p2pPurposeInput" class="form-control" value="Academic Class Session" placeholder="e.g. Lab Make-up / Thesis Assembly">
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline" id="btnCancelP2P" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" id="btnExecuteTransfer" style="flex: 2;">
              Complete ${this.mobileSelectedAction}
            </button>
          </div>
        </div>
      `;
    }
  },

  bindMobileTransferEvents() {
    const actionSelect = document.getElementById('mobileActionTypeSelect');
    if (actionSelect) {
      actionSelect.addEventListener('change', (e) => {
        this.mobileSelectedAction = e.target.value;
      });
    }

    const btnConfirmNfc = document.getElementById('btnConfirmNfcStep');
    if (btnConfirmNfc) {
      btnConfirmNfc.addEventListener('click', () => {
        const keyId = document.getElementById('p2pKeySelect').value;
        const key = window.appState.getKey(keyId);
        this.selectedP2PKey = keyId;
        this.verifiedNfcUid = key ? key.nfcUid : "04:17:CC:F6:E0:85";
        if (actionSelect) this.mobileSelectedAction = actionSelect.value;

        if (window.SoundManager) window.SoundManager.playNfcTap();
        this.currentP2PStep = 2;
        this.renderMobileView();
      });
    }

    // If step 2, start camera scanner
    if (this.currentP2PStep === 2) {
      setTimeout(() => {
        window.QRNfcSimulator.startCamera('mobileCameraVideo', (code) => {
          this.verifiedToUser = "Scanned Personnel (" + code.slice(0, 8) + ")";
          this.verifiedQrToken = code;
          this.currentP2PStep = 3;
          this.renderMobileView();
        });
      }, 50);
    }

    const btnBack = document.getElementById('btnBackToNfcStep');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        window.QRNfcSimulator.stopCamera();
        this.currentP2PStep = 1;
        this.renderMobileView();
      });
    }

    const btnConfirmQr = document.getElementById('btnConfirmQrStep');
    if (btnConfirmQr) {
      btnConfirmQr.addEventListener('click', () => {
        window.QRNfcSimulator.stopCamera();
        const val = document.getElementById('p2pRecipientSelect').value;
        const [userName, token] = val.split('|');
        this.verifiedToUser = userName;
        this.verifiedQrToken = token;

        if (window.SoundManager) window.SoundManager.playQrScan();
        this.currentP2PStep = 3;
        this.renderMobileView();
      });
    }

    const btnCancel = document.getElementById('btnCancelP2P');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        window.QRNfcSimulator.stopCamera();
        this.currentP2PStep = 1;
        this.renderMobileView();
      });
    }

    const btnExec = document.getElementById('btnExecuteTransfer');
    if (btnExec) {
      btnExec.addEventListener('click', () => {
        const purpose = document.getElementById('p2pPurposeInput').value;
        const key = window.appState.getKey(this.selectedP2PKey);

        const res = window.KeyManager.processKeyTransaction({
          keyId: this.selectedP2PKey,
          roomCode: key ? key.roomCode : "CIT-ELX",
          nfcUid: this.verifiedNfcUid,
          qrToken: this.verifiedQrToken,
          fromUser: window.appState.currentUser.name + ` (${window.appState.currentUser.role})`,
          toUser: this.verifiedToUser,
          actionType: this.mobileSelectedAction, // "Borrowed" | "Returned" | "Transfered"
          purpose: purpose,
          loggedLocation: "Mobile App"
        });

        if (res.success) {
          this.currentP2PStep = 1;
          this.showToast(`[${this.mobileSelectedAction}] Logged successfully!`, 'success');
          this.switchMobileTab('rooms');
        }
      });
    }
  },

  /**
   * Mobile Feature 3: Report Facility Problem with Photo Upload
   */
  getMobileReportHTML() {
    const rooms = window.appState.data.rooms;

    return `
      <div style="margin-bottom: 12px;">
        <strong style="font-size: 0.92rem; color: var(--c-primary);">Submit Facility Problem Report</strong>
        <p style="font-size: 0.74rem; color: var(--c-text-muted);">
          Report equipment or facility issues directly to CIT Dean's office.
        </p>
      </div>

      <div style="background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-sm); padding: 14px;">
        <form id="mobileReportForm">
          <div class="form-group">
            <label class="form-label">Select Laboratory / Academic Room</label>
            <select id="repRoomSelect" class="form-control" required>
              ${rooms.map(r => `<option value="${r.code}">${r.code} - ${r.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Problem Category</label>
            <select id="repCategorySelect" class="form-control" required>
              <option value="Equipment Damage">Equipment Malfunction / Damage</option>
              <option value="Electrical / Power Hazard">Electrical / Power Hazard</option>
              <option value="Air Conditioning Leak">Air Conditioning / Ventilation</option>
              <option value="Missing Tools / Apparatus">Missing Tools / Apparatus</option>
              <option value="Door Lock / Physical Security">Door Lock / Physical Security</option>
              <option value="Other Facility Concern">Other Facility Concern</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Write About the Problem</label>
            <textarea id="repDescriptionInput" class="form-control" rows="3" placeholder="Describe the problem you encounter in the lab or academic room..." required></textarea>
          </div>

          <!-- Upload Picture with Preview -->
          <div class="form-group">
            <label class="form-label">Upload a Picture (Evidence)</label>
            <div class="photo-upload-area" onclick="document.getElementById('problemPhotoFile').click()">
              <input type="file" id="problemPhotoFile" accept="image/*" capture="environment" style="display: none;">
              <span style="font-size: 1.4rem;">📷</span>
              <div style="font-size: 0.76rem; color: var(--c-secondary); margin-top: 4px;">
                Tap to take a photo or upload an image
              </div>
            </div>
            <div id="photoPreviewContainer"></div>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%;">
            Submit Report to Administration
          </button>
        </form>
      </div>
    `;
  },

  bindMobileReportEvents() {
    const fileInput = document.getElementById('problemPhotoFile');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          this.uploadedPhotoBase64 = loadEvent.target.result;
          const container = document.getElementById('photoPreviewContainer');
          if (container) {
            container.innerHTML = `
              <div style="text-align: center; margin-top: 6px;">
                <img src="${this.uploadedPhotoBase64}" class="photo-preview-image" alt="Preview">
                <div style="font-size: 0.7rem; color: var(--c-green); margin-top: 2px;">Image attached ready for submission</div>
              </div>
            `;
          }
        };
        reader.readAsDataURL(file);
      });
    }

    const form = document.getElementById('mobileReportForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const room = document.getElementById('repRoomSelect').value;
        const category = document.getElementById('repCategorySelect').value;
        const description = document.getElementById('repDescriptionInput').value;
        const user = window.appState.getCurrentUser() || (window.appState.data.demoUsers ? window.appState.data.demoUsers.student : null);

        window.appState.addProblemReport({
          roomCode: room,
          category: category,
          description: description,
          photoBase64: this.uploadedPhotoBase64,
          reporterName: user.name,
          reporterRole: user.role,
          reporterId: user.id || user.studentId || "USER-01"
        });

        this.uploadedPhotoBase64 = null;
        this.showToast(`Problem report submitted for ${room}. Thank you!`, 'success');
        this.switchMobileTab('rooms');
      });
    }
  },

  /* ==========================================================================
     MODALS
     ========================================================================== */
  openUserSwitcherModal() {
    const modal = document.getElementById('userSwitcherModal');
    if (modal) modal.classList.add('active');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  selectUserPreset(roleKey) {
    window.appState.setUser(roleKey);
    this.closeModal('userSwitcherModal');
    this.showToast(`Active persona: ${window.appState.currentUser.name} (${roleKey.toUpperCase()})`, 'info');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 250);
    }, 3800);
  }
};

window.appUi = appUi;

document.addEventListener('DOMContentLoaded', () => {
  appUi.init();
});
