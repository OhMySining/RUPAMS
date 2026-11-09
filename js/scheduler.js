/**
 * RUPAMS - Smart Collision Prevention & Scheduling Engine
 * Enforces zero room overlap, zero instructor conflict, and zero student section clash.
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
   *
   * @param {Object} candidate - { roomCode, day, startTime, endTime, facultyId, facultyName, program, year, section, courseCode }
   * @param {string|null} excludeScheduleId - ID of schedule to ignore (for edits)
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validateSchedule(candidate, excludeScheduleId = null) {
    const errors = [];
    const schedules = window.appState.data.schedules || [];

    // Basic logic validation
    const sMin = this.timeToMinutes(candidate.startTime);
    const eMin = this.timeToMinutes(candidate.endTime);

    if (eMin <= sMin) {
      errors.push("Invalid Time Interval: End time must be after start time.");
    }
    if (eMin - sMin < 30) {
      errors.push("Minimum Duration Error: Scheduled periods must be at least 30 minutes.");
    }

    // Check collisions against active schedules
    for (const item of schedules) {
      if (excludeScheduleId && item.id === excludeScheduleId) continue;
      if (item.day !== candidate.day) continue;

      if (this.isOverlapping(candidate.startTime, candidate.endTime, item.startTime, item.endTime)) {
        const timeRangeStr = this.formatRange(item.startTime, item.endTime);

        // Room Collision
        if (item.roomCode === candidate.roomCode) {
          errors.push(`Room Double-Occupancy Conflict: Facility ${candidate.roomCode} is already booked by "${item.courseCode} (${item.section})" with ${item.facultyName} from ${timeRangeStr}.`);
        }

        // Faculty Overlap
        if (item.facultyId === candidate.facultyId) {
          errors.push(`Faculty Schedule Overlap: Instructor ${item.facultyName} is already assigned to teach "${item.courseCode}" in room ${item.roomCode} from ${timeRangeStr}.`);
        }

        // Section Overlap
        const candidateYearSection = `${candidate.program || ''} - ${candidate.year || ''} - ${candidate.section || ''}`.toLowerCase();
        const itemYearSection = `${item.program || ''} - ${item.year || ''} - ${item.section || ''}`.toLowerCase();

        if (candidateYearSection && itemYearSection && candidateYearSection === itemYearSection) {
          errors.push(`Student Section Clash: Year and Section "${candidate.program} (${candidate.year} - ${candidate.section})" is already scheduled in room ${item.roomCode} for "${item.courseCode}" from ${timeRangeStr}.`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
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
