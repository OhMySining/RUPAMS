/**
 * RUPAMS - Smart Collision Prevention & Scheduling Engine
 * Enforces zero room overlap, zero instructor conflict, zero student section clash, and room capacity constraints.
 * College of Industrial Technology (CIT) - URS Morong Campus
 */

const ScheduleEngine = {
  DAYS: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],

  /**
   * Helper: Convert 24h HH:mm string to 12-hour format with AM/PM
   * e.g., "07:30" -> "07:30 AM", "13:30" -> "01:30 PM"
   */
  to12Hour(timeStr) {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const hStr = h < 10 ? '0' + h : '' + h;
    return `${hStr}:${m} ${ampm}`;
  },

  /**
   * Helper: Format a time interval to 12-hour format
   * e.g., ("07:30", "10:30") -> "07:30 AM - 10:30 AM"
   */
  formatRange(start, end) {
    if (!start && !end) return '';
    if (!end) return this.to12Hour(start);
    return `${this.to12Hour(start)} - ${this.to12Hour(end)}`;
  },

  /**
   * Helper: Convert HH:mm to minutes from midnight
   */
  timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hh, mm] = timeStr.split(':').map(Number);
    return hh * 60 + mm;
  },

  /**
   * Helper: Check if two time intervals overlap
   */
  isOverlapping(startA, endA, startB, endB) {
    const sA = this.timeToMinutes(startA);
    const eA = this.timeToMinutes(endA);
    const sB = this.timeToMinutes(startB);
    const eB = this.timeToMinutes(endB);
    return Math.max(sA, sB) < Math.min(eA, eB);
  },

  /**
   * Core Collision Detection Validator
   * Validates a candidate schedule record against all committed schedules in state.
   * Supports both complete and incremental/real-time field checking.
   *
   * @param {Object} candidate - { roomCode, day, startTime, endTime, facultyId, facultyName, program, year, section, courseCode, enrolled }
   * @param {string|null} excludeScheduleId - ID of schedule to ignore (for edits)
   * @returns {Object} { isValid: boolean, errors: string[], conflictTypes: Object }
   */
  validateSchedule(candidate, excludeScheduleId = null) {
    const errors = [];
    const conflictTypes = {
      time: false,
      capacity: false,
      room: false,
      faculty: false,
      section: false
    };

    const schedules = (window.appState && window.appState.data && window.appState.data.schedules) ? window.appState.data.schedules : [];

    // 1. Time interval validation
    let hasValidTime = false;
    if (candidate.startTime && candidate.endTime) {
      const sMin = this.timeToMinutes(candidate.startTime);
      const eMin = this.timeToMinutes(candidate.endTime);

      if (eMin <= sMin) {
        errors.push("Invalid Time Interval: End time must be strictly after start time.");
        conflictTypes.time = true;
      } else if (eMin - sMin < 30) {
        errors.push("Minimum Duration Error: Scheduled periods must be at least 30 minutes.");
        conflictTypes.time = true;
      } else {
        hasValidTime = true;
      }
    }

    // 2. Room Capacity validation
    if (candidate.roomCode && candidate.enrolled) {
      const room = window.appState && window.appState.getRoom ? window.appState.getRoom(candidate.roomCode) : null;
      const enrolledNum = Number(candidate.enrolled) || 0;
      if (room && enrolledNum > room.capacity) {
        errors.push(`Room Capacity Exceeded: Facility ${candidate.roomCode} maximum capacity is ${room.capacity} seats, but enrollment is set to ${enrolledNum}.`);
        conflictTypes.capacity = true;
      }
    }

    // 3. Collision Detection against active committed schedules
    if (candidate.day && candidate.startTime && candidate.endTime && hasValidTime) {
      for (const item of schedules) {
        if (excludeScheduleId && item.id === excludeScheduleId) continue;
        if (item.day !== candidate.day) continue;

        if (this.isOverlapping(candidate.startTime, candidate.endTime, item.startTime, item.endTime)) {
          const timeRangeStr = this.formatRange(item.startTime, item.endTime);

          // Room Double-Occupancy Collision
          if (candidate.roomCode && item.roomCode === candidate.roomCode) {
            errors.push(`Room Double-Occupancy Conflict: Facility ${candidate.roomCode} is already booked on ${candidate.day} by "${item.courseCode} (${item.section})" with ${item.facultyName} from ${timeRangeStr}.`);
            conflictTypes.room = true;
          }

          // Faculty Overlap / Workload Conflict
          const facultyMatch = (candidate.facultyId && item.facultyId && candidate.facultyId === item.facultyId) ||
                               (candidate.facultyName && item.facultyName && candidate.facultyName.trim().toLowerCase() === item.facultyName.trim().toLowerCase());
          if (facultyMatch) {
            errors.push(`Faculty Workload Conflict: Instructor ${item.facultyName} is already assigned to teach "${item.courseCode}" in room ${item.roomCode} on ${candidate.day} from ${timeRangeStr}.`);
            conflictTypes.faculty = true;
          }

          // Student Section Clash
          if (candidate.program && candidate.year && candidate.section) {
            const candSection = `${candidate.program} - ${candidate.year} - ${candidate.section}`.toLowerCase();
            const itemSection = `${item.program || ''} - ${item.year || ''} - ${item.section || ''}`.toLowerCase();

            if (candSection === itemSection) {
              errors.push(`Student Section Clash: Year and Section "${candidate.year} - ${candidate.section} (${candidate.program})" is already scheduled in room ${item.roomCode} for "${item.courseCode}" on ${candidate.day} from ${timeRangeStr}.`);
              conflictTypes.section = true;
            }
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      conflictTypes: conflictTypes
    };
  },

  /**
   * Helper: Determine the course session state for a room
   * (ongoing class, upcoming session today, next scheduled session, or vacant)
   * with respect to committed schedules.
   */
  getRoomSessionInfo(roomCode, refDate = null) {
    const now = refDate || new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = dayNames[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const schedules = (window.appState && window.appState.data && window.appState.data.schedules) ? window.appState.data.schedules : [];
    const roomSchedules = schedules.filter(s => s.roomCode === roomCode);

    if (roomSchedules.length === 0) {
      return {
        status: 'vacant',
        isOngoing: false,
        hasSession: false,
        text: 'No class currently occupying facility.'
      };
    }

    // Filter today's schedules sorted by start time
    const todaySchedules = roomSchedules
      .filter(s => s.day === currentDay)
      .sort((a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime));

    // 1. Is there an ongoing session right now?
    const ongoing = todaySchedules.find(s => {
      const sMin = this.timeToMinutes(s.startTime);
      const eMin = this.timeToMinutes(s.endTime);
      return currentMinutes >= sMin && currentMinutes <= eMin;
    });

    if (ongoing) {
      return {
        status: 'ongoing',
        isOngoing: true,
        hasSession: true,
        session: ongoing,
        badgeText: 'Occupied • In Session',
        badgeClass: 'occupied',
        headline: `${ongoing.courseCode} - ${ongoing.courseTitle}`,
        faculty: ongoing.facultyName,
        section: `${ongoing.year} - ${ongoing.section} (${ongoing.program})`,
        timeStr: this.formatRange(ongoing.startTime, ongoing.endTime),
        day: ongoing.day
      };
    }

    // 2. Is there an upcoming session today?
    const upcomingToday = todaySchedules.find(s => this.timeToMinutes(s.startTime) > currentMinutes);
    if (upcomingToday) {
      return {
        status: 'upcoming_today',
        isOngoing: false,
        hasSession: true,
        session: upcomingToday,
        badgeText: `Available (Class at ${this.to12Hour(upcomingToday.startTime)})`,
        badgeClass: 'available',
        headline: `${upcomingToday.courseCode} - ${upcomingToday.courseTitle}`,
        faculty: upcomingToday.facultyName,
        section: `${upcomingToday.year} - ${upcomingToday.section} (${upcomingToday.program})`,
        timeStr: this.formatRange(upcomingToday.startTime, upcomingToday.endTime),
        day: upcomingToday.day
      };
    }

    // 3. Find the next scheduled session in the coming days
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const curIdx = dayOrder.indexOf(currentDay);
    let nextSession = null;

    for (let offset = 1; offset <= 7; offset++) {
      const targetDay = dayOrder[(curIdx + offset) % dayOrder.length];
      const matches = roomSchedules
        .filter(s => s.day === targetDay)
        .sort((a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime));
      if (matches.length > 0) {
        nextSession = matches[0];
        break;
      }
    }

    if (!nextSession && roomSchedules.length > 0) {
      nextSession = roomSchedules[0];
    }

    if (nextSession) {
      return {
        status: 'upcoming_next',
        isOngoing: false,
        hasSession: true,
        session: nextSession,
        badgeText: 'Available',
        badgeClass: 'available',
        headline: `${nextSession.courseCode} - ${nextSession.courseTitle}`,
        faculty: nextSession.facultyName,
        section: `${nextSession.year} - ${nextSession.section} (${nextSession.program})`,
        timeStr: `${nextSession.day} • ${this.formatRange(nextSession.startTime, nextSession.endTime)}`,
        day: nextSession.day
      };
    }

    return {
      status: 'vacant',
      isOngoing: false,
      hasSession: false,
      text: 'No class currently occupying facility.'
    };
  },

  /**
   * Commit manual schedule record with constraint enforcement
   */
  addManualSchedule(formData) {
    const validation = this.validateSchedule(formData);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const newId = `SCH-${Date.now().toString().slice(-4)}`;
    const newSchedule = {
      id: newId,
      ...formData,
      enrolled: Number(formData.enrolled) || 30
    };

    window.appState.addSchedule(newSchedule);
    return { success: true, schedule: newSchedule };
  }
};

// Export to both namespaces for absolute reliability
window.ScheduleEngine = ScheduleEngine;
window.SchedulerEngine = ScheduleEngine;
