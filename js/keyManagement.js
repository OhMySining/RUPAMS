/**
 * RUPAMS - Digital Key Registry, Automated Overdue Tracker & Incident Forensic Engine
 * College of Industrial Technology (CIT) - University of Rizal System Morong Campus
 */

const KeyManager = {
  monitorInterval: null,
  lastOverdueAlertCount: 0,

  init() {
    this.startOverdueMonitor();
  },

  /**
   * Continuous Background Monitoring Scheduler
   * Automatically flags overdue keys and dispatches alerts to administrators and faculty.
   */
  startOverdueMonitor() {
    if (this.monitorInterval) clearInterval(this.monitorInterval);
    
    // Check every 4 seconds
    this.monitorInterval = setInterval(() => {
      this.checkOverdueStatus();
    }, 4000);
  },

  checkOverdueStatus() {
    const data = window.appState.data;
    if (!data || !data.keys) return;

    const now = Date.now();
    let newlyOverdueCount = 0;
    let totalOverdue = 0;

    data.keys.forEach(key => {
      if (key.status === 'borrowed' && key.currentHolder && key.currentHolder.dueAt) {
        const dueTime = new Date(key.currentHolder.dueAt).getTime();
        if (now > dueTime) {
          // Key has become overdue!
          key.status = 'overdue';
          
          // Also flag room
          const room = window.appState.getRoom(key.roomCode);
          if (room) {
            room.status = 'overdue';
            if (room.currentOccupant) {
              room.currentOccupant.keyStatus = 'overdue';
            }
          }

          // Log immutable audit entry if not already logged
          const existingOverdueLog = data.auditLogs.find(l => 
            l.keyId === key.keyId && 
            l.eventType === 'KEY_OVERDUE' && 
            new Date(l.timestamp).getTime() > dueTime - 60000
          );

          if (!existingOverdueLog) {
            const minutesLate = Math.round((now - dueTime) / 60000);
            window.appState.addAuditLog({
              eventType: 'KEY_OVERDUE',
              roomCode: key.roomCode,
              keyId: key.keyId,
              actorName: key.currentHolder.name,
              actorId: key.currentHolder.userId,
              actorRole: key.currentHolder.role,
              verificationMode: 'SYSTEM_AUTO',
              details: `OVERDUE ALERT: Facility key for ${key.roomCode} is +${minutesLate} mins overdue. Borrower: ${key.currentHolder.name} (${key.currentHolder.contact}).`
            });
            newlyOverdueCount++;
          }
        }
      }

      if (key.status === 'overdue') {
        totalOverdue++;
      }
    });

    if (newlyOverdueCount > 0) {
      if (window.SoundManager) window.SoundManager.playOverdueAlarm();
      window.appState.emit('overdueAlarmTriggered', { newlyOverdueCount, totalOverdue });
      window.appState.save();
    }
  },

  /**
   * Submit Key Borrow Request (Mobile Portal)
   */
  submitBorrowRequest(reqData) {
    const data = window.appState.data;
    const newReqId = `REQ-2026-${Math.floor(Math.random() * 899 + 100)}`;
    
    const newRequest = {
      requestId: newReqId,
      requesterId: reqData.requesterId || window.appState.currentUser.id,
      requesterName: reqData.requesterName || window.appState.currentUser.name,
      role: reqData.role || window.appState.currentUser.role,
      studentId: reqData.studentId || (reqData.role === 'student' ? '2024-0012-MR' : null),
      roomCode: reqData.roomCode,
      purpose: reqData.purpose,
      date: reqData.date || new Date().toISOString().split('T')[0],
      startTime: reqData.startTime || "10:00",
      durationHours: Number(reqData.durationHours) || 2,
      facultyEndorsement: reqData.facultyEndorsement || "CIT Program Head",
      status: "pending",
      keyIssued: null,
      submittedAt: new Date().toISOString()
    };

    data.requests.unshift(newRequest);

    window.appState.addAuditLog({
      eventType: "REQUEST_SUBMITTED",
      roomCode: reqData.roomCode,
      keyId: "N/A",
      actorName: newRequest.requesterName,
      actorId: newRequest.requesterId,
      actorRole: newRequest.role,
      verificationMode: "MOBILE_PORTAL",
      details: `Digital key borrowing request submitted for ${reqData.roomCode}. Purpose: ${reqData.purpose}. Duration: ${reqData.durationHours} hrs.`
    });

    window.appState.save();
    window.appState.emit('requestAdded', newRequest);
    return newRequest;
  },

  /**
   * Approve Borrow Request (Admin Portal)
   */
  approveBorrowRequest(requestId) {
    const data = window.appState.data;
    const req = data.requests.find(r => r.requestId === requestId);
    if (!req) return { success: false, error: "Request not found" };

    const key = data.keys.find(k => k.roomCode === req.roomCode);
    if (!key) return { success: false, error: "No physical key registered for this room" };

    req.status = "approved";
    req.keyIssued = key.keyId;

    window.appState.addAuditLog({
      eventType: "REQUEST_APPROVED",
      roomCode: req.roomCode,
      keyId: key.keyId,
      actorName: window.appState.currentUser.name,
      actorId: window.appState.currentUser.id,
      actorRole: window.appState.currentUser.role,
      verificationMode: "ADMIN_PORTAL",
      details: `Approved key request #${req.requestId} for ${req.requesterName} (${req.role}). Ready for NFC/QR handover.`
    });

    window.appState.save();
    window.appState.emit('requestApproved', req);
    return { success: true, request: req };
  },

  /**
   * Reject Borrow Request (Admin Portal)
   */
  rejectBorrowRequest(requestId, reason = "Facility unavailable or scheduling overlap") {
    const data = window.appState.data;
    const req = data.requests.find(r => r.requestId === requestId);
    if (!req) return { success: false, error: "Request not found" };

    req.status = "rejected";
    req.rejectionReason = reason;

    window.appState.addAuditLog({
      eventType: "REQUEST_REJECTED",
      roomCode: req.roomCode,
      keyId: "N/A",
      actorName: window.appState.currentUser.name,
      actorId: window.appState.currentUser.id,
      actorRole: window.appState.currentUser.role,
      verificationMode: "ADMIN_PORTAL",
      details: `Rejected key request #${req.requestId} for ${req.roomCode}. Reason: ${reason}`
    });

    window.appState.save();
    window.appState.emit('requestRejected', req);
    return { success: true };
  },

  /**
   * Digital Key Checkout Handler (Multi-Modal: NFC Tap, QR Scan, or Admin Desk)
   */
  checkoutKey(roomCodeOrKeyId, borrowerInfo, verificationMode = "NFC_TAP") {
    const data = window.appState.data;
    const key = data.keys.find(k => k.keyId === roomCodeOrKeyId || k.roomCode === roomCodeOrKeyId);
    if (!key) return { success: false, error: "Key not found in registry" };

    if (key.status === 'borrowed' || key.status === 'overdue') {
      return { 
        success: false, 
        error: `Key ${key.keyId} is already in possession of ${key.currentHolder?.name || 'another borrower'}. Must be returned first!` 
      };
    }

    const room = window.appState.getRoom(key.roomCode);
    const checkoutTime = new Date();
    const durationHours = borrowerInfo.durationHours || 2;
    const dueTime = new Date(checkoutTime.getTime() + durationHours * 3600 * 1000);

    // Update Key
    key.status = 'borrowed';
    key.borrowHistoryCount = (key.borrowHistoryCount || 0) + 1;
    key.currentHolder = {
      userId: borrowerInfo.userId || borrowerInfo.studentId || "USER-" + Date.now().toString(36),
      name: borrowerInfo.name,
      role: borrowerInfo.role || "Student",
      contact: borrowerInfo.contact || "N/A",
      purpose: borrowerInfo.purpose || "Academic Laboratory Session",
      facultyEndorser: borrowerInfo.facultyEndorsement || "CIT Department Chair",
      checkedOutAt: checkoutTime.toISOString(),
      dueAt: dueTime.toISOString(),
      verificationMode: verificationMode,
      requestId: borrowerInfo.requestId || null
    };

    // Update Room Status
    if (room) {
      room.status = 'occupied';
      room.currentOccupant = {
        name: borrowerInfo.name,
        role: borrowerInfo.role || "Student",
        course: borrowerInfo.purpose,
        startTime: checkoutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        expectedEnd: dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        keyStatus: 'borrowed'
      };
    }

    // Update request state if linked
    if (borrowerInfo.requestId) {
      const req = data.requests.find(r => r.requestId === borrowerInfo.requestId);
      if (req) req.status = 'active';
    }

    // Immutable Audit Trail
    window.appState.addAuditLog({
      eventType: "KEY_CHECKOUT",
      roomCode: key.roomCode,
      keyId: key.keyId,
      actorName: borrowerInfo.name,
      actorId: borrowerInfo.userId || "N/A",
      actorRole: borrowerInfo.role || "Borrower",
      verificationMode: verificationMode,
      nfcUid: verificationMode === 'NFC_TAP' ? key.nfcUid : null,
      details: `Key [${key.keyId}] checked out via ${verificationMode}. Facility: ${key.roomCode}. Due: ${dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
    });

    if (window.SoundManager) {
      if (verificationMode === 'NFC_TAP') window.SoundManager.playNfcTap();
      else if (verificationMode === 'QR_SCAN') window.SoundManager.playQrScan();
      else window.SoundManager.playSuccess();
    }

    window.appState.save();
    window.appState.emit('keyCheckedOut', { key, room });
    return { success: true, key, room };
  },

  /**
   * Digital Key Return Handler (Check-in via NFC cabinet slot, QR scan, or admin desk)
   */
  returnKey(roomCodeOrKeyId, verificationMode = "NFC_TAP") {
    const data = window.appState.data;
    const key = data.keys.find(k => k.keyId === roomCodeOrKeyId || k.roomCode === roomCodeOrKeyId);
    if (!key) return { success: false, error: "Key not found in registry" };

    if (key.status === 'in_cabinet') {
      return { success: false, error: `Key ${key.keyId} is already in the cabinet.` };
    }

    const previousHolder = key.currentHolder ? { ...key.currentHolder } : { name: "Unknown", role: "Borrower" };
    const room = window.appState.getRoom(key.roomCode);
    const returnTime = new Date();
    const wasOverdue = key.status === 'overdue' || (previousHolder.dueAt && returnTime.getTime() > new Date(previousHolder.dueAt).getTime());

    // Restore Key to Cabinet
    key.status = 'in_cabinet';
    key.currentHolder = null;

    // Restore Room Status
    if (room) {
      room.currentOccupant = null;
      // If there is currently a scheduled published class, set to occupied; otherwise available
      room.status = room.activeSchedule ? 'occupied' : 'available';
    }

    // If there was a linked request, mark returned
    if (previousHolder.requestId) {
      const req = data.requests.find(r => r.requestId === previousHolder.requestId);
      if (req) req.status = 'returned';
    }

    // Immutable Audit Trail
    window.appState.addAuditLog({
      eventType: "KEY_RETURN",
      roomCode: key.roomCode,
      keyId: key.keyId,
      actorName: previousHolder.name,
      actorId: previousHolder.userId || "N/A",
      actorRole: previousHolder.role || "Borrower",
      verificationMode: verificationMode,
      nfcUid: verificationMode === 'NFC_TAP' ? key.nfcUid : null,
      details: `Key [${key.keyId}] returned to Cabinet ${key.cabinetSlot} via ${verificationMode}. ${wasOverdue ? 'NOTE: Returned with OVERDUE penalty note.' : 'Returned on schedule.'}`
    });

    if (window.SoundManager) {
      window.SoundManager.playSuccess();
    }

    window.appState.save();
    window.appState.emit('keyReturned', { key, room, wasOverdue });
    return { success: true, key, room, wasOverdue };
  },

  /**
   * Rapid Incident Tracing & Digital History Logs
   * Enables administrators to filter and query historical access logs by room,
   * date, or time to immediately trace who held the key during specific operational windows.
   */
  queryIncidentLogs(filters = {}) {
    const logs = window.appState.data.auditLogs || [];
    const { roomCode, startDate, endDate, eventType, keyword } = filters;

    const filtered = logs.filter(log => {
      // Room filter
      if (roomCode && roomCode !== 'ALL' && log.roomCode !== roomCode) {
        return false;
      }

      // Event Type filter
      if (eventType && eventType !== 'ALL' && log.eventType !== eventType) {
        return false;
      }

      // Date range filter
      if (startDate) {
        const logTime = new Date(log.timestamp).getTime();
        const start = new Date(startDate).getTime();
        if (logTime < start) return false;
      }
      if (endDate) {
        const logTime = new Date(log.timestamp).getTime();
        const end = new Date(endDate).getTime();
        if (logTime > end) return false;
      }

      // Keyword filter (person name, ID, purpose details)
      if (keyword && keyword.trim() !== '') {
        const term = keyword.toLowerCase();
        const matchesActor = (log.actorName || '').toLowerCase().includes(term);
        const matchesDetails = (log.details || '').toLowerCase().includes(term);
        const matchesKey = (log.keyId || '').toLowerCase().includes(term);
        if (!matchesActor && !matchesDetails && !matchesKey) return false;
      }

      return true;
    });

    // Generate Incident Summary
    const uniqueActors = [...new Set(filtered.map(l => l.actorName).filter(Boolean))];
    const checkoutCount = filtered.filter(l => l.eventType === 'KEY_CHECKOUT').length;
    const overdueCount = filtered.filter(l => l.eventType === 'KEY_OVERDUE').length;

    return {
      totalRecords: filtered.length,
      logs: filtered,
      summary: {
        room: roomCode || 'All Facilities',
        uniquePersonnel: uniqueActors,
        checkouts: checkoutCount,
        overdueIncidents: overdueCount
      }
    };
  }
};

window.KeyManager = KeyManager;
