/**
 * RUPAMS - Automated Timetable Generation & Real-Time Conflict Detection Engine
 * College of Industrial Technology (CIT) - University of Rizal System Morong Campus
 */

const SchedulerEngine = {
  DAYS: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  
  // Standard CIT 3-hour and 2-hour technical time blocks
  TIME_SLOTS: [
    { start: "07:30", end: "10:30", label: "07:30 AM - 10:30 AM (Morning Lab Block)" },
    { start: "10:30", end: "13:30", label: "10:30 AM - 01:30 PM (Midday Technical Block)" },
    { start: "13:30", end: "16:30", label: "01:30 PM - 04:30 PM (Afternoon Lab Block)" },
    { start: "16:30", end: "19:30", label: "04:30 PM - 07:30 PM (Evening Extension Block)" }
  ],

  // Convert "HH:MM" to minutes from midnight
  timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  },

  // Check if two intervals [start1, end1] and [start2, end2] overlap
  isOverlapping(start1, end1, start2, end2) {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);
    return Math.max(s1, s2) < Math.min(e1, e2);
  },

  /**
   * Real-Time Conflict Detection Engine
   * Validates a proposed schedule against existing database constraints.
   * Prevents:
   * 1. Room Double-Occupancy (overlap in the same facility)
   * 2. Faculty Overlap (instructor assigned in two places simultaneously)
   * 3. Section Overlap (same class section double-booked)
   * 4. Capacity Deficiency (section enrollment exceeds physical room capacity)
   */
  checkConflicts(candidate, excludeScheduleId = null) {
    const schedules = window.appState.data.schedules || [];
    const rooms = window.appState.data.rooms || [];
    const facultyList = window.appState.data.faculty || [];
    
    const conflicts = [];
    const candidateRoom = rooms.find(r => r.code === candidate.roomCode);
    const candidateFaculty = facultyList.find(f => f.id === candidate.facultyId);

    // 1. Check Capacity Deficiency
    if (candidateRoom && candidate.enrolled && candidate.enrolled > candidateRoom.capacity) {
      conflicts.push({
        type: 'CAPACITY_OVERFLOW',
        severity: 'warning',
        title: 'Room Capacity Exceeded',
        message: `Class section size (${candidate.enrolled} students) exceeds ${candidateRoom.name} capacity (${candidateRoom.capacity} seats).`
      });
    }

    // Check each active schedule
    for (const item of schedules) {
      if (excludeScheduleId && item.id === excludeScheduleId) continue;
      
      // Must be on the same day to overlap
      if (item.day !== candidate.day) continue;

      // Time overlap check
      if (this.isOverlapping(candidate.startTime, candidate.endTime, item.startTime, item.endTime)) {
        // Room Conflict: Double-Occupancy
        if (item.roomCode === candidate.roomCode) {
          conflicts.push({
            type: 'ROOM_COLLISION',
            severity: 'danger',
            title: 'Room Double-Occupancy Detected',
            message: `Facility ${candidate.roomCode} is already booked by "${item.courseCode} (${item.section})" with ${item.facultyName} from ${item.startTime} to ${item.endTime}.`,
            collidingSchedule: item
          });
        }

        // Faculty Conflict: Overlapping Assignment
        if (item.facultyId === candidate.facultyId) {
          conflicts.push({
            type: 'FACULTY_COLLISION',
            severity: 'danger',
            title: 'Faculty Overlap Detected',
            message: `Instructor ${item.facultyName} is already assigned to teach "${item.courseCode}" in room ${item.roomCode} from ${item.startTime} to ${item.endTime}.`,
            collidingSchedule: item
          });
        }

        // Section Conflict: Double-booked student cohort
        if (candidate.section && item.section && candidate.section === item.section) {
          conflicts.push({
            type: 'SECTION_COLLISION',
            severity: 'danger',
            title: 'Section Double-Booking Detected',
            message: `Class section "${candidate.section}" is already scheduled for "${item.courseCode}" in room ${item.roomCode} from ${item.startTime} to ${item.endTime}.`,
            collidingSchedule: item
          });
        }
      }
    }

    const hasDanger = conflicts.some(c => c.severity === 'danger');
    return {
      hasConflict: hasDanger,
      warningsOnly: conflicts.length > 0 && !hasDanger,
      conflicts
    };
  },

  /**
   * Automated Timetable Generation Module
   * Eliminates manual plotting in Excel. Ingests faculty workloads, CIT rooms,
   * course requirements, and constraint parameters to dynamically compute
   * an optimized, conflict-free timetable with a single click.
   */
  generateOptimizedTimetable() {
    const data = window.appState.data;
    const courses = [...data.courses];
    const rooms = [...data.rooms];
    const faculty = [...data.faculty];
    const newSchedules = [];

    // Sort courses by constraint difficulty (Specialized Labs first, high enrollment first)
    courses.sort((a, b) => {
      const isSpecA = a.roomType !== 'Lecture' ? 1 : 0;
      const isSpecB = b.roomType !== 'Lecture' ? 1 : 0;
      if (isSpecA !== isSpecB) return isSpecB - isSpecA;
      return b.enrolled - a.enrolled;
    });

    let scheduleCounter = 1;
    const unallocated = [];

    // Helper to find eligible rooms for course type
    const getEligibleRooms = (course) => {
      let eligible = rooms.filter(r => r.type === course.roomType && r.capacity >= course.enrolled);
      if (eligible.length === 0) {
        // Fallback for lecture or general labs
        eligible = rooms.filter(r => r.capacity >= course.enrolled);
      }
      return eligible;
    };

    // Constraint satisfaction solver loop
    for (const course of courses) {
      const courseFaculty = faculty.find(f => f.id === course.facultyId) || { name: "Assigned CIT Faculty" };
      const eligibleRooms = getEligibleRooms(course);
      
      let placed = false;
      
      // Preferred days order (if faculty specified preferred days, check those first)
      const daysToTest = courseFaculty.preferredDays && courseFaculty.preferredDays.length > 0
        ? [...courseFaculty.preferredDays, ...this.DAYS.filter(d => !courseFaculty.preferredDays.includes(d))]
        : this.DAYS;

      roomLoop:
      for (const room of eligibleRooms) {
        for (const day of daysToTest) {
          for (const slot of this.TIME_SLOTS) {
            const candidate = {
              id: `SCH-GEN-${String(scheduleCounter).padStart(3, '0')}`,
              courseCode: course.code,
              courseTitle: course.title,
              facultyId: course.facultyId,
              facultyName: courseFaculty.name,
              roomCode: room.code,
              day: day,
              startTime: slot.start,
              endTime: slot.end,
              section: course.section,
              enrolled: course.enrolled,
              status: 'draft'
            };

            // Check if this candidate collides with already placed schedules in this run
            const hasCollision = newSchedules.some(existing => {
              if (existing.day !== candidate.day) return false;
              if (!this.isOverlapping(candidate.startTime, candidate.endTime, existing.startTime, existing.endTime)) return false;
              return (
                existing.roomCode === candidate.roomCode ||
                existing.facultyId === candidate.facultyId ||
                existing.section === candidate.section
              );
            });

            if (!hasCollision) {
              newSchedules.push(candidate);
              scheduleCounter++;
              placed = true;
              break roomLoop;
            }
          }
        }
      }

      if (!placed) {
        unallocated.push(course);
      }
    }

    // Calculate room utilization metric
    const totalPossibleSlots = rooms.length * this.DAYS.length * this.TIME_SLOTS.length;
    const utilizationRate = Math.round((newSchedules.length / totalPossibleSlots) * 100);

    return {
      success: unallocated.length === 0,
      schedules: newSchedules,
      unallocatedCount: unallocated.length,
      unallocatedCourses: unallocated,
      metrics: {
        totalCourses: courses.length,
        placedCount: newSchedules.length,
        utilizationRate: utilizationRate,
        conflictFreeRate: 100
      }
    };
  },

  /**
   * Apply Generated Timetable to System State
   */
  applyGeneratedTimetable(generatedSchedules) {
    window.appState.data.schedules = generatedSchedules;
    window.appState.data.timetableWorkflow = {
      version: `v${(Math.random() * 2 + 1).toFixed(1)}-CIT-Generated`,
      semester: window.appState.data.institution.semester + ' ' + window.appState.data.institution.academicYear,
      status: "draft",
      currentReviewer: "CIT Department Heads / Scheduling Committee",
      lastUpdated: new Date().toISOString(),
      history: [
        {
          step: 1,
          action: "Generated Conflict-Free Timetable with 1-Click Engine",
          by: window.appState.currentUser.name + ` (${window.appState.currentUser.role.toUpperCase()})`,
          timestamp: new Date().toLocaleString(),
          notes: `Optimized engine scheduled ${generatedSchedules.length} course sections with zero overlaps.`
        }
      ]
    };

    window.appState.addAuditLog({
      eventType: "SCHEDULE_GENERATED",
      roomCode: "CAMPUS_WIDE",
      keyId: "N/A",
      actorName: window.appState.currentUser.name,
      actorId: window.appState.currentUser.id,
      actorRole: window.appState.currentUser.role,
      verificationMode: "SYSTEM_AUTO",
      details: `Generated ${generatedSchedules.length} conflict-free course schedule allocations across CIT infrastructure.`
    });

    window.appState.save();
    window.appState.emit('schedulesUpdated', generatedSchedules);
  },

  /**
   * Workflow Transitions (Draft -> Review -> Approved -> Published)
   */
  advanceWorkflow(actionType, notes, reviewerName) {
    const wf = window.appState.data.timetableWorkflow;
    const actor = window.appState.currentUser.name;
    const timestamp = new Date().toLocaleString();

    if (actionType === 'submit_for_review') {
      wf.status = 'pending_review';
      wf.currentReviewer = reviewerName || "Engr. Maria Elena Bautista (Program Head Chair)";
      wf.history.push({
        step: wf.history.length + 1,
        action: "Submitted for Department Head Review",
        by: actor,
        timestamp: timestamp,
        notes: notes || "Submitted draft for faculty review and classroom facility clearance."
      });
    } else if (actionType === 'approve') {
      wf.status = 'approved';
      wf.currentReviewer = "Dr. Virgilio R. Cruz (College Dean)";
      wf.history.push({
        step: wf.history.length + 1,
        action: "Approved by Program Chairs",
        by: actor,
        timestamp: timestamp,
        notes: notes || "Timetable verified against CIT lab equipment availability and safety limits."
      });
    } else if (actionType === 'publish') {
      wf.status = 'published';
      wf.currentReviewer = "Published - Active in CIT Campus Displays";
      // Mark all schedule entries as published
      window.appState.data.schedules.forEach(s => s.status = 'published');
      wf.history.push({
        step: wf.history.length + 1,
        action: "Official Dean Sign-off & Published Live",
        by: actor,
        timestamp: timestamp,
        notes: notes || "Officially published timetable to student/faculty mobile portals and key cabinet registries."
      });

      // Update room occupancy according to current time
      this.syncLiveRoomOccupancy();
    } else if (actionType === 'revision_requested') {
      wf.status = 'draft';
      wf.history.push({
        step: wf.history.length + 1,
        action: "Revisions Requested by Reviewer",
        by: actor,
        timestamp: timestamp,
        notes: notes || "Modifications needed for faculty workload rebalancing."
      });
    }

    wf.lastUpdated = new Date().toISOString();

    window.appState.addAuditLog({
      eventType: "WORKFLOW_STATUS_CHANGED",
      roomCode: "CAMPUS_WIDE",
      keyId: "N/A",
      actorName: actor,
      actorId: window.appState.currentUser.id,
      actorRole: window.appState.currentUser.role,
      verificationMode: "ADMIN_OVERRIDE",
      details: `Timetable status transitioned to [${wf.status.toUpperCase()}]. Action: ${actionType}.`
    });

    window.appState.save();
    window.appState.emit('workflowUpdated', wf);
  },

  /**
   * Sync active room schedules based on current live clock
   */
  syncLiveRoomOccupancy() {
    const now = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = days[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const schedules = window.appState.data.schedules.filter(s => s.status === 'published' && s.day === currentDay);
    const rooms = window.appState.data.rooms;

    rooms.forEach(room => {
      // Find if there is a class right now in this room
      const activeClass = schedules.find(s => {
        if (s.roomCode !== room.code) return false;
        const startMin = this.timeToMinutes(s.startTime);
        const endMin = this.timeToMinutes(s.endTime);
        return currentMinutes >= startMin && currentMinutes < endMin;
      });

      if (activeClass) {
        room.activeSchedule = {
          courseCode: activeClass.courseCode,
          section: activeClass.section,
          faculty: activeClass.facultyName,
          time: `${activeClass.startTime} - ${activeClass.endTime}`
        };
        // If not already borrowed by key, set status to scheduled
        if (room.status !== 'occupied' && room.status !== 'overdue') {
          room.status = 'occupied';
        }
      } else {
        room.activeSchedule = null;
        if (room.status === 'occupied' && (!room.currentOccupant || room.currentOccupant.keyStatus !== 'borrowed')) {
          room.status = 'available';
        }
      }
    });

    window.appState.save();
  }
};

window.SchedulerEngine = SchedulerEngine;
