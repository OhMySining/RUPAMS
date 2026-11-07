/**
 * RUPAMS - Main Application Controller & View Orchestrator
 * University of Rizal System Morong Campus - College of Industrial Technology (CIT)
 */

const appUi = {
  activeAdminTab: 'dashboard',
  activeMobileTab: 'facilities',
  filterRoomType: 'ALL',
  searchQuery: '',

  init() {
    this.setupEventListeners();
    this.startLiveClock();
    this.render();
    
    // Listen for state changes
    window.appState.on('stateChanged', () => this.render());
    window.appState.on('userChanged', () => this.render());
    window.appState.on('viewModeChanged', () => this.render());
    window.appState.on('mobileFrameChanged', () => this.render());
    window.appState.on('overdueAlarmTriggered', (e) => {
      this.showToast(`🚨 OVERDUE KEY ALERT: ${e.totalOverdue} facility key(s) are overdue for return!`, 'error');
      this.updateOverdueBadge();
    });

    // Start background overdue monitor
    if (window.KeyManager) {
      window.KeyManager.init();
    }
  },

  setupEventListeners() {
    // Top Bar Mode Switcher
    const btnAdminView = document.getElementById('btnAdminView');
    const btnMobileView = document.getElementById('btnMobileView');
    const btnToggleFrame = document.getElementById('btnToggleFrame');

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
    if (btnToggleFrame) {
      btnToggleFrame.addEventListener('click', () => {
        const current = window.appState.mobileViewFrame;
        window.appState.setMobileFrame(!current);
      });
    }

    // Role Switcher Click
    const userBadge = document.getElementById('userProfileTrigger');
    if (userBadge) {
      userBadge.addEventListener('click', () => this.openUserSwitcherModal());
    }

    // Admin Sidebar navigation
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        if (tab) {
          this.switchAdminTab(tab);
        }
      });
    });

    // Mobile Bottom Nav
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        if (tab) {
          this.switchMobileTab(tab);
        }
      });
    });

    // Sound toggle
    const btnSound = document.getElementById('btnSoundToggle');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        if (window.SoundManager) {
          window.SoundManager.enabled = !window.SoundManager.enabled;
          btnSound.textContent = window.SoundManager.enabled ? '🔊' : '🔇';
          this.showToast(window.SoundManager.enabled ? 'Audio feedback enabled' : 'Audio feedback muted', 'info');
        }
      });
    }
  },

  startLiveClock() {
    const update = () => {
      const now = new Date();
      const clockEl = document.getElementById('liveClockTime');
      const dateEl = document.getElementById('liveClockDate');
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: true });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' (PST / Manila)';
      }

      // Also tick active key countdown if visible
      this.updateActiveKeyTimer();
    };
    update();
    setInterval(update, 1000);
  },

  updateOverdueBadge() {
    const overdueCount = window.appState.data.keys.filter(k => k.status === 'overdue').length;
    const chip = document.getElementById('overdueAlertChip');
    const countEl = document.getElementById('overdueCountNumber');
    if (chip && countEl) {
      if (overdueCount > 0) {
        chip.classList.add('visible');
        countEl.textContent = overdueCount;
      } else {
        chip.classList.remove('visible');
      }
    }
  },

  switchAdminTab(tabId) {
    this.activeAdminTab = tabId;
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    this.renderAdminView();
  },

  switchMobileTab(tabId) {
    this.activeMobileTab = tabId;
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    this.renderMobileView();
  },

  render() {
    this.updateUserHeader();
    this.updateOverdueBadge();

    const isMobileMode = window.appState.viewMode === 'mobile';
    const adminContainer = document.getElementById('adminPortalContainer');
    const mobileContainer = document.getElementById('mobileAppContainer');
    const frameToggleBtn = document.getElementById('btnToggleFrame');
    const btnAdminView = document.getElementById('btnAdminView');
    const btnMobileView = document.getElementById('btnMobileView');

    if (btnAdminView) btnAdminView.classList.toggle('active', !isMobileMode);
    if (btnMobileView) btnMobileView.classList.toggle('active', isMobileMode);

    if (isMobileMode) {
      if (adminContainer) adminContainer.classList.add('hidden');
      if (mobileContainer) mobileContainer.classList.remove('hidden');
      if (frameToggleBtn) frameToggleBtn.classList.remove('hidden');
      
      const outerWrapper = document.querySelector('.mobile-wrapper-outer');
      if (outerWrapper) {
        outerWrapper.classList.toggle('full-screen-mode', !window.appState.mobileViewFrame);
      }
      this.renderMobileView();
    } else {
      if (adminContainer) adminContainer.classList.remove('hidden');
      if (mobileContainer) mobileContainer.classList.add('hidden');
      if (frameToggleBtn) frameToggleBtn.classList.add('hidden');
      this.renderAdminView();
    }
  },

  updateUserHeader() {
    const user = window.appState.currentUser;
    const nameEl = document.getElementById('headerUserName');
    const roleEl = document.getElementById('headerUserRole');
    const avatarEl = document.getElementById('headerUserAvatar');

    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role.toUpperCase();
    if (avatarEl) avatarEl.textContent = user.avatar || user.name.slice(0, 2).toUpperCase();
  },

  /**
   * Render Admin Portal Workspace
   */
  renderAdminView() {
    const content = document.getElementById('adminDynamicContent');
    if (!content) return;

    switch (this.activeAdminTab) {
      case 'dashboard':
        content.innerHTML = this.getDashboardHTML();
        this.bindDashboardEvents();
        break;
      case 'scheduler':
        content.innerHTML = this.getSchedulerHTML();
        this.bindSchedulerEvents();
        break;
      case 'conflicts':
        content.innerHTML = this.getConflictDetectorHTML();
        this.bindConflictDetectorEvents();
        break;
      case 'workflow':
        content.innerHTML = this.getWorkflowHTML();
        this.bindWorkflowEvents();
        break;
      case 'keys':
        content.innerHTML = this.getKeyRegistryHTML();
        this.bindKeyRegistryEvents();
        break;
      case 'audit':
        content.innerHTML = this.getAuditTrailHTML();
        this.bindAuditEvents();
        break;
      case 'settings':
        content.innerHTML = this.getSettingsHTML();
        this.bindSettingsEvents();
        break;
      default:
        content.innerHTML = this.getDashboardHTML();
    }
  },

  /* ==========================================================================
     ADMIN TAB 1: Centralized Real-Time Room Monitoring Dashboard
     ========================================================================== */
  getDashboardHTML() {
    const data = window.appState.data;
    const rooms = data.rooms;
    const keys = data.keys;
    const requests = data.requests;

    const totalRooms = rooms.length;
    const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
    const availableCount = rooms.filter(r => r.status === 'available').length;
    const overdueCount = keys.filter(k => k.status === 'overdue').length;
    const pendingReqCount = requests.filter(r => r.status === 'pending').length;

    // Filter rooms by category
    const filteredRooms = rooms.filter(r => {
      if (this.filterRoomType === 'ALL') return true;
      if (this.filterRoomType === 'LECTURE') return r.type === 'Lecture';
      if (this.filterRoomType === 'COMP') return r.type === 'Computer Lab';
      if (this.filterRoomType === 'WORKSHOP') return ['Automotive Shop', 'Mechanical Shop', 'Electrical Workshop', 'Electronics Lab', 'Food Tech'].includes(r.type);
      return true;
    });

    return `
      <!-- KPI Top Summary Grid -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-blue">
          <div class="kpi-info">
            <span>Total CIT Facilities</span>
            <h3>${totalRooms}</h3>
          </div>
          <div class="kpi-icon">🏛️</div>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-info">
            <span>Available Facilities</span>
            <h3>${availableCount}</h3>
          </div>
          <div class="kpi-icon">🟢</div>
        </div>
        <div class="kpi-card kpi-purple">
          <div class="kpi-info">
            <span>Active Occupancies</span>
            <h3>${occupiedCount}</h3>
          </div>
          <div class="kpi-icon">👥</div>
        </div>
        <div class="kpi-card kpi-amber">
          <div class="kpi-info">
            <span>Pending Borrow Requests</span>
            <h3>${pendingReqCount}</h3>
          </div>
          <div class="kpi-icon">📝</div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-info">
            <span>Overdue Key Alerts</span>
            <h3>${overdueCount}</h3>
          </div>
          <div class="kpi-icon">🚨</div>
        </div>
      </div>

      <!-- Section Header -->
      <div class="section-header">
        <div>
          <h2>Centralized Real-Time Room Monitoring</h2>
          <p>Live visibility across College of Industrial Technology lecture halls, smart labs, and workshop bays.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary btn-sm" onclick="QRNfcSimulator.openNfcTapModal('checkout')">
            📡 NFC Key Tap Simulator
          </button>
          <button class="btn btn-outline btn-sm" onclick="QRNfcSimulator.openQrScannerModal()">
            📷 Camera / QR Scan
          </button>
        </div>
      </div>

      <!-- Filter Toolbar -->
      <div class="filter-toolbar">
        <div class="filter-pills">
          <button class="filter-pill ${this.filterRoomType === 'ALL' ? 'active' : ''}" data-filter="ALL">All Facilities (${totalRooms})</button>
          <button class="filter-pill ${this.filterRoomType === 'LECTURE' ? 'active' : ''}" data-filter="LECTURE">Lecture Rooms (3)</button>
          <button class="filter-pill ${this.filterRoomType === 'COMP' ? 'active' : ''}" data-filter="COMP">Computer & CADD Labs (2)</button>
          <button class="filter-pill ${this.filterRoomType === 'WORKSHOP' ? 'active' : ''}" data-filter="WORKSHOP">Industrial Workshops (5)</button>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: #64748b;">Unified MySQL Local-Sync: <strong>Active</strong></span>
        </div>
      </div>

      <!-- Room Cards Grid -->
      <div class="rooms-grid">
        ${filteredRooms.map(room => {
          const key = data.keys.find(k => k.roomCode === room.code) || {};
          const isOverdue = room.status === 'overdue' || key.status === 'overdue';
          const isOccupied = room.status === 'occupied';

          let occupantText = "Currently unoccupied & locked in cabinet";
          let subText = "Ready for scheduled class or reservation release.";

          if (isOverdue && key.currentHolder) {
            occupantText = `⚠️ OVERDUE: ${key.currentHolder.name} (${key.currentHolder.role})`;
            subText = `Purpose: ${key.currentHolder.purpose} | Due: ${new Date(key.currentHolder.dueAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
          } else if (room.currentOccupant) {
            occupantText = `Occupant: ${room.currentOccupant.name}`;
            subText = `Course: ${room.currentOccupant.course} (${room.currentOccupant.startTime} - ${room.currentOccupant.expectedEnd})`;
          } else if (room.activeSchedule) {
            occupantText = `Scheduled: ${room.activeSchedule.courseCode} (${room.activeSchedule.section})`;
            subText = `Faculty: ${room.activeSchedule.faculty} | ${room.activeSchedule.time}`;
          }

          return `
            <div class="room-card status-${room.status}">
              <div class="room-card-header">
                <div>
                  <div class="room-code-tag">${room.code}</div>
                  <div class="room-type-tag">${room.type} • Cap: ${room.capacity}</div>
                </div>
                <span class="status-pill ${room.status}">${room.status}</span>
              </div>

              <div class="room-title">${room.name}</div>
              <div class="room-location">📍 ${room.building} (${room.floor})</div>

              <div class="room-occupancy-box ${isOverdue ? 'alert-overdue' : ''}">
                <span class="occupant-name">${occupantText}</span>
                <div class="occupant-detail">${subText}</div>
              </div>

              <div class="room-card-footer">
                <div class="key-tag-info">
                  <span>🔑 ${key.keyId || 'N/A'}</span>
                  <span>(${key.status === 'in_cabinet' ? 'Cabinet Slot' : 'In Custody'})</span>
                </div>
                <button class="btn btn-outline btn-sm" onclick="appUi.openRoomDetailModal('${room.code}')">
                  Inspect & Key Flow
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  bindDashboardEvents() {
    document.querySelectorAll('.filter-pills .filter-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.filterRoomType = e.currentTarget.getAttribute('data-filter');
        this.renderAdminView();
      });
    });
  },

  /* ==========================================================================
     ADMIN TAB 2: Automated Timetable Generation Module
     ========================================================================== */
  getSchedulerHTML() {
    const data = window.appState.data;
    const schedules = data.schedules;
    const timeSlots = window.SchedulerEngine.TIME_SLOTS;
    const days = window.SchedulerEngine.DAYS;

    return `
      <div class="section-header">
        <div>
          <h2>Automated Timetable Generation Module</h2>
          <p>Eliminates manual schedule plotting in Microsoft Excel with a single-click constraint-satisfaction scheduling engine.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-gold" id="btnRunScheduleEngine">
            ⚡ Generate Optimized Timetable
          </button>
          <button class="btn btn-outline" onclick="window.print()">
            🖨️ Print Schedule Matrix
          </button>
        </div>
      </div>

      <!-- Timetable Control Panel -->
      <div class="timetable-control-panel">
        <div class="timetable-stats-strip">
          <div class="stat-item">
            <span class="stat-label">Term / Academic Year</span>
            <span class="stat-val">${data.institution.semester} (${data.institution.academicYear})</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Allocated Course Sections</span>
            <span class="stat-val">${schedules.length} / ${data.courses.length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Double-Booking Conflict Rate</span>
            <span class="stat-val" style="color: #059669;">0% (Guaranteed)</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Workflow Status</span>
            <span class="stat-val" style="color: #2563eb;">${(data.timetableWorkflow.status || 'DRAFT').toUpperCase()}</span>
          </div>
        </div>

        <div>
          <button class="btn btn-primary btn-sm" onclick="appUi.switchAdminTab('conflicts')">
            🛡️ Open Real-Time Conflict Sandbox
          </button>
        </div>
      </div>

      <!-- Weekly Matrix View -->
      <div class="timetable-matrix-container">
        <table class="timetable-matrix">
          <thead>
            <tr>
              <th class="time-col-header">Time Period</th>
              ${days.map(d => `<th>${d}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${timeSlots.map(slot => {
              return `
                <tr>
                  <td class="time-slot-label">
                    <div>${slot.start} - ${slot.end}</div>
                    <small style="color: #64748b; font-size: 0.68rem;">3.0 Hrs</small>
                  </td>
                  ${days.map(day => {
                    const matching = schedules.filter(s => s.day === day && s.startTime === slot.start);
                    return `
                      <td class="schedule-slot-cell">
                        ${matching.map(item => {
                          const typeClass = item.roomCode.includes('AUTO') ? 'type-auto' :
                                            item.roomCode.includes('ELX') ? 'type-elx' :
                                            item.roomCode.includes('ELEC') ? 'type-elec' :
                                            item.roomCode.includes('CL') ? 'type-comp' : 'type-mech';
                          return `
                            <div class="schedule-card-block ${typeClass}">
                              <span class="schedule-card-course">${item.courseCode} (${item.section})</span>
                              <div class="schedule-card-faculty">👨‍🏫 ${item.facultyName}</div>
                              <span class="schedule-card-room">📍 ${item.roomCode}</span>
                            </div>
                          `;
                        }).join('')}
                      </td>
                    `;
                  }).join('')}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  bindSchedulerEvents() {
    const btnRun = document.getElementById('btnRunScheduleEngine');
    if (btnRun) {
      btnRun.addEventListener('click', () => {
        btnRun.disabled = true;
        btnRun.innerHTML = '⚙️ Computing Conflict-Free Constraints...';

        if (window.SoundManager) window.SoundManager.playTone(440, 'triangle', 0.2);

        setTimeout(() => {
          const result = window.SchedulerEngine.generateOptimizedTimetable();
          if (result.success) {
            window.SchedulerEngine.applyGeneratedTimetable(result.schedules);
            if (window.SoundManager) window.SoundManager.playSuccess();
            this.showToast(`🎉 Automated Engine scheduled ${result.metrics.placedCount} CIT classes with 100% zero-conflict guarantee!`, 'success');
          } else {
            this.showToast(`⚠️ Scheduled with ${result.unallocatedCount} unallocated classes due to room capacity.`, 'warning');
          }
          btnRun.disabled = false;
          btnRun.innerHTML = '⚡ Generate Optimized Timetable';
          this.renderAdminView();
        }, 700);
      });
    }
  },

  /* ==========================================================================
     ADMIN TAB 3: Real-Time Conflict Detection Sandbox
     ========================================================================== */
  getConflictDetectorHTML() {
    const data = window.appState.data;
    return `
      <div class="section-header">
        <div>
          <h2>Real-Time Conflict Detection & Double-Occupancy Prevention</h2>
          <p>Instantly cross-references active database constraints to block overlapping time slots, conflicting faculty assignments, and room double-bookings before finalization.</p>
        </div>
      </div>

      <div class="conflict-detector-card">
        <h3 style="font-size: 1.1rem; color: var(--urs-navy); margin-bottom: 14px;">
          Interactive Constraint Validator
        </h3>
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 20px;">
          Adjust the fields below. The validation engine tests for room collisions, faculty overlap, and section double-bookings simultaneously.
        </p>

        <div class="form-grid-3">
          <div class="form-group">
            <label class="form-label">CIT Facility / Room</label>
            <select id="conflictRoomSelect" class="form-control">
              ${data.rooms.map(r => `<option value="${r.code}">${r.code} - ${r.name} (Cap: ${r.capacity})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Assigned Faculty</label>
            <select id="conflictFacultySelect" class="form-control">
              ${data.faculty.map(f => `<option value="${f.id}">${f.name} (${f.department})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Day of Week</label>
            <select id="conflictDaySelect" class="form-control">
              ${window.SchedulerEngine.DAYS.map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Start Time</label>
            <input type="time" id="conflictStartTime" class="form-control" value="08:00">
          </div>

          <div class="form-group">
            <label class="form-label">End Time</label>
            <input type="time" id="conflictEndTime" class="form-control" value="11:00">
          </div>

          <div class="form-group">
            <label class="form-label">Section & Enrollment</label>
            <input type="text" id="conflictSection" class="form-control" value="BSIT-AUTO-2A" placeholder="e.g. BSIT-AUTO-2A">
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 18px;">
          <button class="btn btn-secondary btn-sm" id="btnPresetNoConflict">
            Test Clear Slot (No Conflict)
          </button>
          <button class="btn btn-secondary btn-sm" id="btnPresetRoomCollision">
            Test Preset: Room Double-Booking
          </button>
          <button class="btn btn-secondary btn-sm" id="btnPresetFacultyCollision">
            Test Preset: Faculty Overlap
          </button>
        </div>

        <div id="conflictResultOutput">
          <!-- Live result injected here -->
        </div>
      </div>
    `;
  },

  bindConflictDetectorEvents() {
    const runValidation = () => {
      const room = document.getElementById('conflictRoomSelect').value;
      const faculty = document.getElementById('conflictFacultySelect').value;
      const day = document.getElementById('conflictDaySelect').value;
      const start = document.getElementById('conflictStartTime').value;
      const end = document.getElementById('conflictEndTime').value;
      const section = document.getElementById('conflictSection').value;

      const candidate = {
        roomCode: room,
        facultyId: faculty,
        day: day,
        startTime: start,
        endTime: end,
        section: section,
        enrolled: 30
      };

      const result = window.SchedulerEngine.checkConflicts(candidate);
      const output = document.getElementById('conflictResultOutput');
      if (!output) return;

      if (result.hasConflict) {
        if (window.SoundManager) window.SoundManager.playConflict();
        output.innerHTML = `
          <div class="conflict-result-banner banner-danger">
            <span style="font-size: 1.5rem;">🚫</span>
            <div>
              <strong>VALIDATION FAILED: Double-Occupancy / Overlap Detected!</strong>
              <div class="conflict-details-list">
                ${result.conflicts.map(c => `
                  <div><strong>${c.title}:</strong> ${c.message}</div>
                `).join('')}
              </div>
              <div style="margin-top: 10px; font-weight: 700; color: #b91c1c;">
                System Action: Schedule finalization blocked to preserve timetable integrity.
              </div>
            </div>
          </div>
        `;
      } else {
        output.innerHTML = `
          <div class="conflict-result-banner banner-success">
            <span style="font-size: 1.5rem;">✅</span>
            <div>
              <strong>VALIDATION PASSED: Zero Overlaps Detected!</strong>
              <div>Facility ${room} is completely clear on ${day} (${start} - ${end}). Assigned instructor and student section are free of conflicting commitments.</div>
            </div>
          </div>
        `;
      }
    };

    ['conflictRoomSelect', 'conflictFacultySelect', 'conflictDaySelect', 'conflictStartTime', 'conflictEndTime', 'conflictSection'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', runValidation);
    });

    // Preset Buttons
    const btnNoConflict = document.getElementById('btnPresetNoConflict');
    const btnRoomColl = document.getElementById('btnPresetRoomCollision');
    const btnFacColl = document.getElementById('btnPresetFacultyCollision');

    if (btnNoConflict) {
      btnNoConflict.addEventListener('click', () => {
        document.getElementById('conflictRoomSelect').value = 'CIT-102';
        document.getElementById('conflictDaySelect').value = 'Friday';
        document.getElementById('conflictStartTime').value = '14:00';
        document.getElementById('conflictEndTime').value = '17:00';
        runValidation();
      });
    }

    if (btnRoomColl) {
      btnRoomColl.addEventListener('click', () => {
        document.getElementById('conflictRoomSelect').value = 'CIT-CL1';
        document.getElementById('conflictDaySelect').value = 'Monday';
        document.getElementById('conflictStartTime').value = '08:00';
        document.getElementById('conflictEndTime').value = '11:00';
        runValidation();
      });
    }

    if (btnFacColl) {
      btnFacColl.addEventListener('click', () => {
        document.getElementById('conflictFacultySelect').value = 'FAC-001'; // Engr. Bautista
        document.getElementById('conflictRoomSelect').value = 'CIT-103';
        document.getElementById('conflictDaySelect').value = 'Monday';
        document.getElementById('conflictStartTime').value = '13:00';
        document.getElementById('conflictEndTime').value = '16:00';
        runValidation();
      });
    }

    // Initial check
    runValidation();
  },

  /* ==========================================================================
     ADMIN TAB 4: Digital Review and Approval Workflow Portal
     ========================================================================== */
  getWorkflowHTML() {
    const wf = window.appState.data.timetableWorkflow;
    const currentStep = wf.status === 'draft' ? 1 :
                        wf.status === 'pending_review' ? 2 :
                        wf.status === 'approved' ? 3 : 4;

    return `
      <div class="section-header">
        <div>
          <h2>Digital Review & Approval Workflow Portal</h2>
          <p>Streamlines coordination between Program Heads, Dean's Office, and Department Chairs to approve and publish official college timetables.</p>
        </div>
      </div>

      <div class="workflow-card">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
          <div>
            <h3 style="font-size: 1.15rem; color: var(--urs-navy-dark);">Active Timetable Document: <strong>${wf.version}</strong></h3>
            <span style="font-size: 0.8rem; color: #64748b;">Target Term: ${wf.semester} | Assigned Reviewer: <strong>${wf.currentReviewer}</strong></span>
          </div>
          <span class="status-pill ${wf.status === 'published' ? 'available' : 'occupied'}">${wf.status.toUpperCase()}</span>
        </div>

        <!-- Stepper -->
        <div class="workflow-stepper">
          <div class="step-item ${currentStep >= 1 ? (currentStep > 1 ? 'completed' : 'active') : ''}">
            <div class="step-circle">${currentStep > 1 ? '✓' : '1'}</div>
            <span class="step-title">Automated Draft</span>
            <span class="step-desc">Engine Generation</span>
          </div>

          <div class="step-item ${currentStep >= 2 ? (currentStep > 2 ? 'completed' : 'active') : ''}">
            <div class="step-circle">${currentStep > 2 ? '✓' : '2'}</div>
            <span class="step-title">Program Head Review</span>
            <span class="step-desc">CIT Chairs Verification</span>
          </div>

          <div class="step-item ${currentStep >= 3 ? (currentStep > 3 ? 'completed' : 'active') : ''}">
            <div class="step-circle">${currentStep > 3 ? '✓' : '3'}</div>
            <span class="step-title">Dean Sign-Off</span>
            <span class="step-desc">Institutional Approval</span>
          </div>

          <div class="step-item ${currentStep >= 4 ? 'completed' : ''}">
            <div class="step-circle">${currentStep >= 4 ? '✓' : '4'}</div>
            <span class="step-title">Official Publication</span>
            <span class="step-desc">Live Display Sync</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="background: var(--bg-card-alt); padding: 18px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <strong>Available Workflow Actions</strong>
            <p style="font-size: 0.8rem; color: #64748b;">Logged under digital audit signature: ${window.appState.currentUser.name}</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-outline btn-sm" id="btnWorkflowRevise">
              Request Revisions
            </button>
            <button class="btn btn-primary btn-sm" id="btnWorkflowApprove">
              Sign & Approve (Program Head)
            </button>
            <button class="btn btn-gold btn-sm" id="btnWorkflowPublish">
              🚀 Publish Live to CIT Facilities
            </button>
          </div>
        </div>
      </div>

      <!-- Audit History Log -->
      <div class="workflow-card">
        <h4 style="font-size: 1rem; color: var(--urs-navy-dark); margin-bottom: 16px;">
          Workflow Review Audit History & Endorsements
        </h4>
        <div class="audit-history-timeline">
          ${(wf.history || []).map(h => `
            <div class="timeline-event">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: var(--urs-navy); font-size: 0.9rem;">${h.action}</strong>
                <span style="font-size: 0.75rem; color: #94a3b8;">${h.timestamp}</span>
              </div>
              <div style="font-size: 0.8rem; color: #475569; margin: 3px 0;">Signatory: <strong>${h.by}</strong></div>
              <div style="font-size: 0.78rem; color: #64748b; background: #f8fafc; padding: 6px 10px; border-radius: 4px; border-left: 3px solid #cbd5e1;">${h.notes}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  bindWorkflowEvents() {
    const btnApprove = document.getElementById('btnWorkflowApprove');
    const btnPublish = document.getElementById('btnWorkflowPublish');
    const btnRevise = document.getElementById('btnWorkflowRevise');

    if (btnApprove) {
      btnApprove.addEventListener('click', () => {
        window.SchedulerEngine.advanceWorkflow('approve', 'All facility parameters and faculty workloads cleared.');
        if (window.SoundManager) window.SoundManager.playSuccess();
        this.showToast('✅ Timetable digitally approved by Program Heads!', 'success');
        this.renderAdminView();
      });
    }

    if (btnPublish) {
      btnPublish.addEventListener('click', () => {
        window.SchedulerEngine.advanceWorkflow('publish', 'Officially published to student mobile apps and room monitors.');
        if (window.SoundManager) window.SoundManager.playSuccess();
        this.showToast('🚀 Timetable is now OFFICIALLY PUBLISHED across CIT!', 'success');
        this.renderAdminView();
      });
    }

    if (btnRevise) {
      btnRevise.addEventListener('click', () => {
        window.SchedulerEngine.advanceWorkflow('revision_requested', 'Workload adjustment required.');
        this.showToast('📝 Revision notes logged.', 'info');
        this.renderAdminView();
      });
    }
  },

  /* ==========================================================================
     ADMIN TAB 5: Digital Key Registry & Cabinet View
     ========================================================================== */
  getKeyRegistryHTML() {
    const data = window.appState.data;
    const keys = data.keys;

    return `
      <div class="section-header">
        <div>
          <h2>Digital Key Registry & Permanent Audit Trails</h2>
          <p>Replaces vulnerable paper logbooks with a centralized digital tracking registry and smart cabinet monitor.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-gold btn-sm" onclick="QRNfcSimulator.openNfcTapModal('checkout')">
            📡 NFC Fast Key Tap
          </button>
        </div>
      </div>

      <!-- Smart Key Cabinet Visualization -->
      <div class="key-cabinet-visual">
        <div class="cabinet-title">
          <span>CIT Physical Key Cabinet (Smart Rack Station #01)</span>
          <span style="font-size: 0.75rem; color: var(--urs-gold);">Integrated NFC Tag Sensor & Solenoid Status</span>
        </div>
        <div class="cabinet-hooks-grid">
          ${keys.map(key => {
            const slotClass = key.status === 'in_cabinet' ? 'slot-present' :
                              key.status === 'overdue' ? 'slot-overdue' : 'slot-borrowed';
            return `
              <div class="cabinet-hook-slot ${slotClass}" onclick="appUi.openKeyActionModal('${key.keyId}')">
                <div class="hook-peg"></div>
                <div class="hook-key-code">${key.roomCode}</div>
                <div class="hook-key-slot">${key.cabinetSlot}</div>
                <div style="font-size: 0.65rem; margin-top: 4px; font-weight: 700; color: ${key.status === 'in_cabinet' ? '#34d399' : key.status === 'overdue' ? '#f87171' : '#60a5fa'};">
                  ${key.status.toUpperCase()}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Master Key Table -->
      <div class="data-table-container">
        <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 1.05rem; color: var(--urs-navy-dark);">Master Key Inventory & Real-Time Custody</h3>
          <span style="font-size: 0.8rem; color: #64748b;">Total Physical Keys: <strong>${keys.length}</strong></span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Key ID / Tag</th>
              <th>Facility</th>
              <th>Status</th>
              <th>Current Custody / Holder</th>
              <th>Borrowed At</th>
              <th>Expected Due Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${keys.map(k => {
              const holder = k.currentHolder;
              return `
                <tr>
                  <td>
                    <strong>${k.keyId}</strong>
                    <div style="font-size: 0.72rem; color: #64748b; font-family: monospace;">NFC: ${k.nfcUid}</div>
                  </td>
                  <td><strong>${k.roomCode}</strong></td>
                  <td><span class="status-pill ${k.status}">${k.status}</span></td>
                  <td>
                    ${holder ? `
                      <strong>${holder.name}</strong>
                      <div style="font-size: 0.72rem; color: #64748b;">${holder.role} • ${holder.contact}</div>
                    ` : '<span style="color: #94a3b8;">Locked in Cabinet Slot</span>'}
                  </td>
                  <td>${holder ? new Date(holder.checkedOutAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</td>
                  <td>
                    ${holder ? `
                      <span style="font-weight: 700; color: ${k.status === 'overdue' ? '#dc2626' : '#1e293b'};">
                        ${new Date(holder.dueAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    ` : '—'}
                  </td>
                  <td>
                    ${k.status === 'in_cabinet' ? `
                      <button class="btn btn-primary btn-sm" onclick="appUi.openKeyActionModal('${k.keyId}')">
                        Release Key
                      </button>
                    ` : `
                      <button class="btn btn-success btn-sm" onclick="window.KeyManager.returnKey('${k.keyId}', 'ADMIN_OVERRIDE')">
                        Log Return
                      </button>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  bindKeyRegistryEvents() {},

  /* ==========================================================================
     ADMIN TAB 6: Rapid Incident Tracing & Digital History Logs
     ========================================================================== */
  getAuditTrailHTML() {
    const data = window.appState.data;
    const rooms = data.rooms;
    const logs = data.auditLogs;

    return `
      <div class="section-header">
        <div>
          <h2>Rapid Incident Tracing & Digital History Logs</h2>
          <p>Instant forensic query engine to trace who held specific facility keys during operational windows for security & safety accountability.</p>
        </div>
        <button class="btn btn-outline btn-sm" onclick="window.print()">
          🖨️ Export Forensic Report
        </button>
      </div>

      <!-- Incident Search Filter Box -->
      <div class="conflict-detector-card" style="margin-bottom: 22px;">
        <h4 style="font-size: 1rem; color: var(--urs-navy-dark); margin-bottom: 12px;">
          🔍 Forensic Access Query Filter
        </h4>
        <div class="form-grid-3">
          <div class="form-group">
            <label class="form-label">Facility / Room</label>
            <select id="incidentRoomFilter" class="form-control">
              <option value="ALL">All CIT Facilities</option>
              ${rooms.map(r => `<option value="${r.code}">${r.code} - ${r.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Event Type</label>
            <select id="incidentEventFilter" class="form-control">
              <option value="ALL">All Transaction Events</option>
              <option value="KEY_CHECKOUT">Key Check-Out</option>
              <option value="KEY_RETURN">Key Return</option>
              <option value="KEY_OVERDUE">Overdue Alarm Flag</option>
              <option value="REQUEST_APPROVED">Request Approval</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Search Personnel / ID / Notes</label>
            <input type="text" id="incidentKeywordInput" class="form-control" placeholder="Search name or key ID...">
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
          <button class="btn btn-secondary btn-sm" id="btnResetAuditFilter">Reset Query</button>
          <button class="btn btn-primary btn-sm" id="btnRunAuditFilter">Execute Forensic Search</button>
        </div>
      </div>

      <!-- Audit Trail Table -->
      <div class="data-table-container">
        <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 1.05rem; color: var(--urs-navy-dark);">Immutable Physical Access Ledger</h3>
          <span style="font-size: 0.8rem; color: #64748b;">Logged Transactions: <strong id="auditCountTotal">${logs.length}</strong></span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event</th>
              <th>Facility</th>
              <th>Key ID</th>
              <th>Personnel / Actor</th>
              <th>Verification Mode</th>
              <th>Log Details</th>
            </tr>
          </thead>
          <tbody id="auditTableBody">
            ${this.renderAuditRows(logs)}
          </tbody>
        </table>
      </div>
    `;
  },

  renderAuditRows(logs) {
    if (!logs || logs.length === 0) {
      return `<tr><td colspan="7" class="text-center" style="padding: 24px; color: #94a3b8;">No matching forensic records found.</td></tr>`;
    }
    return logs.map(l => `
      <tr>
        <td style="white-space: nowrap; font-family: monospace; font-size: 0.78rem;">
          ${new Date(l.timestamp).toLocaleString()}
        </td>
        <td><span class="badge-event ${l.eventType}">${l.eventType}</span></td>
        <td><strong>${l.roomCode}</strong></td>
        <td><span style="font-family: monospace; font-size: 0.78rem;">${l.keyId}</span></td>
        <td>
          <strong>${l.actorName || 'System'}</strong>
          <div style="font-size: 0.72rem; color: #64748b;">${l.actorRole || ''}</div>
        </td>
        <td>
          <span style="font-size: 0.75rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
            ${l.verificationMode || 'AUTO'}
          </span>
        </td>
        <td style="font-size: 0.8rem; max-width: 300px;">${l.details}</td>
      </tr>
    `).join('');
  },

  bindAuditEvents() {
    const btnRun = document.getElementById('btnRunAuditFilter');
    const btnReset = document.getElementById('btnResetAuditFilter');

    if (btnRun) {
      btnRun.addEventListener('click', () => {
        const room = document.getElementById('incidentRoomFilter').value;
        const ev = document.getElementById('incidentEventFilter').value;
        const kw = document.getElementById('incidentKeywordInput').value;

        const res = window.KeyManager.queryIncidentLogs({
          roomCode: room,
          eventType: ev,
          keyword: kw
        });

        const tbody = document.getElementById('auditTableBody');
        const count = document.getElementById('auditCountTotal');
        if (tbody) tbody.innerHTML = this.renderAuditRows(res.logs);
        if (count) count.textContent = res.logs.length;

        this.showToast(`🔍 Query found ${res.logs.length} matching audit entries.`, 'info');
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        document.getElementById('incidentRoomFilter').value = 'ALL';
        document.getElementById('incidentEventFilter').value = 'ALL';
        document.getElementById('incidentKeywordInput').value = '';
        const tbody = document.getElementById('auditTableBody');
        const count = document.getElementById('auditCountTotal');
        if (tbody) tbody.innerHTML = this.renderAuditRows(window.appState.data.auditLogs);
        if (count) count.textContent = window.appState.data.auditLogs.length;
      });
    }
  },

  /* ==========================================================================
     ADMIN TAB 7: System Settings & Data Sync
     ========================================================================== */
  getSettingsHTML() {
    return `
      <div class="section-header">
        <div>
          <h2>System Settings & Database Synchronization</h2>
          <p>Client-side LocalStorage management, mock database resets, and JSON backup exports.</p>
        </div>
      </div>

      <div class="conflict-detector-card">
        <h4 style="font-size: 1.05rem; color: var(--urs-navy); margin-bottom: 12px;">Institutional Context</h4>
        <div style="font-size: 0.88rem; color: #475569; line-height: 1.6; margin-bottom: 20px;">
          <strong>University of Rizal System Morong Campus</strong><br>
          College of Industrial Technology (CIT)<br>
          Room Utilization and Physical Access Management System (RUPAMS)<br>
          Undergraduate Thesis Research Project
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px; max-width: 450px;">
          <button class="btn btn-primary" onclick="window.appState.exportData()">
            💾 Export Database Backup (JSON)
          </button>

          <label class="btn btn-outline" style="cursor: pointer; text-align: center;">
            📂 Import Database Backup (JSON)
            <input type="file" id="importFileInput" accept=".json" style="display: none;" onchange="appUi.handleFileImport(event)">
          </label>

          <button class="btn btn-danger" onclick="appUi.confirmResetData()">
            ⚠️ Reset Database to URS CIT Defaults
          </button>
        </div>
      </div>
    `;
  },

  bindSettingsEvents() {},

  handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = window.appState.importData(e.target.result);
      if (result.success) {
        this.showToast('✅ Database successfully imported and synced!', 'success');
        this.render();
      } else {
        this.showToast(`⚠️ Import failed: ${result.error}`, 'error');
      }
    };
    reader.readAsText(file);
  },

  confirmResetData() {
    if (confirm("Reset all room schedules, keys, and audit logs to original URS Morong CIT thesis demo state?")) {
      window.appState.resetToDefault();
      this.showToast("🔄 Database restored to default institutional seed state.", "success");
      this.render();
    }
  },

  /* ==========================================================================
     MOBILE WEB APP RENDERING (Students & Faculty View)
     ========================================================================== */
  renderMobileView() {
    const mobileBody = document.getElementById('mobileDynamicBody');
    if (!mobileBody) return;

    // Update greeting
    const user = window.appState.currentUser;
    const greetingName = document.getElementById('mobileGreetingName');
    const greetingRole = document.getElementById('mobileGreetingRole');
    const greetingAvatar = document.getElementById('mobileGreetingAvatar');

    if (greetingName) greetingName.textContent = user.name;
    if (greetingRole) greetingRole.textContent = `${user.role.toUpperCase()} • ${user.department || user.program || 'CIT'}`;
    if (greetingAvatar) greetingAvatar.textContent = user.avatar || user.name.slice(0, 2);

    switch (this.activeMobileTab) {
      case 'facilities':
        mobileBody.innerHTML = this.getMobileFacilitiesHTML();
        break;
      case 'borrow':
        mobileBody.innerHTML = this.getMobileBorrowFormHTML();
        this.bindMobileBorrowEvents();
        break;
      case 'active':
        mobileBody.innerHTML = this.getMobileActiveKeyHTML();
        this.bindMobileActiveKeyEvents();
        break;
      case 'scan':
        mobileBody.innerHTML = this.getMobileScannerViewHTML();
        break;
      default:
        mobileBody.innerHTML = this.getMobileFacilitiesHTML();
    }
  },

  getMobileFacilitiesHTML() {
    const rooms = window.appState.data.rooms;
    return `
      <div style="margin-bottom: 14px;">
        <h3 style="font-size: 1.1rem; color: var(--urs-navy-dark); font-weight: 800;">CIT Facilities Availability</h3>
        <p style="font-size: 0.78rem; color: #64748b;">Live room statuses and scheduled lab activities.</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${rooms.map(room => {
          const key = window.appState.getKey(room.code) || {};
          return `
            <div style="background: white; border-radius: var(--radius-md); padding: 14px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <strong style="font-size: 1rem; color: var(--urs-navy);">${room.code}</strong>
                  <div style="font-size: 0.75rem; color: #64748b;">${room.name}</div>
                </div>
                <span class="status-pill ${room.status}">${room.status}</span>
              </div>
              <div style="font-size: 0.75rem; color: #475569; margin: 8px 0;">
                📍 ${room.building} • Cap: ${room.capacity}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 8px; margin-top: 6px;">
                <span style="font-size: 0.72rem; color: #64748b;">Key: <strong>${key.status === 'in_cabinet' ? 'Available' : 'Issued'}</strong></span>
                <button class="btn btn-outline btn-sm" onclick="appUi.requestRoomFromMobile('${room.code}')">
                  Request Key
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  requestRoomFromMobile(roomCode) {
    this.switchMobileTab('borrow');
    setTimeout(() => {
      const sel = document.getElementById('mobileReqRoomSelect');
      if (sel) sel.value = roomCode;
    }, 50);
  },

  getMobileBorrowFormHTML() {
    const data = window.appState.data;
    const user = window.appState.currentUser;

    return `
      <div style="margin-bottom: 14px;">
        <h3 style="font-size: 1.1rem; color: var(--urs-navy-dark); font-weight: 800;">Digital Key Borrow Request</h3>
        <p style="font-size: 0.78rem; color: #64748b;">Submit an academic key request for faculty review and admin cabinet release.</p>
      </div>

      <div style="background: white; border-radius: var(--radius-md); padding: 18px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <form id="mobileBorrowForm">
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">CIT Facility / Laboratory</label>
            <select id="mobileReqRoomSelect" class="form-control" required>
              ${data.rooms.map(r => `<option value="${r.code}">${r.code} - ${r.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">Purpose of Access</label>
            <input type="text" id="mobileReqPurpose" class="form-control" placeholder="e.g. Capstone Project Testing / Lab Make-up" required>
          </div>

          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">Duration (Hours)</label>
            <select id="mobileReqDuration" class="form-control">
              <option value="1">1.0 Hour</option>
              <option value="2" selected>2.0 Hours</option>
              <option value="3">3.0 Hours</option>
              <option value="4">4.0 Hours</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label">Faculty Endorsement / Advisor</label>
            <select id="mobileReqFaculty" class="form-control">
              ${data.faculty.map(f => `<option value="${f.name}">${f.name} (${f.department})</option>`).join('')}
            </select>
          </div>

          <button type="submit" class="btn btn-gold" style="width: 100%;">
            📤 Submit Digital Borrow Request
          </button>
        </form>
      </div>

      <div style="margin-top: 18px;">
        <h4 style="font-size: 0.88rem; color: #475569; margin-bottom: 8px;">My Recent Requests</h4>
        ${data.requests.filter(r => r.requesterName.includes(user.name.split(' ')[0]) || r.role === user.role).slice(0, 3).map(req => `
          <div style="background: white; border-radius: 8px; padding: 10px 14px; border: 1px solid #e2e8f0; margin-bottom: 8px; font-size: 0.78rem;">
            <div style="display: flex; justify-content: space-between;">
              <strong>${req.roomCode}</strong>
              <span class="status-pill ${req.status === 'active' ? 'occupied' : req.status === 'approved' ? 'available' : 'reserved'}">${req.status}</span>
            </div>
            <div style="color: #64748b; margin-top: 2px;">${req.purpose}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  bindMobileBorrowEvents() {
    const form = document.getElementById('mobileBorrowForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const room = document.getElementById('mobileReqRoomSelect').value;
        const purpose = document.getElementById('mobileReqPurpose').value;
        const duration = document.getElementById('mobileReqDuration').value;
        const faculty = document.getElementById('mobileReqFaculty').value;

        const newReq = window.KeyManager.submitBorrowRequest({
          roomCode: room,
          purpose: purpose,
          durationHours: duration,
          facultyEndorsement: faculty
        });

        if (window.SoundManager) window.SoundManager.playSuccess();
        this.showToast(`🎉 Borrow Request submitted for ${room}! Pending admin release.`, 'success');

        // Automatically switch to active view
        this.switchMobileTab('active');
      });
    }
  },

  getMobileActiveKeyHTML() {
    const user = window.appState.currentUser;
    const keys = window.appState.data.keys;
    
    // Find key held by this user or default sample active key
    let heldKey = keys.find(k => k.currentHolder && (k.currentHolder.name.includes(user.name.split(' ')[0]) || k.currentHolder.userId === user.id));

    // If not found, show the first borrowed key for demonstration purposes
    if (!heldKey) {
      heldKey = keys.find(k => k.status === 'borrowed' || k.status === 'overdue');
    }

    if (!heldKey || !heldKey.currentHolder) {
      return `
        <div style="text-align: center; padding: 40px 20px;">
          <span style="font-size: 3rem;">🔑</span>
          <h3 style="font-size: 1.1rem; color: var(--urs-navy-dark); margin: 12px 0 6px 0;">No Active Keys Checked Out</h3>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 18px;">
            You currently hold zero physical facility keys. Submit a borrow request or tap NFC reader.
          </p>
          <button class="btn btn-primary btn-sm" onclick="appUi.switchMobileTab('borrow')">
            Submit Borrow Request
          </button>
        </div>
      `;
    }

    const holder = heldKey.currentHolder;
    const isOverdue = heldKey.status === 'overdue';
    const qrSvg = window.QRNfcSimulator.generateQRSVG(`RUPAMS-PASS-${heldKey.keyId}-${holder.name}`, 160);

    return `
      <!-- Digital Pass Ticket Card -->
      <div class="digital-pass-card">
        <div class="pass-card-header">
          <div class="pass-crest-badge">URS Morong CIT • Digital Key Pass</div>
          <div class="pass-room-code">${heldKey.roomCode}</div>
          <div class="pass-room-name">${heldKey.label}</div>
        </div>

        <div class="pass-cutout-divider">
          <div class="pass-dash-line"></div>
        </div>

        <div class="pass-card-body">
          <div class="pass-countdown-container">
            <span class="pass-countdown-label">${isOverdue ? '⚠️ OVERDUE ELAPSED TIME' : '⏳ TIME REMAINING UNTIL DUE'}</span>
            <div class="pass-countdown-timer ${isOverdue ? 'overdue' : ''}" id="mobileActiveTimer">
              --:--:--
            </div>
          </div>

          <div class="pass-qr-box">
            ${qrSvg}
            <span style="font-size: 0.7rem; color: #64748b; margin-top: 6px;">Dynamic Security Token Verified</span>
          </div>

          <div class="pass-meta-grid">
            <div class="pass-meta-item">
              <label>Authorized Holder</label>
              <span>${holder.name}</span>
            </div>
            <div class="pass-meta-item">
              <label>Role / ID</label>
              <span>${holder.role}</span>
            </div>
            <div class="pass-meta-item">
              <label>Cabinet Hook</label>
              <span>${heldKey.cabinetSlot}</span>
            </div>
            <div class="pass-meta-item">
              <label>Due Time</label>
              <span>${new Date(holder.dueAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>

          <div style="margin-top: 18px; display: flex; flex-direction: column; gap: 8px;">
            <button class="btn btn-gold" id="btnMobileReturnKey" style="width: 100%;">
              📡 Simulate NFC Tap to Return Key
            </button>
            <button class="btn btn-outline btn-sm" onclick="QRNfcSimulator.openQrScannerModal()">
              📷 Show Key QR at Return Counter
            </button>
          </div>
        </div>
      </div>
    `;
  },

  bindMobileActiveKeyEvents() {
    const btnReturn = document.getElementById('btnMobileReturnKey');
    if (btnReturn) {
      btnReturn.addEventListener('click', () => {
        // Trigger NFC Tap modal for return
        window.QRNfcSimulator.openNfcTapModal('return');
      });
    }
  },

  updateActiveKeyTimer() {
    const timerEl = document.getElementById('mobileActiveTimer');
    if (!timerEl) return;

    const keys = window.appState.data.keys;
    const user = window.appState.currentUser;
    let heldKey = keys.find(k => k.currentHolder && (k.currentHolder.name.includes(user.name.split(' ')[0]) || k.currentHolder.userId === user.id));
    if (!heldKey) heldKey = keys.find(k => k.status === 'borrowed' || k.status === 'overdue');

    if (heldKey && heldKey.currentHolder && heldKey.currentHolder.dueAt) {
      const now = Date.now();
      const due = new Date(heldKey.currentHolder.dueAt).getTime();
      const diff = due - now;

      if (diff > 0) {
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        timerEl.classList.remove('overdue');
      } else {
        const late = Math.abs(diff);
        const mins = Math.floor(late / 60000);
        const secs = Math.floor((late % 60000) / 1000);
        timerEl.textContent = `+${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} LATE`;
        timerEl.classList.add('overdue');
      }
    }
  },

  getMobileScannerViewHTML() {
    return `
      <div style="margin-bottom: 14px;">
        <h3 style="font-size: 1.1rem; color: var(--urs-navy-dark); font-weight: 800;">Multi-Modal Key Scanner</h3>
        <p style="font-size: 0.78rem; color: #64748b;">NFC Identification & QR Code Validation.</p>
      </div>

      <div class="nfc-reader-scanner-box">
        <div class="nfc-wave-graphic">
          <div class="nfc-wave-ring"></div>
          <div class="nfc-wave-ring"></div>
          <div class="nfc-wave-ring"></div>
          <div class="nfc-center-icon">📡</div>
        </div>
        <h4 style="font-size: 1rem; color: var(--urs-gold); margin-bottom: 4px;">NFC Transceiver Ready</h4>
        <p style="font-size: 0.78rem; color: #cbd5e1; margin-bottom: 16px;">
          Hold device near smart key cabinet hook or physical CIT key tag.
        </p>
        <button class="btn btn-gold btn-sm" onclick="QRNfcSimulator.openNfcTapModal('checkout')">
          Simulate NFC Tag Tap
        </button>
      </div>

      <div style="background: white; border-radius: var(--radius-md); padding: 16px; border: 1px solid var(--border-color); text-align: center;">
        <h4 style="font-size: 0.95rem; color: var(--urs-navy); margin-bottom: 6px;">Camera QR Verification</h4>
        <p style="font-size: 0.75rem; color: #64748b; margin-bottom: 14px;">Scan borrower pass or room key QR token.</p>
        <button class="btn btn-primary btn-sm" onclick="QRNfcSimulator.openQrScannerModal()">
          📷 Open Camera Scanner
        </button>
      </div>
    `;
  },

  /* ==========================================================================
     Modal Windows
     ========================================================================== */
  openRoomDetailModal(roomCode) {
    const room = window.appState.getRoom(roomCode);
    const key = window.appState.getKey(roomCode);
    const modal = document.getElementById('genericDetailModal');
    if (!room || !modal) return;

    const titleEl = document.getElementById('genericModalTitle');
    const bodyEl = document.getElementById('genericModalBody');

    titleEl.textContent = `${room.code} - ${room.name}`;
    bodyEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <span class="status-pill ${room.status}">${room.status}</span>
        <span style="font-size: 0.8rem; color: #64748b;">Capacity: <strong>${room.capacity} Students</strong></span>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 0.85rem;">
        <div>📍 <strong>Location:</strong> ${room.building} (${room.floor})</div>
        <div>🔑 <strong>Key ID:</strong> ${key ? key.keyId : 'N/A'} (Cabinet ${key ? key.cabinetSlot : 'N/A'})</div>
        <div style="margin-top: 4px;">📡 <strong>NFC UID:</strong> <span style="font-family: monospace;">${key ? key.nfcUid : 'N/A'}</span></div>
      </div>

      <h5 style="font-size: 0.85rem; color: #334155; margin-bottom: 6px;">Laboratory Equipment & Infrastructure:</h5>
      <ul style="padding-left: 20px; font-size: 0.8rem; color: #64748b; margin-bottom: 16px;">
        ${(room.equipment || []).map(eq => `<li>${eq}</li>`).join('')}
      </ul>

      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        ${key && key.status === 'in_cabinet' ? `
          <button class="btn btn-primary btn-sm" onclick="appUi.closeModal('genericDetailModal'); appUi.openKeyActionModal('${key.keyId}')">
            Check-Out Key
          </button>
        ` : `
          <button class="btn btn-success btn-sm" onclick="appUi.closeModal('genericDetailModal'); window.KeyManager.returnKey('${key.keyId}', 'ADMIN_OVERRIDE')">
            Log Key Return
          </button>
        `}
      </div>
    `;

    modal.classList.add('active');
  },

  openKeyActionModal(keyId) {
    const key = window.appState.getKey(keyId);
    const modal = document.getElementById('genericDetailModal');
    if (!key || !modal) return;

    const titleEl = document.getElementById('genericModalTitle');
    const bodyEl = document.getElementById('genericModalBody');

    titleEl.textContent = `Physical Key Custody: ${key.keyId}`;
    bodyEl.innerHTML = `
      <div style="text-align: center; margin-bottom: 18px;">
        <span style="font-size: 2.5rem;">🔑</span>
        <h4 style="color: var(--urs-navy); font-size: 1.15rem;">${key.roomCode} Master Access Tag</h4>
        <span class="status-pill ${key.status}">${key.status}</span>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 14px; margin-bottom: 16px; font-size: 0.82rem;">
        <div>Cabinet Hook: <strong>${key.cabinetSlot}</strong></div>
        <div>NFC UID: <code>${key.nfcUid}</code></div>
        <div>All-time Handovers: <strong>${key.borrowHistoryCount} cycles</strong></div>
        ${key.currentHolder ? `
          <div style="margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
            <strong>Current Custody:</strong> ${key.currentHolder.name} (${key.currentHolder.role})<br>
            <strong>Contact:</strong> ${key.currentHolder.contact}<br>
            <strong>Due Time:</strong> ${new Date(key.currentHolder.dueAt).toLocaleTimeString()}
          </div>
        ` : ''}
      </div>

      <div style="display: flex; gap: 10px; justify-content: center;">
        <button class="btn btn-gold btn-sm" onclick="appUi.closeModal('genericDetailModal'); QRNfcSimulator.simulateNfcTap('${key.keyId}', '${key.status === 'in_cabinet' ? 'checkout' : 'return'}')">
          📡 Tap NFC Key Tag
        </button>
        <button class="btn btn-outline btn-sm" onclick="appUi.closeModal('genericDetailModal'); QRNfcSimulator.simulateQRScan('${key.keyId.includes('AUTO') ? 'key_auto_overdue' : 'key_cit101'}')">
          📷 Scan Key QR Tag
        </button>
      </div>
    `;

    modal.classList.add('active');
  },

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
    this.showToast(`Switched active user to ${window.appState.currentUser.name} (${roleKey.toUpperCase()})`, 'info');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : type === 'error' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
};

window.appUi = appUi;

// Auto initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  appUi.init();
});
