/**
 * RUPAMS - Manual Schedule Creation Engine with Constraint Enforcement
 * & Automated Spreadsheet Output Module
 * College of Industrial Technology (CIT) - URS Morong Campus
 */

const SchedulerEngine = {
  DAYS: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],

  TIME_SLOTS: [
    { start: "07:30", end: "10:30", label: "07:30 AM - 10:30 AM" },
    { start: "10:30", end: "13:30", label: "10:30 AM - 01:30 PM" },
    { start: "13:30", end: "16:30", label: "01:30 PM - 04:30 PM" },
    { start: "16:30", end: "19:30", label: "04:30 PM - 07:30 PM" }
  ],

  timeToMinutes(timeStr) {
    if (typeof timeStr !== 'string') return NaN;
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeStr);
    if (!match) return NaN;
    const [, hours, minutes] = match;
    const h = Number(hours);
    const m = Number(minutes);
    return h * 60 + m;
  },

  isOverlapping(start1, end1, start2, end2) {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);
    return Math.max(s1, s2) < Math.min(e1, e2);
  },

  /**
   * Real-Time Constraint Enforcement
   * Verifies against all active database constraints before a manual schedule is committed.
   */
  validateSchedule(candidate, excludeScheduleId = null) {
    const schedules = window.appState.data.schedules || [];
    const rooms = window.appState.data.rooms || [];
    const facultyList = window.appState.data.faculty || [];

    const errors = [];
    const candidateRoom = rooms.find(r => r.code === candidate.roomCode);
    const candidateFaculty = facultyList.find(f => f.id === candidate.facultyId);

    const startMinutes = this.timeToMinutes(candidate.startTime);
    const endMinutes = this.timeToMinutes(candidate.endTime);
    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || startMinutes >= endMinutes) {
      errors.push('Invalid Schedule Time: Choose a valid start time and an end time later than the start.');
    }

    // 1. Capacity Constraint
    if (candidateRoom && candidate.enrolled && candidate.enrolled > candidateRoom.capacity) {
      errors.push(`Room Capacity Exceeded: ${candidateRoom.name} holds max ${candidateRoom.capacity} students, but section enrollment is ${candidate.enrolled}.`);
    }

    // 2. Overlap Constraints against all existing schedules
    for (const item of schedules) {
      if (excludeScheduleId && item.id === excludeScheduleId) continue;
      if (item.day !== candidate.day) continue;

      if (this.isOverlapping(candidate.startTime, candidate.endTime, item.startTime, item.endTime)) {
        // Room Collision
        if (item.roomCode === candidate.roomCode) {
          errors.push(`Room Double-Occupancy Conflict: Facility ${candidate.roomCode} is already booked by "${item.courseCode} (${item.section})" with ${item.facultyName} from ${item.startTime} to ${item.endTime}.`);
        }

        // Faculty Overlap
        if (item.facultyId === candidate.facultyId) {
          errors.push(`Faculty Schedule Overlap: Instructor ${item.facultyName} is already assigned to teach "${item.courseCode}" in room ${item.roomCode} from ${item.startTime} to ${item.endTime}.`);
        }

        // Section Overlap
        const candidateCohort = `${candidate.program || ''} - ${candidate.year || ''} - ${candidate.section || ''}`.toLowerCase();
        const itemCohort = `${item.program || ''} - ${item.year || ''} - ${item.section || ''}`.toLowerCase();

        if (candidateCohort && itemCohort && candidateCohort === itemCohort) {
          errors.push(`Student Section Clash: Cohort "${candidate.program} (${candidate.year} - ${candidate.section})" is already scheduled in room ${item.roomCode} for "${item.courseCode}" from ${item.startTime} to ${item.endTime}.`);
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
    const scheduleItem = {
      id: newId,
      ...formData
    };

    window.appState.addSchedule(scheduleItem);
    return { success: true, schedule: scheduleItem };
  }
};

window.SchedulerEngine = SchedulerEngine;
