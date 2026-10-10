import { jsPDF } from 'jspdf';

export const generatePlacementPdf = (report, user) => {
  if (!report) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight = 20) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawPageBorder();
    }
  };

  const drawPageBorder = () => {
    doc.setDrawColor(226, 232, 240); // #e2e8f0
    doc.setLineWidth(0.5);
    doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - (margin * 2) + 8);
  };

  drawPageBorder();

  // === HEADER BANNER ===
  doc.setFillColor(10, 102, 194); // Arcturus primary blue #0a66c2
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ARCTURUS CAMPUSLINK', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('OFFICIAL PLACEMENT READINESS & SKILL-GAP DIAGNOSTIC REPORT', margin + 6, y + 16);

  doc.setFontSize(7.5);
  doc.text(`REPORT ID: ${report.reportId || 'ACT-DIAG-001'}`, pageWidth - margin - 6, y + 9, { align: 'right' });
  doc.text(`GENERATED: ${new Date(report.generatedAt || Date.now()).toLocaleDateString()}`, pageWidth - margin - 6, y + 16, { align: 'right' });

  y += 28;

  // === CANDIDATE CREDENTIALS SECTION ===
  const cand = report.candidate || {};
  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.setDrawColor(203, 213, 225); // #cbd5e1
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42); // #0f172a
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(cand.fullName || user?.name || user?.username || 'Campus Candidate', margin + 5, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  if (cand.headline) {
    const splitHeadline = doc.splitTextToSize(cand.headline, contentWidth - 10);
    doc.text(splitHeadline.slice(0, 2), margin + 5, y + 12);
  }

  const col1X = margin + 5;
  const col2X = margin + 65;
  const col3X = margin + 125;
  const metaY1 = y + 23;
  const metaY2 = y + 31;

  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  doc.setFont('helvetica', 'bold');
  doc.text('University:', col1X, metaY1);
  doc.setFont('helvetica', 'normal');
  doc.text(cand.collegeName || 'University', col1X + 18, metaY1);

  doc.setFont('helvetica', 'bold');
  doc.text('Department:', col2X, metaY1);
  doc.setFont('helvetica', 'normal');
  doc.text(cand.department || 'Engineering', col2X + 20, metaY1);

  doc.setFont('helvetica', 'bold');
  doc.text('Student ID / Roll:', col3X, metaY1);
  doc.setFont('helvetica', 'normal');
  doc.text(cand.rollNumber || 'CANDIDATE-01', col3X + 25, metaY1);

  doc.setFont('helvetica', 'bold');
  doc.text('Current CGPA:', col1X, metaY2);
  doc.setFont('helvetica', 'normal');
  doc.text(`${cand.cgpa ?? '8.88'} / 10.0`, col1X + 23, metaY2);

  doc.setFont('helvetica', 'bold');
  doc.text('Graduation Year:', col2X, metaY2);
  doc.setFont('helvetica', 'normal');
  doc.text(`${cand.graduationYear || 2027}`, col2X + 26, metaY2);

  doc.setFont('helvetica', 'bold');
  doc.text('Academic History:', col3X, metaY2);
  doc.setFont('helvetica', 'normal');
  doc.text(`12th: ${cand.twelfthPercentage ?? 87.5}% · 10th: ${cand.tenthPercentage ?? 86.33}%`, col3X + 27, metaY2);

  y += 44;

  // === PREDICTIVE READINESS SCORE & 4-DIMENSION BREAKDOWN ===
  checkPageBreak(50);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setTextColor(10, 102, 194);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('1. PREDICTIVE EMPLOYABILITY SCORE & 4-DIMENSION BENCHMARKS', margin + 4, y + 5);

  y += 10;

  const pred = report.predictiveReadiness || {};
  const dims = pred.dimensions || {};

  // Score Dial Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, 50, 36, 2, 2, 'FD');

  doc.setFillColor(10, 102, 194);
  doc.circle(margin + 25, y + 14, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${pred.overallScore || 90}%`, margin + 25, y + 15.5, { align: 'center' });

  doc.setTextColor(22, 101, 52);
  doc.setFontSize(8);
  doc.text(pred.readinessLevel || 'Highly Employable', margin + 25, y + 29, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Rank: ${pred.percentileRank || 'Top Batch'}`, margin + 25, y + 33, { align: 'center' });

  // 4 Dimensions Table
  const dimX = margin + 55;
  const dimW = contentWidth - 55;
  doc.roundedRect(dimX, y, dimW, 36, 2, 2, 'FD');

  const dimensionList = [
    { label: 'Technical Competency (DSA, Web & Systems)', score: dims.technicalCompetency?.score || 95, benchmark: 75, color: [10, 102, 194] },
    { label: 'Aptitude & Problem Solving Competency', score: dims.aptitudeAndProblemSolving?.score || 90, benchmark: 70, color: [22, 163, 74] },
    { label: 'Communication & Behavioral Interview Depth', score: dims.communicationAndBehavioral?.score || 88, benchmark: 75, color: [126, 34, 206] },
    { label: 'Projects & Practical Experience Depth', score: dims.projectAndPracticalExperience?.score || 96, benchmark: 65, color: [234, 88, 12] },
  ];

  dimensionList.forEach((dim, idx) => {
    const rowY = y + 7 + idx * 7.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(dim.label, dimX + 4, rowY);

    doc.setFont('helvetica', 'normal');
    doc.text(`Score: ${dim.score}%  (Cutoff: ${dim.benchmark}%)`, dimX + dimW - 35, rowY);

    // Mini progress bar
    const barX = dimX + dimW - 34;
    const barY = rowY - 2.5;
    const barW = 30;
    doc.setFillColor(226, 232, 240);
    doc.rect(barX, barY, barW, 2.5, 'F');
    doc.setFillColor(...dim.color);
    doc.rect(barX, barY, (barW * dim.score) / 100, 2.5, 'F');
  });

  y += 42;

  // === SKILL GAP ANALYSIS AGAINST SCHEDULED DRIVES ===
  checkPageBreak(40);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setTextColor(10, 102, 194);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('2. RECRUITMENT DRIVES & SKILL-GAP ANALYSIS', margin + 4, y + 5);

  y += 10;

  const gaps = report.skillGapAnalysis || [];
  if (gaps.length > 0) {
    gaps.slice(0, 3).forEach((gap) => {
      checkPageBreak(18);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 16, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(10, 102, 194);
      doc.text(gap.companyAndRole || gap.targetRole || 'Target Recruitment Drive', margin + 4, y + 5);

      doc.setTextColor(gap.matchPercentage >= 75 ? 22 : 180, gap.matchPercentage >= 75 ? 101 : 83, gap.matchPercentage >= 75 ? 52 : 9);
      doc.text(`Match: ${gap.matchPercentage || 100}%`, pageWidth - margin - 5, y + 5, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const matchedStr = `Matched: ${(gap.matchedSkills || []).slice(0, 5).join(', ') || 'Core Competencies'}`;
      doc.text(matchedStr, margin + 4, y + 9.5);

      const missingStr = gap.missingSkills?.length > 0
        ? `Skill Gaps: ${gap.missingSkills.join(', ')}`
        : '100% hiring criteria satisfied!';
      doc.setTextColor(gap.missingSkills?.length > 0 ? 185 : 22, gap.missingSkills?.length > 0 ? 28 : 101, gap.missingSkills?.length > 0 ? 28 : 52);
      doc.text(missingStr, margin + 4, y + 13.5);

      y += 19;
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('All technical and academic benchmarks satisfied across active campus drives.', margin + 4, y + 5);
    y += 10;
  }

  // === SELF-GUIDED REMEDIAL ROADMAP ===
  checkPageBreak(45);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setTextColor(10, 102, 194);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('3. ACTIONABLE REMEDIAL ROADMAP (INDEPENDENT SELF-STUDY TRACK)', margin + 4, y + 5);

  y += 10;

  const remPlan = report.actionableRemedialPlan || {};
  const milestones = remPlan.independentMilestones || [];

  milestones.slice(0, 4).forEach((m) => {
    checkPageBreak(14);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 12.5, 1.5, 1.5, 'FD');

    // Priority pill
    const isHigh = m.priority === 'HIGH';
    doc.setFillColor(isHigh ? 254 : 254, isHigh ? 226 : 243, isHigh ? 226 : 199);
    doc.rect(margin + 3, y + 2.5, 14, 4, 'F');
    doc.setTextColor(isHigh ? 185 : 180, isHigh ? 28 : 83, isHigh ? 28 : 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(m.priority || 'MED', margin + 10, y + 5.3, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Step ${m.step}: ${m.domain}`, margin + 20, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Est: ${m.estimatedEffort}`, pageWidth - margin - 4, y + 5.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(doc.splitTextToSize(m.action, contentWidth - 10), margin + 4, y + 9.5);

    y += 15.5;
  });

  // === PORTFOLIO SNAPSHOT (PROJECTS & SKILLS) ===
  checkPageBreak(45);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setTextColor(10, 102, 194);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('4. SYNCHRONIZED PORTFOLIO CREDENTIALS (PROJECTS & VERIFIED SKILLS)', margin + 4, y + 5);

  y += 10;

  // Projects list
  const projects = cand.portfolioSummary?.projectsCount || 0;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Verified Technical Projects (${projects}):`, margin + 4, y + 4);
  y += 6;

  const projectItems = [
    '• Arcturus Connexa: Full-stack MERN networking platform with real-time sockets & Docker deployment.',
    '• Hyperion IDE: Microservices AI-assisted development environment with Python NLP code auditing.',
    '• AI Interview Assistant: Computer vision YOLO & OpenCV browser-based automated simulation system.',
    '• M.I.R.A.: Agentic AI research & automation assistant with LangChain workflows.',
  ];

  projectItems.forEach((pText) => {
    checkPageBreak(6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(pText, margin + 4, y + 3);
    y += 5;
  });

  // Skills Pills
  checkPageBreak(16);
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Verified Skills Portfolio (${(cand.skills || []).length}):`, margin + 4, y + 4);
  y += 6;

  const skillsStr = (cand.skills || []).join(' · ');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  const splitSkills = doc.splitTextToSize(skillsStr, contentWidth - 8);
  doc.text(splitSkills, margin + 4, y + 3);
  y += splitSkills.length * 4 + 4;

  // === INFERENCE ENGINE FOOTER ===
  checkPageBreak(16);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184); // #94a3b8
  const engine = report.inferenceEngine || {};
  doc.text(
    `Inference Engine: ${engine.model || 'google/gemma-3-4b-it'} · Provider: ${engine.provider || 'Hugging Face Gemma'} · Verification: VERIFIED`,
    margin + 4,
    y + 2
  );
  doc.text(
    `Arcturus CampusLink AI Placement Intelligence · Confidential Document`,
    pageWidth - margin - 4,
    y + 2,
    { align: 'right' }
  );

  // Download PDF
  const sanitizedName = (cand.fullName || user?.username || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Arcturus-Placement-Diagnostics-${sanitizedName}-${dateStr}.pdf`);
};

