/**
 * RUPAMS - Main Application Controller & View Orchestrator
 * University of Rizal System Morong Campus - College of Industrial Technology
 * Minimalist Light Edition
 */

const appUi = {
  activeAdminTab: 'dashboard',
  activeMobileTab: 'rooms',
  currentP2PStep: 1,
  selectedP2PKey: null,
  verifiedNfcUid: null,
  verifiedQrToken: null,
  uploadedPhotoBase64: null,

  init() {
    this.setupEventListeners();
    this.startLiveClock();
    this.render();

    // Listen to state events
    window.appState.on('stateChanged', () => this.render());
    window.appState.on('userChanged', () => this.render());
    window.appState.on('viewModeChanged', () => this.render());
    window.appState.on('transferAdded', (t) => {
      this.showToast(`Key Transfer logged for ${t.roomCode} via NFC + QR.`, 'success');
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
        window.appState.setViewMode('admin');
      });
    }
    if (btnMobileView) {
      btnMobileView.addEventListener('click', () => {
        window.appState.setViewMode('mobile');
      });
    }

    // Role switcher modal click
    const userBadge = document.getElementById('userProfileTrigger');
    if (userBadge) {
      userBadge.addEventListener('click', () => this.openUserSwitcherModal());
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
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (PST)';
      }
    };
    update();
    setInterval(update, 1000);
  },

  switchAdminTab(tabId) {
    this.activeAdminTab = tabId;
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    this.renderAdminView();
  },

  switchMobileTab(tabId) {
    this.activeMobileTab = tabId;
    document.querySelectorAll('.mobile-tabs-nav .m-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    this.renderMobileView();
  },

  render() {
    this.updateUserHeader();

    const isMobileMode = window.appState.viewMode === 'mobile';
    const adminContainer = document.getElementById('adminPortalContainer');
    const mobileContainer = document.getElementById('mobileAppContainer');
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

  updateUserHeader() {
    const user = window.appState.currentUser;
    const nameEl = document.getElementById('headerUserName');
    const roleEl = document.getElementById('headerUserRole');
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role.toUpperCase();
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
        break;
      case 'transfers':
        content.innerHTML = this.getAdminTransfersHTML();
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
   */
  getAdminDashboardHTML() {
    const rooms = window.appState.data.rooms;
    const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
    const availableCount = rooms.filter(r => r.status === 'available').length;

    return `
      <div class="content-title-bar">
        <div>
          <h2>Facility Utilization Dashboard</h2>
          <p>Real-time room availability and active class occupancy across CIT facilities.</p>
        </div>
        <div style="font-size: 0.82rem; color: var(--c-secondary);">
          Available: <strong>${availableCount}</strong> | Occupied: <strong>${occupiedCount}</strong>
        </div>
      </div>

      <div class="room-status-grid">
        ${rooms.map(r => {
          const isOcc = r.status === 'occupied';
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
              <div class="room-occupancy-info ${isOcc ? '' : 'vacant'}">
                ${isOcc && r.occupancy ? `
                  <strong>Class:</strong> ${r.occupancy.class}<br>
                  <strong>Faculty / Holder:</strong> ${r.occupancy.faculty}<br>
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
   * 2. Admin: Manual Schedule Creation with Constraint Enforcement
   */
  getAdminScheduleBuilderHTML() {
    const data = window.appState.data;

    return `
      <div class="content-title-bar">
        <div>
          <h2>Manual Schedule Creation & Constraint Enforcement</h2>
          <p>Program heads and dean administrators manually allocate courses with real-time overlap prevention.</p>
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
            <div class="form-group">
              <label class="form-label">CIT Facility / Room</label>
              <select id="schRoomSelect" class="form-control" required>
                ${data.rooms.map(r => `<option value="${r.code}">${r.code} - ${r.name} (Cap: ${r.capacity})</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Subject / Course</label>
              <select id="schCourseSelect" class="form-control" required>
                ${data.courses.map(c => `<option value="${c.code}">${c.code} - ${c.title}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Faculty Workload / Instructor</label>
              <select id="schFacultySelect" class="form-control" required>
                ${data.faculty.map(f => `<option value="${f.id}">${f.name} (${f.department})</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Student Section</label>
              <input type="text" id="schSectionInput" class="form-control" placeholder="e.g. BSIT-AUTO-2A" value="BSIT-ELX-3A" required>
            </div>

            <div class="form-group">
              <label class="form-label">Total Section Occupancy / Enrollment</label>
              <input type="number" id="schEnrollmentInput" class="form-control" value="28" min="1" max="60" required>
            </div>

            <div class="form-group">
              <label class="form-label">Day of Week</label>
              <select id="schDaySelect" class="form-control" required>
                ${window.SchedulerEngine.DAYS.map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="form-group">
                <label class="form-label">Start Time</label>
                <input type="time" id="schStartTime" class="form-control" value="08:00" required>
              </div>
              <div class="form-group">
                <label class="form-label">End Time</label>
                <input type="time" id="schEndTime" class="form-control" value="11:00" required>
              </div>
            </div>

            <!-- Live Constraint Alert Feedback -->
            <div id="scheduleConstraintAlert"></div>

            <button type="submit" id="btnSaveSchedule" class="btn btn-primary" style="width: 100%; margin-top: 12px;">
              Save to Timetable
            </button>
          </form>
        </div>

        <!-- Schedule List -->
        <div class="table-wrapper">
          <div style="padding: 12px 16px; border-bottom: 1px solid var(--c-border); display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 0.88rem; color: var(--c-primary);">Currently Committed Schedules (${data.schedules.length})</strong>
          </div>
          <table class="clean-table">
            <thead>
              <tr>
                <th>Day & Time</th>
                <th>Course</th>
                <th>Instructor</th>
                <th>Room</th>
                <th>Section</th>
                <th>Cap</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${data.schedules.map(s => `
                <tr>
                  <td><strong>${s.day}</strong><br><small style="color: var(--c-text-muted);">${s.startTime} - ${s.endTime}</small></td>
                  <td><strong>${s.courseCode}</strong><br><small style="color: var(--c-text-muted);">${s.courseTitle || ''}</small></td>
                  <td>${s.facultyName}</td>
                  <td><strong>${s.roomCode}</strong></td>
                  <td>${s.section}</td>
                  <td>${s.enrolled || 30}</td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick="appUi.deleteSchedule('${s.id}')" title="Delete Schedule">
                      ✕
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  bindAdminScheduleEvents() {
    const validateLive = () => {
      const room = document.getElementById('schRoomSelect').value;
      const faculty = document.getElementById('schFacultySelect').value;
      const day = document.getElementById('schDaySelect').value;
      const start = document.getElementById('schStartTime').value;
      const end = document.getElementById('schEndTime').value;
      const section = document.getElementById('schSectionInput').value;
      const enrolled = Number(document.getElementById('schEnrollmentInput').value) || 30;

      const candidate = {
        roomCode: room,
        facultyId: faculty,
        day: day,
        startTime: start,
        endTime: end,
        section: section,
        enrolled: enrolled
      };

      const result = window.SchedulerEngine.validateSchedule(candidate);
      const alertBox = document.getElementById('scheduleConstraintAlert');
      const submitBtn = document.getElementById('btnSaveSchedule');

      if (!result.isValid) {
        if (alertBox) {
          alertBox.innerHTML = `
            <div class="constraint-alert danger">
              <strong>Constraint Overlap Detected:</strong><br>
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
              No room, faculty, or section collisions detected for this time slot.
            </div>
          `;
        }
        if (submitBtn) submitBtn.disabled = false;
      }
    };

    ['schRoomSelect', 'schFacultySelect', 'schDaySelect', 'schStartTime', 'schEndTime', 'schSectionInput', 'schEnrollmentInput'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', validateLive);
    });

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
        const section = document.getElementById('schSectionInput').value;
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
          section: section,
          enrolled: enrolled
        });

        if (res.success) {
          this.showToast(`Schedule added for ${courseCode} in ${room}.`, 'success');
          this.renderAdminView();
        } else {
          this.showToast(`Error: ${res.errors[0]}`, 'error');
        }
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
   */
  getAdminSpreadsheetHTML() {
    const data = window.appState.data;
    const schedules = data.schedules;
    const inst = data.institution;

    return `
      <div class="content-title-bar">
        <div>
          <h2>Automated Spreadsheet Output Module</h2>
          <p>Instantly compiles manually created schedules into a formatted institutional spreadsheet. No manual third-party Excel plotting needed.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-primary" onclick="window.appState.exportSpreadsheetCSV()">
            Download Spreadsheet (.CSV / Excel)
          </button>
          <button class="btn btn-outline" onclick="window.print()">
            Print Spreadsheet Matrix
          </button>
        </div>
      </div>

      <div class="spreadsheet-container">
        <div class="spreadsheet-header-block">
          <h3>${inst.university} - ${inst.campus}</h3>
          <p><strong>${inst.college}</strong></p>
          <p>Official Semestral Timetable Spreadsheet (${inst.semester} AY ${inst.academicYear})</p>
        </div>

        <div class="table-wrapper" style="box-shadow: none; border-radius: 0;">
          <table class="clean-table" style="font-size: 0.8rem;">
            <thead>
              <tr style="background: var(--c-primary); color: #ffffff;">
                <th style="color: #fff; background: var(--c-primary);">Course Code</th>
                <th style="color: #fff; background: var(--c-primary);">Descriptive Title</th>
                <th style="color: #fff; background: var(--c-primary);">Assigned Room</th>
                <th style="color: #fff; background: var(--c-primary);">Day</th>
                <th style="color: #fff; background: var(--c-primary);">Time</th>
                <th style="color: #fff; background: var(--c-primary);">Section</th>
                <th style="color: #fff; background: var(--c-primary);">Faculty / Instructor</th>
                <th style="color: #fff; background: var(--c-primary);">Enrolled</th>
              </tr>
            </thead>
            <tbody>
              ${schedules.map((s, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td><strong>${s.courseCode}</strong></td>
                  <td>${s.courseTitle || '—'}</td>
                  <td><strong>${s.roomCode}</strong></td>
                  <td>${s.day}</td>
                  <td>${s.startTime} - ${s.endTime}</td>
                  <td>${s.section}</td>
                  <td>${s.facultyName}</td>
                  <td>${s.enrolled || 30}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /**
   * 4. Admin: Peer-to-Peer Key Transfer Audit Ledger
   */
  getAdminTransfersHTML() {
    const transfers = window.appState.data.transfers || [];

    return `
      <div class="content-title-bar">
        <div>
          <h2>Peer-to-Peer Key Transfer Audit Ledger</h2>
          <p>Verified physical key transfers with 2-factor NFC Key Card and Personal QR Code validation.</p>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="clean-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Room & Key ID</th>
              <th>From Custody</th>
              <th>To Recipient</th>
              <th>Action Type</th>
              <th>Verified NFC Tag</th>
              <th>Verified Personal QR</th>
              <th>Purpose / Notes</th>
            </tr>
          </thead>
          <tbody>
            ${transfers.map(t => `
              <tr>
                <td style="white-space: nowrap; font-family: monospace; font-size: 0.76rem;">
                  ${new Date(t.timestamp).toLocaleString()}
                </td>
                <td><strong>${t.roomCode}</strong><br><small style="color: var(--c-text-muted);">${t.keyId}</small></td>
                <td>${t.fromUser}</td>
                <td><strong>${t.toUser}</strong></td>
                <td><span class="badge-status ${t.actionType.includes('RETURN') ? 'available' : 'occupied'}">${t.actionType}</span></td>
                <td><code style="font-size: 0.72rem;">${t.nfcUidVerified}</code></td>
                <td><code style="font-size: 0.72rem;">${t.qrTokenVerified}</code></td>
                <td>${t.purpose}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  /**
   * 5. Admin: Facility Problem Reports Desk
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
                  <small style="color: var(--c-text-muted);">${new Date(r.timestamp).toLocaleTimeString()}</small>
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
     Only 3 features:
     1. P2P Key Transfer (NFC Key Card + Personal QR)
     2. Report Facility Problem (with picture upload)
     3. Minimalist Rooms Availability Dashboard
     ========================================================================== */
  renderMobileView() {
    const mobileBody = document.getElementById('mobileDynamicBody');
    if (!mobileBody) return;

    const user = window.appState.currentUser;
    const nameEl = document.getElementById('mobileUserNameTag');
    if (nameEl) nameEl.textContent = `${user.name} (${user.role.toUpperCase()})`;

    switch (this.activeMobileTab) {
      case 'rooms':
        mobileBody.innerHTML = this.getMobileRoomsHTML();
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
   * Mobile Feature 1: Minimalist Room Availability Dashboard
   * ONLY displays: what is occupied, what is not, and what class is occupying it.
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
          return `
            <div class="room-minimal-item ${isOcc ? 'occupied' : 'available'}">
              <div class="room-min-header">
                <span class="room-min-code">${room.code} - ${room.name}</span>
                <span class="badge-status ${room.status}">${room.status}</span>
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
   * Mobile Feature 2: Peer-to-Peer Key Transfer (Borrow / Return / Transfer)
   * Requires Physical Key NFC Card + Personal QR Code before transfer happens.
   */
  getMobileTransferHTML() {
    const user = window.appState.currentUser;
    const personalQrSvg = window.QRNfcSimulator.generatePersonalQRSVG(user.qrCodeData || user.id, 130);
    const keys = window.appState.data.keys;

    return `
      <div style="margin-bottom: 12px;">
        <strong style="font-size: 0.92rem; color: var(--c-primary);">Peer-to-Peer Key Transfer</strong>
        <p style="font-size: 0.74rem; color: var(--c-text-muted);">
          Authorized custody transfer requires both the <strong>Physical Key NFC Card</strong> and <strong>Personal QR Code</strong>.
        </p>
      </div>

      <div class="p2p-card">
        <div class="step-indicator-box">
          <span class="step-badge ${this.currentP2PStep >= 1 ? (this.currentP2PStep > 1 ? 'done' : 'active') : ''}">
            1. Key NFC Card ${this.currentP2PStep > 1 ? '✓' : ''}
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
          Present this QR code to the peer when receiving a key transfer.
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
          <div class="scan-box-clean">
            <div class="scan-icon-clean">📡</div>
            <strong style="font-size: 0.85rem; color: var(--c-primary);">Step 1: Scan Physical Key NFC Card</strong>
            <p style="font-size: 0.74rem; color: var(--c-text-muted); margin: 6px 0 14px 0;">
              Hold the physical key tag against the device or select below to simulate NFC tap.
            </p>
            <div class="form-group" style="text-align: left;">
              <label class="form-label">Select Key to Verify:</label>
              <select id="p2pKeySelect" class="form-control" style="font-size: 0.8rem;">
                ${keys.map(k => `
                  <option value="${k.keyId}" ${this.selectedP2PKey === k.keyId ? 'selected' : ''}>
                    ${k.roomCode} Key (NFC UID: ${k.nfcUid}) - Holder: ${k.currentHolder}
                  </option>
                `).join('')}
              </select>
            </div>
            <button class="btn btn-primary" id="btnConfirmNfcStep" style="width: 100%;">
              Tap & Verify Physical Key NFC
            </button>
          </div>
        </div>
      `;
    } else if (this.currentP2PStep === 2) {
      return `
        <div class="p2p-verification-screen">
          <div class="scan-box-clean">
            <div class="scan-icon-clean">📷</div>
            <strong style="font-size: 0.85rem; color: var(--c-primary);">Step 2: Scan Recipient Personal QR</strong>
            <p style="font-size: 0.74rem; color: var(--c-text-muted); margin: 6px 0 14px 0;">
              Key <strong>${this.selectedP2PKey}</strong> verified. Now scan the recipient's personal identity QR code.
            </p>

            <div class="form-group" style="text-align: left;">
              <label class="form-label">Recipient Identity (Simulated QR Scan):</label>
              <select id="p2pRecipientSelect" class="form-control" style="font-size: 0.8rem;">
                <option value="Juan Dela Cruz (Student)|QR-STU-2024-0012-JUAN">Juan Dela Cruz (Student ID: 2024-0012-MR)</option>
                <option value="Engr. Maria Elena Bautista (Faculty)|QR-FAC-001-BAUTISTA">Engr. Maria Elena Bautista (Faculty FAC-001)</option>
                <option value="Prof. Roberto Santos (Faculty)|QR-FAC-002-SANTOS">Prof. Roberto Santos (Faculty FAC-002)</option>
                <option value="CIT Smart Key Cabinet (Slot #01)|QR-CABINET-SLOT-01">Return Key to Cabinet (Check-In)</option>
              </select>
            </div>

            <div style="display: flex; gap: 8px;">
              <button class="btn btn-outline" id="btnBackToNfcStep" style="flex: 1;">Back</button>
              <button class="btn btn-primary" id="btnConfirmQrStep" style="flex: 2;">Verify Personal QR</button>
            </div>
          </div>
        </div>
      `;
    } else {
      // Step 3: Authorization Summary
      return `
        <div class="p2p-verification-screen" style="text-align: left;">
          <div style="background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 12px; font-size: 0.8rem;">
            <strong style="color: var(--c-primary); display: block; margin-bottom: 8px;">Transfer Verification Summary:</strong>
            <div>Key: <strong>${this.selectedP2PKey}</strong></div>
            <div>NFC Card Verified: <code>${this.verifiedNfcUid}</code></div>
            <div>Authorized Recipient: <strong>${this.verifiedToUser}</strong></div>
            <div>Recipient QR Token: <code>${this.verifiedQrToken}</code></div>
          </div>

          <div class="form-group">
            <label class="form-label">Purpose of Custody Transfer:</label>
            <input type="text" id="p2pPurposeInput" class="form-control" value="Peer-to-Peer Academic Lab Session" placeholder="e.g. Lab Make-up / Thesis Assembly">
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline" id="btnCancelP2P" style="flex: 1;">Cancel</button>
            <button class="btn btn-primary" id="btnExecuteTransfer" style="flex: 2;">
              Complete Authorized Transfer
            </button>
          </div>
        </div>
      `;
    }
  },

  bindMobileTransferEvents() {
    const btnConfirmNfc = document.getElementById('btnConfirmNfcStep');
    if (btnConfirmNfc) {
      btnConfirmNfc.addEventListener('click', () => {
        const keyId = document.getElementById('p2pKeySelect').value;
        const key = window.appState.getKey(keyId);
        this.selectedP2PKey = keyId;
        this.verifiedNfcUid = key ? key.nfcUid : "04:17:CC:F6:E0:85";

        if (window.SoundManager) window.SoundManager.playNfcTap();
        this.currentP2PStep = 2;
        this.renderMobileView();
      });
    }

    const btnBack = document.getElementById('btnBackToNfcStep');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        this.currentP2PStep = 1;
        this.renderMobileView();
      });
    }

    const btnConfirmQr = document.getElementById('btnConfirmQrStep');
    if (btnConfirmQr) {
      btnConfirmQr.addEventListener('click', () => {
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
        this.currentP2PStep = 1;
        this.renderMobileView();
      });
    }

    const btnExec = document.getElementById('btnExecuteTransfer');
    if (btnExec) {
      btnExec.addEventListener('click', () => {
        const purpose = document.getElementById('p2pPurposeInput').value;
        const isReturn = this.verifiedToUser.includes('Cabinet');
        const key = window.appState.getKey(this.selectedP2PKey);

        const res = window.KeyManager.processP2PTransfer({
          keyId: this.selectedP2PKey,
          roomCode: key ? key.roomCode : "CIT-ELX",
          nfcUid: this.verifiedNfcUid,
          qrToken: this.verifiedQrToken,
          fromUser: window.appState.currentUser.name + ` (${window.appState.currentUser.role})`,
          toUser: this.verifiedToUser,
          actionType: isReturn ? "RETURN_TO_CABINET" : "P2P_TRANSFER",
          purpose: purpose
        });

        if (res.success) {
          this.currentP2PStep = 1;
          this.showToast(`Transfer Authorized! Custody transferred to ${this.verifiedToUser}.`, 'success');
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
          Report equipment or facility issues to CIT administration.
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
            <textarea id="repDescriptionInput" class="form-control" rows="3" placeholder="Describe the issue in detail (e.g. Broken soldering iron at bench 3)..." required></textarea>
          </div>

          <!-- Upload Picture with Preview -->
          <div class="form-group">
            <label class="form-label">Upload a Picture (Evidence)</label>
            <div class="photo-upload-area" onclick="document.getElementById('problemPhotoFile').click()">
              <input type="file" id="problemPhotoFile" accept="image/*" capture="environment" style="display: none;">
              <span style="font-size: 1.4rem;">📷</span>
              <div style="font-size: 0.76rem; color: var(--c-secondary); margin-top: 4px;">
                Tap to take a photo or select an image
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
        const user = window.appState.currentUser;

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
