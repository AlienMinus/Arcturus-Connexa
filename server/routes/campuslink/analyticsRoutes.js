import express from 'express';
import PlacementProfile from '../../models/PlacementProfile.js';
import PlacementDrive from '../../models/PlacementDrive.js';
import PlacementOffer from '../../models/PlacementOffer.js';

const router = express.Router();

// GET /api/campuslink/analytics - Placement Command Center Insights (Real Dynamic Aggregation)
router.get('/', async (req, res) => {
  try {
    const totalRegisteredStudents = await PlacementProfile.countDocuments();
    const placementReadyCount = await PlacementProfile.countDocuments({ overallReadiness: { $gte: 70 } });
    const activeDrivesCount = await PlacementDrive.countDocuments({ status: { $ne: 'completed' } });
    const totalOffersExtended = await PlacementOffer.countDocuments();
    const totalOffersAccepted = await PlacementOffer.countDocuments({ status: 'accepted' });
    const placementRatePercentage = totalRegisteredStudents > 0 
      ? Number(((totalOffersAccepted / totalRegisteredStudents) * 100).toFixed(1)) 
      : 0;

    // Calculate real average and highest CTC from offers (or drives if no offers)
    let averageCtcLpa = 0;
    let highestPackageLpa = 0;
    const offerStats = await PlacementOffer.aggregate([
      { $group: { _id: null, avgCtc: { $avg: '$ctcLpa' }, maxCtc: { $max: '$ctcLpa' } } }
    ]);
    if (offerStats.length > 0 && offerStats[0].avgCtc != null) {
      averageCtcLpa = Number((offerStats[0].avgCtc || 0).toFixed(1));
      highestPackageLpa = Number((offerStats[0].maxCtc || 0).toFixed(1));
    } else {
      const driveStats = await PlacementDrive.aggregate([
        { $group: { _id: null, avgCtc: { $avg: '$ctcLpa' }, maxCtc: { $max: '$ctcLpa' } } }
      ]);
      if (driveStats.length > 0 && driveStats[0].avgCtc != null) {
        averageCtcLpa = Number((driveStats[0].avgCtc || 0).toFixed(1));
        highestPackageLpa = Number((driveStats[0].maxCtc || 0).toFixed(1));
      }
    }

    // Real Branch Conversion aggregated from student profiles
    const branchAgg = await PlacementProfile.aggregate([
      {
        $group: {
          _id: '$branch',
          total: { $sum: 1 },
          placed: {
            $sum: {
              $cond: [{ $in: ['$placementStatus', ['placed', 'offer_accepted']] }, 1, 0]
            }
          }
        }
      }
    ]);
    const branchConversion = branchAgg.map((b) => ({
      branch: b._id || 'General Engineering',
      total: b.total,
      placed: b.placed,
      placedPercent: b.total > 0 ? Number(((b.placed / b.total) * 100).toFixed(1)) : 0,
    }));

    // Real Package Tiers from Offers
    const packageTiersAgg = await PlacementOffer.aggregate([
      {
        $group: {
          _id: '$packageTier',
          count: { $sum: 1 }
        }
      }
    ]);
    const totalOffersCount = packageTiersAgg.reduce((acc, curr) => acc + curr.count, 0);
    const packageTiers = packageTiersAgg.map((pt) => ({
      tier: pt._id || 'Standard (< 6 LPA)',
      count: pt.count,
      percentage: totalOffersCount > 0 ? Math.round((pt.count / totalOffersCount) * 100) : 0,
    }));

    // Real At-Risk Students from Database
    const atRiskProfiles = await PlacementProfile.find({
      $or: [
        { isAtRisk: true },
        { activeBacklogs: { $gt: 0 } },
        { cgpa: { $lt: 6.5 } },
        { overallReadiness: { $lt: 50 } }
      ]
    }).populate('userId', 'firstName lastName email').limit(20).lean();

    const atRiskStudents = atRiskProfiles.map((p) => {
      const studentName = p.userId ? `${p.userId.firstName} ${p.userId.lastName}`.trim() : `Student ${p.rollNumber}`;
      let riskReason = p.riskReason || 'Readiness score below benchmark';
      if (!p.riskReason) {
        if (p.activeBacklogs > 0 && p.cgpa < 6.5) {
          riskReason = `Active backlogs (${p.activeBacklogs}) & CGPA below 6.5`;
        } else if (p.activeBacklogs > 0) {
          riskReason = `${p.activeBacklogs} active backlog(s) flagged`;
        } else if (p.cgpa < 6.5) {
          riskReason = `CGPA (${p.cgpa}) below institutional benchmark (6.5)`;
        }
      }
      return {
        id: p._id.toString(),
        name: studentName,
        rollNumber: p.rollNumber,
        branch: p.branch,
        cgpa: p.cgpa,
        activeBacklogs: p.activeBacklogs,
        readiness: p.overallReadiness,
        readinessLevel: p.readinessLevel,
        riskReason,
        mentor: p.assignedMentor || 'Department Faculty Advisor',
        mentorRecommendation: p.mentorActionRecommendation || 'Schedule 1-on-1 counseling session to review academic progress.',
        aiReadinessSummary: p.aiReadinessSummary || '',
      };
    });

    const stats = {
      totalRegisteredStudents,
      placementReadyCount,
      placementRatePercentage,
      activeDrivesCount,
      totalOffersExtended,
      totalOffersAccepted,
      averageCtcLpa,
      highestPackageLpa,
      branchConversion,
      packageTiers,
      atRiskStudents,
    };

    res.json({ stats });
  } catch (err) {
    console.error('Failed to fetch placement analytics:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
});

export default router;

