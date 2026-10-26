import { jsPDF } from 'jspdf';
import { ApplicationCase, ReviewerProfile, VerificationReport } from '../types';

export function generateVerificationPdf(
  appCase: ApplicationCase,
  reviewer: ReviewerProfile,
  report: VerificationReport
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Header Bar
  doc.setFillColor(15, 23, 42); // Deep midnight navy
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('VERICAMPUS AI · VERIFICATION AUDIT DOSSIER', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('SMART INDIA HACKATHON · NATIONAL INSTITUTIONAL ACCREDITATION FRAMEWORK', margin, 18);
  doc.text(`REPORT HASH: ${report.verificationHash.substring(0, 32)}...`, margin, 24);

  y = 36;

  // Dossier Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('APPLICATION CASE METADATA', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const col1X = margin + 4;
  const col2X = margin + 64;
  const col3X = margin + 128;

  doc.text(`Application ID:`, col1X, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(appCase.applicationId, col1X, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Applicant Name:`, col2X, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(appCase.applicantName, col2X, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Evaluation Date:`, col3X, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(report.reportDate, col3X, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Target Institution:`, col1X, y + 25);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(appCase.institutionName.substring(0, 32), col1X, y + 29);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Lead Reviewer:`, col2X, y + 25);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${reviewer.name} (${reviewer.reviewerId})`, col2X, y + 29);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Status:`, col3X, y + 25);
  doc.setFont('helvetica', 'bold');
  const statusColor = appCase.findings.length > 0 ? [220, 38, 38] : [22, 163, 74];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(appCase.decision?.decision || appCase.status, col3X, y + 29);

  y += 40;

  // Document Inventory Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. SUBMITTED DOCUMENT INVENTORY', margin, y);
  y += 4;

  // Table header
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('#', margin + 3, y + 5);
  doc.text('Document Name', margin + 10, y + 5);
  doc.text('Category', margin + 70, y + 5);
  doc.text('Size', margin + 120, y + 5);
  doc.text('OCR Status', margin + 145, y + 5);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  appCase.documents.forEach((d, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
    doc.rect(margin, y, contentWidth, 6.5, 'F');
    doc.setTextColor(30, 41, 59);
    doc.text(String(idx + 1), margin + 3, y + 4.5);
    doc.text(d.name.substring(0, 38), margin + 10, y + 4.5);
    doc.text(d.category.substring(0, 28), margin + 70, y + 4.5);
    doc.text(d.fileSize, margin + 120, y + 4.5);
    doc.text(d.ocrStatus.toUpperCase(), margin + 145, y + 4.5);
    y += 6.5;
  });

  y += 6;

  // Cross-Validation Findings Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`2. CROSS-DOCUMENT FINDINGS (${appCase.findings.length} DETECTED)`, margin, y);
  y += 4;

  if (appCase.findings.length === 0) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');
    doc.setTextColor(22, 101, 52);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('NO DISCREPANCIES OR ANOMALIES IDENTIFIED BY AVAILABLE RULES', margin + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text('Cross-document comparisons for legal names, roll numbers, and dates showed 100% concordance.', margin + 4, y + 10);
    y += 18;
  } else {
    appCase.findings.forEach((find, idx) => {
      if (y > pageHeight - 50) {
        doc.addPage();
        y = 20;
      }

      const isCritical = find.severity === 'critical';
      doc.setFillColor(isCritical ? 254 : 255, isCritical ? 242 : 251, isCritical ? 242 : 235);
      doc.setDrawColor(isCritical ? 254 : 251, isCritical ? 202 : 191, isCritical ? 202 : 36);
      doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(isCritical ? 185 : 180, isCritical ? 28 : 83, isCritical ? 28 : 9);
      doc.text(`[${find.severity.toUpperCase()}] ${find.title}`, margin + 4, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const splitExp = doc.splitTextToSize(`Explanation: ${find.explanation}`, contentWidth - 8);
      doc.text(splitExp, margin + 4, y + 9.5);

      doc.setFont('helvetica', 'bold');
      doc.text(`Observed: "${find.observedValue}"`, margin + 4, y + 15);
      doc.text(`Expected: "${find.expectedValue}"`, margin + 65, y + 15);
      doc.text(`Source Doc: ${find.sourceDocumentName}`, margin + 120, y + 15);

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(71, 85, 105);
      doc.text(`Recommended Action: ${find.recommendedAction}`, margin + 4, y + 20);

      y += 27;
    });
  }

  y += 4;

  // Reviewer Decision Box
  if (y > pageHeight - 55) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('3. AUTHORIZED REVIEWER DECISION & AUDIT SIGN-OFF', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Decision: ${appCase.decision?.decision || 'IN PROGRESS - PRELIMINARY EVALUATION'}`, margin + 4, y + 12);
  doc.text(`Reviewer Notes: ${appCase.decision?.reviewerNotes || appCase.reviewerNotes || 'Pending final remarks.'}`, margin + 4, y + 17);
  doc.text(`Signed by: ${reviewer.name}, ${reviewer.designation}`, margin + 4, y + 22);
  doc.text(`Electronic Signature ID: SIH-REV-SIG-${reviewer.reviewerId}-${Date.now().toString(36).toUpperCase()}`, margin + 4, y + 26);

  y += 34;

  // Mandatory Legal & Technical Disclaimer
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 16, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('CRITICAL REGULATORY NOTICE & METHODOLOGY DISCLAIMER:', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.text(
    'Automated checks authenticate structural consistency, optical field correlations, and timeline coherence across submitted records.',
    margin + 3,
    y + 8.5
  );
  doc.text(
    'Automated checks do not independently establish legal genuineness or forge-proof status. Discrepancies identify anomalies for inquiry.',
    margin + 3,
    y + 11.5
  );
  doc.text(
    'Final accreditation determinations rest exclusively with authorized human reviewers under institutional guidelines.',
    margin + 3,
    y + 14.5
  );

  return doc;
}

export function downloadVerificationPdf(
  appCase: ApplicationCase,
  reviewer: ReviewerProfile,
  report: VerificationReport
) {
  const doc = generateVerificationPdf(appCase, reviewer, report);
  const filename = `VeriCampus_Audit_Report_${appCase.applicationId}.pdf`;
  doc.save(filename);
}
