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

  for (let i = 0; i < activeDrives.length; i++) {
    for (let j = i + 1; j < activeDrives.length; j++) {
      const driveA = activeDrives[i];
      const driveB = activeDrives[j];

      const dateA = new Date(driveA.schedule?.driveDate).toISOString().slice(0, 10);
      const dateB = new Date(driveB.schedule?.driveDate).toISOString().slice(0, 10);

      // Check if drives occur on the same day
      if (dateA === dateB) {
        const venueA = (driveA.schedule?.venue || '').trim().toLowerCase();
        const venueB = (driveB.schedule?.venue || '').trim().toLowerCase();

        // 1. Critical: Venue Double Booking
        if (venueA && venueB && venueA === venueB && !driveA.schedule?.isVirtual && !driveB.schedule?.isVirtual) {
          conflicts.push({
            id: `venue-${driveA._id}-${driveB._id}`,
            type: 'VENUE_DOUBLE_BOOKED',
            severity: 'CRITICAL',
            title: `Venue Clash: ${driveA.schedule.venue}`,
            description: `${driveA.companyName} and ${driveB.companyName} are both scheduled in "${driveA.schedule.venue}" on ${dateA}.`,
            affectedDrives: [
              { id: driveA._id, company: driveA.companyName, role: driveA.roleTitle },
              { id: driveB._id, company: driveB.companyName, role: driveB.roleTitle },
            ],
            recommendation: `Reassign "${driveB.companyName}" to "Seminar Hall B" or switch to "Virtual Assessment Lab" to resolve the venue clash.`,
            autoAction: 'REASSIGN_VENUE',
            targetDriveId: driveB._id,
            suggestedVenue: 'Seminar Hall B',
          });
        }

        // 2. High: Target Branch Overlap on the Same Day / Slot
        const branchesA = driveA.eligibility?.allowedBranches || [];
        const branchesB = driveB.eligibility?.allowedBranches || [];
        const commonBranches = branchesA.filter((b) => branchesB.includes(b));

        if (commonBranches.length > 0) {
          conflicts.push({
            id: `time-${driveA._id}-${driveB._id}`,
            type: 'DRIVE_SCHEDULE_CLASH',
            severity: 'HIGH',
            title: `Drive Schedule Clash on ${dateA}`,
            description: `${driveA.companyName} (${driveA.schedule?.startTime || 'Morning'}) and ${driveB.companyName} (${driveB.schedule?.startTime || 'Morning'}) both target students in ${commonBranches.slice(0, 2).join(', ')}.`,
            affectedDrives: [
              { id: driveA._id, company: driveA.companyName, role: driveA.roleTitle },
              { id: driveB._id, company: driveB.companyName, role: driveB.roleTitle },
            ],
            recommendation: `Shift "${driveB.companyName}" to the Afternoon Slot (02:00 PM - 06:30 PM) so students can attend both company presentations without clashing.`,
            autoAction: 'RESCHEDULE_SLOT',
            targetDriveId: driveB._id,
            suggestedTime: '02:00 PM - 06:30 PM',
          });
        }

        // 3. Student Multi-Shortlist Clash
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

        if (doubleShortlisted.length > 0) {
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
            recommendation: `Stagger interview windows: schedule ${driveA.companyName} interviews in Slot 1 (10:00 AM - 01:00 PM) and ${driveB.companyName} in Slot 2 (02:00 PM - 05:00 PM).`,
            autoAction: 'STAGGER_INTERVIEWS',
          });
        }
      }
    }
  }

  return conflicts;
};

