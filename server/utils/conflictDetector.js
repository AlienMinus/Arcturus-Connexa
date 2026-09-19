/**
 * CAMPUSLINK Conflict Detection & Resolution Engine
 * Detects:
 * 1. Date & Time window overlaps between company drives
 * 2. Venue and room double-bookings
 * 3. Student simultaneous interview / shortlisting clashes
 * Generates automated conflict warnings and resolution recommendations.
 */

export const detectDriveConflicts = (drives = []) => {
  const conflicts = [];
  const activeDrives = drives.filter((d) => d.status !== 'completed' && d.status !== 'cancelled');

  // Helper to parse time string like "09:30 AM" or "14:00" into minutes from midnight
  const parseTimeMinutes = (timeStr) => {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3] ? match[3].toUpperCase() : null;
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const CAMPUS_VENUES = [
    'Campus Auditorium - Hall A',
    'Campus Auditorium - Hall B',
    'Seminar Hall B',
    'Tech Center Lab 101',
    'Placement Cell Boardroom',
    'Virtual Assessment Lab',
  ];

  for (let i = 0; i < activeDrives.length; i++) {
    for (let j = i + 1; j < activeDrives.length; j++) {
      const driveA = activeDrives[i];
      const driveB = activeDrives[j];

      const dateA = driveA.schedule?.driveDate ? new Date(driveA.schedule.driveDate).toISOString().slice(0, 10) : '';
      const dateB = driveB.schedule?.driveDate ? new Date(driveB.schedule.driveDate).toISOString().slice(0, 10) : '';

      // Check if drives occur on the same date
      if (dateA && dateB && dateA === dateB) {
        const venueA = (driveA.schedule?.venue || '').trim();
        const venueB = (driveB.schedule?.venue || '').trim();
        const isVirtualA = Boolean(driveA.schedule?.isVirtual || venueA.toLowerCase().includes('virtual'));
        const isVirtualB = Boolean(driveB.schedule?.isVirtual || venueB.toLowerCase().includes('virtual'));

        const startA = parseTimeMinutes(driveA.schedule?.startTime);
        const endA = parseTimeMinutes(driveA.schedule?.endTime) || (startA !== null ? startA + 240 : null);
        const startB = parseTimeMinutes(driveB.schedule?.startTime);
        const endB = parseTimeMinutes(driveB.schedule?.endTime) || (startB !== null ? startB + 240 : null);

        // Check whether time ranges actually overlap
        const timesOverlap =
          startA !== null && endA !== null && startB !== null && endB !== null
            ? Math.max(startA, startB) < Math.min(endA, endB)
            : true;

        // 1. Critical: Physical Venue Double Booking during overlapping hours
        if (venueA && venueB && venueA.toLowerCase() === venueB.toLowerCase() && !isVirtualA && !isVirtualB && timesOverlap) {
          // Find an alternative venue not currently booked on this date
          const bookedVenues = activeDrives
            .filter((d) => d.schedule?.driveDate && new Date(d.schedule.driveDate).toISOString().slice(0, 10) === dateA)
            .map((d) => (d.schedule?.venue || '').trim().toLowerCase());

          const suggestedVenue =
            CAMPUS_VENUES.find((v) => !bookedVenues.includes(v.toLowerCase())) || 'Virtual Assessment Lab';

          conflicts.push({
            id: `venue-${driveA._id}-${driveB._id}`,
            type: 'VENUE_DOUBLE_BOOKED',
            severity: 'CRITICAL',
            title: `Venue Collision: ${driveA.schedule.venue}`,
            description: `${driveA.companyName} and ${driveB.companyName} are both scheduled in "${driveA.schedule.venue}" on ${dateA} (${driveA.schedule?.startTime || 'Morning'} - ${driveA.schedule?.endTime || 'Evening'}).`,
            affectedDrives: [
              { id: driveA._id, company: driveA.companyName, role: driveA.roleTitle },
              { id: driveB._id, company: driveB.companyName, role: driveB.roleTitle },
            ],
            recommendation: `Reassign "${driveB.companyName}" to "${suggestedVenue}" to prevent on-campus room double-booking.`,
            autoAction: 'REASSIGN_VENUE',
            targetDriveId: driveB._id,
            suggestedVenue,
          });
        }

        // 2. High: Target Branch Overlap on the Same Day with Overlapping Hours
        const branchesA = driveA.eligibility?.allowedBranches || [];
        const branchesB = driveB.eligibility?.allowedBranches || [];
        const commonBranches = branchesA.filter((b) => branchesB.includes(b));

        if (commonBranches.length > 0 && timesOverlap) {
          conflicts.push({
            id: `time-${driveA._id}-${driveB._id}`,
            type: 'DRIVE_SCHEDULE_CLASH',
            severity: 'HIGH',
            title: `Branch Schedule Clash on ${dateA}`,
            description: `${driveA.companyName} (${driveA.schedule?.startTime || 'Morning'}) and ${driveB.companyName} (${driveB.schedule?.startTime || 'Morning'}) both target students in ${commonBranches.slice(0, 2).join(', ')} during overlapping hours.`,
            affectedDrives: [
              { id: driveA._id, company: driveA.companyName, role: driveA.roleTitle },
              { id: driveB._id, company: driveB.companyName, role: driveB.roleTitle },
            ],
            recommendation: `Shift "${driveB.companyName}" to the Afternoon Slot (02:00 PM - 06:30 PM) so eligible students can attend both presentations.`,
            autoAction: 'RESCHEDULE_SLOT',
            targetDriveId: driveB._id,
            suggestedTime: '02:00 PM - 06:30 PM',
          });
        }

        // 3. Medium: Student Multi-Shortlist Overlap
        const candidatesA = (driveA.candidates || []).filter((c) =>
          ['shortlisted', 'in_interview'].includes(c.status)
        );
        const candidatesB = (driveB.candidates || []).filter((c) =>
          ['shortlisted', 'in_interview'].includes(c.status)
        );

        const doubleShortlisted = [];
        candidatesA.forEach((cA) => {
          const match = candidatesB.find(
            (cB) =>
              (cA.userId && cB.userId && cA.userId.toString() === cB.userId.toString()) ||
              cA.studentName.toLowerCase() === cB.studentName.toLowerCase()
          );
          if (match) {
            doubleShortlisted.push(cA.studentName);
          }
        });

        if (doubleShortlisted.length > 0 && timesOverlap) {
          conflicts.push({
            id: `student-${driveA._id}-${driveB._id}`,
            type: 'STUDENT_MULTI_SHORTLIST_CLASH',
            severity: 'MEDIUM',
            title: `Student Interview Overlap (${doubleShortlisted.length} Students)`,
            description: `${doubleShortlisted.slice(0, 3).join(', ')}${doubleShortlisted.length > 3 ? ` and ${doubleShortlisted.length - 3} others` : ''} are shortlisted for simultaneous interview stages with both ${driveA.companyName} and ${driveB.companyName}.`,
            affectedDrives: [
              { id: driveA._id, company: driveA.companyName },
              { id: driveB._id, company: driveB.companyName },
            ],
            recommendation: `Stagger interview windows: schedule ${driveA.companyName} in Slot 1 (09:30 AM - 01:00 PM) and ${driveB.companyName} in Slot 2 (02:00 PM - 05:30 PM).`,
            autoAction: 'STAGGER_INTERVIEWS',
          });
        }
      }
    }
  }

  return conflicts;
};

