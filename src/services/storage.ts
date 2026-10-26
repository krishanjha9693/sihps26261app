import { ApplicationCase, ReviewerProfile, VerificationReport } from '../types';

const STORAGE_KEY_APPLICATIONS = 'vericampus_applications_v1';
const STORAGE_KEY_REPORTS = 'vericampus_reports_v1';
const STORAGE_KEY_PROFILE = 'vericampus_reviewer_profile_v1';

export const DEFAULT_REVIEWER_PROFILE: ReviewerProfile = {
  name: 'Verification Officer',
  email: 'verifier@vericampus.edu',
  reviewerId: 'VC-EVAL-2026',
  role: 'Verification Evaluator',
  theme: 'light',
  language: 'English (India)',
  soundFeedback: true,
  compactCards: false,
};

// Generates an SVG document placeholder for realistic document inspection previews
export function createSampleDocumentSvg(
  title: string,
  docType: string,
  personName: string,
  regNumber: string,
  date: string,
  institution: string,
  warningText?: string
): string {
  const isWarning = Boolean(warningText);
  const borderCol = isWarning ? '#f59e0b' : '#3b82f6';
  const badgeCol = isWarning ? '#ef4444' : '#10b981';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="800" height="1100">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#f8fafc"/>
      </linearGradient>
      <pattern id="guilloche" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 0 20 Q 10 5, 20 20 T 40 20" fill="none" stroke="#e2e8f0" stroke-width="0.8"/>
      </pattern>
    </defs>
    <!-- Page background -->
    <rect width="800" height="1100" fill="url(#bgGrad)"/>
    <rect x="25" y="25" width="750" height="1050" fill="none" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="35" y="35" width="730" height="1030" fill="none" stroke="${borderCol}" stroke-width="1.5" stroke-dasharray="4,2"/>
    <rect x="40" y="40" width="720" height="1020" fill="url(#guilloche)" opacity="0.4"/>

    <!-- Emblem / Watermark -->
    <circle cx="400" cy="550" r="160" fill="none" stroke="#e2e8f0" stroke-width="3" opacity="0.4"/>
    <circle cx="400" cy="550" r="120" fill="none" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.4"/>
    <text x="400" y="555" font-family="Plus Jakarta Sans, sans-serif" font-size="20" font-weight="bold" fill="#cbd5e1" text-anchor="middle" letter-spacing="8" opacity="0.6">ACCREDITATION EMBLEM</text>

    <!-- Header -->
    <rect x="35" y="35" width="730" height="130" fill="#0f172a"/>
    <text x="400" y="80" font-family="Plus Jakarta Sans, sans-serif" font-size="14" font-weight="600" fill="#94a3b8" text-anchor="middle" letter-spacing="3">GOVERNMENT OF INDIA ACCREDITATION SYSTEM</text>
    <text x="400" y="115" font-family="Plus Jakarta Sans, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">${institution.toUpperCase()}</text>
    <text x="400" y="145" font-family="Plus Jakarta Sans, sans-serif" font-size="12" fill="#38bdf8" text-anchor="middle">OFFICIAL AUTHENTICATED RECORD / VERIFICATION COPY</text>

    <!-- Document Title -->
    <text x="400" y="230" font-family="Plus Jakarta Sans, sans-serif" font-size="26" font-weight="800" fill="#0f172a" text-anchor="middle" text-decoration="underline">${title.toUpperCase()}</text>
    <text x="400" y="260" font-family="JetBrains Mono, monospace" font-size="13" fill="#64748b" text-anchor="middle">CATEGORY: ${docType} · SERIAL: ${regNumber}</text>

    <!-- Body text -->
    <g transform="translate(80, 310)">
      <text x="0" y="30" font-family="Plus Jakarta Sans, sans-serif" font-size="15" fill="#334155">This is to certify that the submitted record belongs to:</text>
      
      <rect x="0" y="50" width="640" height="85" rx="8" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
      <text x="25" y="85" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600" fill="#64748b">CANDIDATE / APPLICANT NAME:</text>
      <text x="25" y="115" font-family="Plus Jakarta Sans, sans-serif" font-size="20" font-weight="800" fill="#0f172a">${personName}</text>

      <text x="0" y="180" font-family="Plus Jakarta Sans, sans-serif" font-size="15" fill="#334155">having successfully satisfied all evaluation requirements under registration code:</text>
      
      <rect x="0" y="200" width="310" height="70" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
      <text x="20" y="225" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="600" fill="#64748b">REGISTRATION / ROLL NO:</text>
      <text x="20" y="252" font-family="JetBrains Mono, monospace" font-size="17" font-weight="700" fill="#1e293b">${regNumber}</text>

      <rect x="330" y="200" width="310" height="70" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
      <text x="350" y="225" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="600" fill="#64748b">DATE OF ISSUANCE:</text>
      <text x="350" y="252" font-family="JetBrains Mono, monospace" font-size="17" font-weight="700" fill="#1e293b">${date}</text>

      <text x="0" y="320" font-family="Plus Jakarta Sans, sans-serif" font-size="14" fill="#475569" width="640">
        In witness whereof the authorized seal of the examination syndicate and registrar is affixed hereto.
      </text>
    </g>

    ${
      isWarning
        ? `<!-- Evidence Highlight Area -->
      <rect x="100" y="390" width="600" height="60" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" stroke-width="2" rx="4"/>
      <text x="120" y="425" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="700" fill="#b45309">DISCREPANCY EVIDENCE: ${warningText}</text>`
        : ''
    }

    <!-- Official Seal & Signature Section -->
    <g transform="translate(100, 820)">
      <!-- Seal -->
      <circle cx="80" cy="80" r="65" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
      <circle cx="80" cy="80" r="55" fill="none" stroke="#2563eb" stroke-width="1" stroke-dasharray="4,2"/>
      <text x="80" y="70" font-family="Plus Jakarta Sans, sans-serif" font-size="10" font-weight="bold" fill="#1e40af" text-anchor="middle">VERIFIED ARCHIVE</text>
      <text x="80" y="85" font-family="JetBrains Mono, monospace" font-size="9" fill="#2563eb" text-anchor="middle">SIH-2026-SEAL</text>
      <text x="80" y="100" font-family="Plus Jakarta Sans, sans-serif" font-size="8" fill="#64748b" text-anchor="middle">ACCREDITED</text>

      <!-- Signatures -->
      <line x1="380" y1="90" x2="560" y2="90" stroke="#475569" stroke-width="1.5"/>
      <path d="M 400 80 Q 420 50, 450 75 T 510 65 T 545 75" fill="none" stroke="#1e293b" stroke-width="2"/>
      <text x="470" y="110" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="700" fill="#1e293b" text-anchor="middle">Registrar &amp; Controller of Exams</text>
      <text x="470" y="128" font-family="Plus Jakarta Sans, sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${institution}</text>
    </g>

    <!-- Footer barcode & metadata -->
    <rect x="40" y="1010" width="720" height="45" fill="#f1f5f9"/>
    <text x="60" y="1038" font-family="JetBrains Mono, monospace" font-size="11" fill="#64748b">HASH: SHA256-${regNumber.replace(/[^A-Z0-9]/gi, '')}-SIH-AUDIT</text>
    <text x="720" y="1038" font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="600" fill="#475569" text-anchor="end">PAGE 1 OF 1</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_DEMO_APPLICATIONS: ApplicationCase[] = [
  {
    id: 'case-sih-01',
    applicationId: 'SIH-2026-AP-8921',
    applicantName: 'Dr. Aakash Sharma',
    applicantEmail: 'aakash.sharma@example.edu.in',
    applicantPhone: '+91 98765 43210',
    institutionName: 'Delhi Technological University (DTU)',
    programOrCourse: 'Faculty Accreditation in Artificial Intelligence',
    submissionDate: '2026-10-22',
    status: 'Needs Attention',
    priority: 'High',
    isDemoSample: true,
    requiredDocumentTypes: [
      'Identity Proof',
      'Educational Certificate',
      'Academic Transcript',
      'Institutional Affiliation Proof',
    ],
    reviewerNotes: 'Candidate exhibits a subtle spelling mismatch between national identity proof and university convocation parchment. Requires clarification before accreditation grant.',
    documents: [
      {
        id: 'doc-101',
        name: 'Aadhaar_National_ID_Card.pdf',
        category: 'Identity Proof',
        fileSize: '1.4 MB',
        mimeType: 'application/pdf',
        pageCount: 1,
        uploadedAt: '2026-10-22 10:14 IST',
        ocrStatus: 'completed',
        previewUrl: createSampleDocumentSvg(
          'National Identity Card (Aadhaar)',
          'Identity Proof',
          'Aakash Sharma',
          '9821-4402-9912',
          '15-08-2018',
          'Unique Identification Authority of India'
        ),
        extractedText: `GOVERNMENT OF INDIA\nUNIQUE IDENTIFICATION AUTHORITY\nName: Aakash Sharma\nDOB: 12/04/1988\nGender: Male\nAadhaar No: 9821 4402 9912\nAddress: Sector 14, Rohini, New Delhi 110085`,
        extractedFields: [
          { fieldName: 'applicantName', label: 'Full Legal Name', value: 'Aakash Sharma', confidence: 0.98, boundingBox: { x: 10, y: 35, width: 75, height: 10 } },
          { fieldName: 'registrationNumber', label: 'Identity / UID Number', value: '9821-4402-9912', confidence: 0.97, boundingBox: { x: 10, y: 48, width: 45, height: 8 } },
          { fieldName: 'issueDate', label: 'Card Issue Date', value: '15-08-2018', confidence: 0.92, boundingBox: { x: 55, y: 48, width: 35, height: 8 } },
          { fieldName: 'institutionName', label: 'Issuing Authority', value: 'UIDAI Govt of India', confidence: 0.95 },
        ],
        qualityReport: {
          isReadable: true,
          blurScore: 94,
          blurDetected: false,
          resolutionRating: 'High',
          estimatedDPI: 300,
          hasTruncatedEdges: false,
          observations: ['Sharp microtext', 'Emblem barcode verified', 'Clean contrast ratio'],
        },
      },
      {
        id: 'doc-102',
        name: 'PhD_Doctoral_Degree_Convocation.pdf',
        category: 'Educational Certificate',
        fileSize: '2.8 MB',
        mimeType: 'application/pdf',
        pageCount: 1,
        uploadedAt: '2026-10-22 10:18 IST',
        ocrStatus: 'completed',
        previewUrl: createSampleDocumentSvg(
          'Doctor of Philosophy Convocation Degree',
          'Educational Certificate',
          'Akash V. Sharma',
          'DTU/PHD/2021/489',
          '14-11-2021',
          'Delhi Technological University',
          'Name variation: Akash V. Sharma vs Aakash Sharma'
        ),
        extractedText: `DELHI TECHNOLOGICAL UNIVERSITY\nCONVOCATION PARCHMENT\nThis is to certify that Akash V. Sharma has completed the requirements for Doctor of Philosophy in Computer Science & Engineering\nRoll No: DTU/PHD/2021/489\nAwarded on 14th November 2021`,
        extractedFields: [
          { fieldName: 'applicantName', label: 'Candidate Name', value: 'Akash V. Sharma', confidence: 0.96, boundingBox: { x: 10, y: 35, width: 75, height: 10 } },
          { fieldName: 'qualification', label: 'Conferred Degree', value: 'Doctor of Philosophy (Computer Science)', confidence: 0.94 },
          { fieldName: 'registrationNumber', label: 'Convocation Roll No', value: 'DTU/PHD/2021/489', confidence: 0.95, boundingBox: { x: 10, y: 48, width: 45, height: 8 } },
          { fieldName: 'issueDate', label: 'Convocation Date', value: '14-11-2021', confidence: 0.91, boundingBox: { x: 55, y: 48, width: 35, height: 8 } },
          { fieldName: 'institutionName', label: 'University / Body', value: 'Delhi Technological University', confidence: 0.97 },
        ],
        qualityReport: {
          isReadable: true,
          blurScore: 89,
          blurDetected: false,
          resolutionRating: 'High',
          estimatedDPI: 300,
          hasTruncatedEdges: false,
          observations: ['Gold syndicate seal identified', 'High typography fidelity'],
        },
      },
      {
        id: 'doc-103',
        name: 'AICTE_Institutional_Approval_2026.pdf',
        category: 'Institutional Affiliation Proof',
        fileSize: '1.9 MB',
        mimeType: 'application/pdf',
        pageCount: 1,
        uploadedAt: '2026-10-22 10:22 IST',
        ocrStatus: 'completed',
        previewUrl: createSampleDocumentSvg(
          'AICTE Affiliation Approval Letter',
          'Institutional Affiliation Proof',
          'Dr. Aakash Sharma',
          'AICTE-FAC-2024-991',
          '02-01-2024',
          'All India Council for Technical Education'
        ),
        extractedText: `ALL INDIA COUNCIL FOR TECHNICAL EDUCATION\nExtension of Approval Letter\nFaculty Endorsement: Dr. Aakash Sharma\nDepartment: Artificial Intelligence & Data Science\nApproval ID: AICTE-FAC-2024-991\nDate: 02 January 2024`,
        extractedFields: [
          { fieldName: 'applicantName', label: 'Approved Faculty', value: 'Dr. Aakash Sharma', confidence: 0.97 },
          { fieldName: 'registrationNumber', label: 'Approval ID', value: 'AICTE-FAC-2024-991', confidence: 0.93 },
          { fieldName: 'issueDate', label: 'Issuance Date', value: '02-01-2024', confidence: 0.89 },
          { fieldName: 'expiryDate', label: 'Valid Up To', value: '31-12-2026', confidence: 0.91 },
          { fieldName: 'institutionName', label: 'Council / Board', value: 'All India Council for Technical Education', confidence: 0.98 },
        ],
        qualityReport: {
          isReadable: true,
          blurScore: 91,
          blurDetected: false,
          resolutionRating: 'High',
          estimatedDPI: 300,
          hasTruncatedEdges: false,
          observations: ['Watermark legible', 'Council signature digitally timestamped'],
        },
      },
    ],
    findings: [
      {
        id: 'find-sih-01',
        title: 'Applicant Legal Name Inconsistency Across Core Documents',
        severity: 'critical',
        ruleId: 'RULE-NAME-EXACT-MATCH',
        explanation: 'Identity Document lists legal name as "Aakash Sharma", whereas Doctoral Degree Certificate reads "Akash V. Sharma" with single "A" and added middle initial.',
        sourceDocumentId: 'doc-102',
        sourceDocumentName: 'PhD_Doctoral_Degree_Convocation.pdf',
        comparisonDocumentId: 'doc-101',
        comparisonDocumentName: 'Aadhaar_National_ID_Card.pdf',
        field: 'applicantName',
        observedValue: 'Akash V. Sharma',
        expectedValue: 'Aakash Sharma',
        pageNumber: 1,
        recommendedAction: 'Request candidate provide official gazette notification or university name correction certificate clarifying identity continuity.',
      },
      {
        id: 'find-sih-02',
        title: 'Missing Mandatory Document: Academic Transcript (Master/Bachelor)',
        severity: 'warning',
        ruleId: 'RULE-MANDATORY-DOCS',
        explanation: 'The application package does not contain an Academic Transcript, which is marked as mandatory for faculty accreditation.',
        sourceDocumentId: 'none',
        sourceDocumentName: 'Application Dossier',
        field: 'documentCategory',
        observedValue: 'Missing',
        expectedValue: 'Academic Transcript',
        pageNumber: 0,
        recommendedAction: 'Send automated document requisition alert to applicant for consolidated marksheet upload.',
      },
    ],
    activityTimeline: [
      {
        id: 'act-1',
        timestamp: '2026-10-22 10:14 IST',
        title: 'Application Created & Documents Uploaded',
        description: 'Uploaded 3 PDF files for AICTE Accreditation review.',
        actor: 'Dr. Aakash Sharma',
        type: 'upload',
      },
      {
        id: 'act-2',
        timestamp: '2026-10-22 10:24 IST',
        title: 'OCR Processing Completed',
        description: 'Extracted 13 structured fields across 3 documents.',
        actor: 'ML Kit / VeriCampus OCR Service',
        type: 'ocr',
      },
      {
        id: 'act-3',
        timestamp: '2026-10-22 10:25 IST',
        title: 'Cross-Document Validation Engine Triggered',
        description: 'Flagged 1 critical name variation finding and 1 missing mandatory document.',
        actor: 'VeriCampus Consistency Engine',
        type: 'rule_check',
      },
    ],
  },
  {
    id: 'case-sih-02',
    applicationId: 'SIH-2026-AP-9044',
    applicantName: 'Priya V. Patel',
    applicantEmail: 'priya.patel@biores.ac.in',
    applicantPhone: '+91 94280 11223',
    institutionName: 'Gujarat University of Life Sciences',
    programOrCourse: 'Research Fellow in Genomic Therapeutics',
    submissionDate: '2026-10-23',
    status: 'In Review',
    priority: 'Normal',
    isDemoSample: true,
    requiredDocumentTypes: [
      'Identity Proof',
      'Educational Certificate',
      'Professional Registration',
    ],
    reviewerNotes: 'Document quality on the Medical Council Registration card is slightly degraded. Expiry date falls within past calendar year.',
    documents: [
      {
        id: 'doc-201',
        name: 'Passport_Bio_Page.jpg',
        category: 'Identity Proof',
        fileSize: '2.1 MB',
        mimeType: 'image/jpeg',
        pageCount: 1,
        uploadedAt: '2026-10-23 14:02 IST',
        ocrStatus: 'completed',
        previewUrl: createSampleDocumentSvg(
          'Passport International Travel Document',
          'Identity Proof',
          'Priya V. Patel',
          'V8812903',
          '10-03-2022',
          'Ministry of External Affairs India'
        ),
        extractedText: `REPUBLIC OF INDIA\nPASSPORT\nType: P Country: IND\nPassport No: V8812903\nSurname: PATEL\nGiven Name: PRIYA V.\nNationality: INDIAN\nDOB: 28/09/1993`,
        extractedFields: [
          { fieldName: 'applicantName', label: 'Full Name', value: 'Priya V. Patel', confidence: 0.99 },
          { fieldName: 'registrationNumber', label: 'Passport Number', value: 'V8812903', confidence: 0.98 },
          { fieldName: 'issueDate', label: 'Date of Issue', value: '10-03-2022', confidence: 0.94 },
          { fieldName: 'expiryDate', label: 'Date of Expiry', value: '09-03-2032', confidence: 0.95 },
        ],
        qualityReport: {
          isReadable: true,
          blurScore: 92,
          blurDetected: false,
          resolutionRating: 'High',
          estimatedDPI: 300,
          hasTruncatedEdges: false,
          observations: ['MRZ strip legible', 'Anti-reflection holographic sheen normal'],
        },
      },
      {
        id: 'doc-202',
        name: 'State_Medical_Council_Registration.png',
        category: 'Professional Registration',
        fileSize: '3.4 MB',
        mimeType: 'image/png',
        pageCount: 1,
        uploadedAt: '2026-10-23 14:05 IST',
        ocrStatus: 'completed',
        previewUrl: createSampleDocumentSvg(
          'State Medical Council Registration Certificate',
          'Professional Registration',
          'Priya V. Patel',
          'GMC-REG-2019-881',
          '15-11-2019',
          'Gujarat Medical Council',
          'Council validity expired 31-12-2025'
        ),
        extractedText: `GUJARAT MEDICAL COUNCIL\nCertificate of Registration\nRegistered Medical Technologist: Priya V. Patel\nRegistration No: GMC-REG-2019-881\nValid Up To: 31-12-2025`,
        extractedFields: [
          { fieldName: 'applicantName', label: 'Registered Professional', value: 'Priya V. Patel', confidence: 0.96 },
          { fieldName: 'registrationNumber', label: 'Registration Number', value: 'GMC-REG-2019-881', confidence: 0.94 },
          { fieldName: 'issueDate', label: 'Registration Date', value: '15-11-2019', confidence: 0.90 },
          { fieldName: 'expiryDate', label: 'Validity Expiry Date', value: '31-12-2025', confidence: 0.95 },
        ],
        qualityReport: {
          isReadable: true,
          blurScore: 61,
          blurDetected: false,
          resolutionRating: 'Standard',
          estimatedDPI: 180,
          hasTruncatedEdges: false,
          observations: ['Slight contrast flattening near council stamp', 'Seal readable under zoom'],
        },
      },
    ],
    findings: [
      {
        id: 'find-sih-03',
        title: 'Professional Registration Validity Expired',
        severity: 'critical',
        ruleId: 'RULE-EXPIRY-CHECK',
        explanation: 'State Medical Council registration certificate indicates validity expired on 31-12-2025. Today is post-expiry date and no renewal endorsement receipt was supplied.',
        sourceDocumentId: 'doc-202',
        sourceDocumentName: 'State_Medical_Council_Registration.png',
        field: 'expiryDate',
        observedValue: '31-12-2025',
        expectedValue: 'Active / Post 2026',
        pageNumber: 1,
        recommendedAction: 'Request proof of renewal payment receipt or updated registration renewal certificate.',
      },
    ],
    activityTimeline: [
      {
        id: 'act-201',
        timestamp: '2026-10-23 14:02 IST',
        title: 'Dossier Uploaded',
        description: 'Applicant submitted 2 credentials for Research Fellowship review.',
        actor: 'Priya V. Patel',
        type: 'upload',
      },
      {
        id: 'act-202',
        timestamp: '2026-10-23 14:10 IST',
        title: 'Credential Expiry Flagged',
        description: 'Automated date evaluation flagged GMC-REG-2019-881 past validity date.',
        actor: 'VeriCampus Rules Engine',
        type: 'rule_check',
      },
    ],
  },
  {
    id: 'case-sih-03',
    applicationId: 'SIH-2026-AP-7732',
    applicantName: 'Rajesh Kumar Verma',
    applicantEmail: 'r.verma@nitr.ac.in',
    applicantPhone: '+91 97112 34567',
    institutionName: 'National Institute of Technology, Rourkela',
    programOrCourse: 'Senior Laboratory Director & Research Scientist',
    submissionDate: '2026-10-20',
    status: 'Completed',
    priority: 'Normal',
    isDemoSample: true,
    requiredDocumentTypes: [
      'Identity Proof',
      'Educational Certificate',
      'Academic Transcript',
    ],
    reviewerNotes: 'All 3 documents passed cross-document consistency without any discrepancies. Seal integrity and registry signatures fully authenticated.',
    documents: [
      {
        id: 'doc-301',
        name: 'Aadhaar_ID_Verified.pdf',
        category: 'Identity Proof',
        fileSize: '1.2 MB',
        mimeType: 'application/pdf',
        pageCount: 1,
        uploadedAt: '2026-10-20 09:15 IST',
        ocrStatus: 'completed',
        previewUrl: createSampleDocumentSvg(
          'Aadhaar National Identity Document',
          'Identity Proof',
          'Rajesh Kumar Verma',
          '7712-9901-4455',
          '11-04-2019',
          'UIDAI Government of India'
        ),
        extractedText: `GOVERNMENT OF INDIA\nName: Rajesh Kumar Verma\nUID: 7712 9901 4455\nDOB: 15/07/1985`,
        extractedFields: [
          { fieldName: 'applicantName', label: 'Name', value: 'Rajesh Kumar Verma', confidence: 0.99 },
          { fieldName: 'registrationNumber', label: 'Aadhaar UID', value: '7712-9901-4455', confidence: 0.98 },
          { fieldName: 'issueDate', label: 'Issue Date', value: '11-04-2019', confidence: 0.95 },
        ],
        qualityReport: {
          isReadable: true,
          blurScore: 96,
          blurDetected: false,
          resolutionRating: 'High',
          estimatedDPI: 300,
          hasTruncatedEdges: false,
          observations: ['Pristine visual fidelity', 'High contrast text'],
        },
      },
      {
        id: 'doc-302',
        name: 'MTech_Convocation_Certificate.pdf',
        category: 'Educational Certificate',
        fileSize: '2.5 MB',
        mimeType: 'application/pdf',
        pageCount: 1,
        uploadedAt: '2026-10-20 09:20 IST',
        ocrStatus: 'completed',
        previewUrl: createSampleDocumentSvg(
          'Master of Technology Degree Certificate',
          'Educational Certificate',
          'Rajesh Kumar Verma',
          'NITR/MTECH/2012/102',
          '28-09-2012',
          'National Institute of Technology Rourkela'
        ),
        extractedText: `NATIONAL INSTITUTE OF TECHNOLOGY ROURKELA\nMaster of Technology in Mechanical Engineering\nConferred to: Rajesh Kumar Verma\nRoll No: NITR/MTECH/2012/102\nDate: 28 September 2012`,
        extractedFields: [
          { fieldName: 'applicantName', label: 'Conferred Name', value: 'Rajesh Kumar Verma', confidence: 0.99 },
          { fieldName: 'qualification', label: 'Degree', value: 'Master of Technology', confidence: 0.98 },
          { fieldName: 'registrationNumber', label: 'Roll Number', value: 'NITR/MTECH/2012/102', confidence: 0.97 },
          { fieldName: 'issueDate', label: 'Date', value: '28-09-2012', confidence: 0.94 },
          { fieldName: 'institutionName', label: 'Institute', value: 'National Institute of Technology Rourkela', confidence: 0.99 },
        ],
        qualityReport: {
          isReadable: true,
          blurScore: 95,
          blurDetected: false,
          resolutionRating: 'High',
          estimatedDPI: 300,
          hasTruncatedEdges: false,
          observations: ['Syndicate embossed seal verified', 'Digitally counter-signed'],
        },
      },
    ],
    findings: [],
    decision: {
      decision: 'NO_ISSUES_FOUND',
      decidedAt: '2026-10-21 16:40 IST',
      reviewerName: 'Dr. Sunita K. Menon',
      reviewerId: 'REV-SIH-9924',
      reviewerDesignation: 'Senior Institutional Accreditation Evaluator',
      reviewerNotes: 'Verified all 3 credentials against national registry standards. No inconsistencies detected.',
      decisionReason: 'All extracted fields, names, and chronological dates correspond with 100% agreement.',
    },
    activityTimeline: [
      {
        id: 'act-301',
        timestamp: '2026-10-20 09:15 IST',
        title: 'Application Received',
        description: 'Complete dossier submitted for Senior Scientist review.',
        actor: 'Rajesh Kumar Verma',
        type: 'upload',
      },
      {
        id: 'act-302',
        timestamp: '2026-10-21 16:40 IST',
        title: 'Review Completed & Approved',
        description: 'Final decision logged: No issues identified by available checks.',
        actor: 'Dr. Sunita K. Menon',
        type: 'decision',
      },
    ],
  },
  {
    id: 'case-sih-04',
    applicationId: 'SIH-2026-INST-4412',
    applicantName: 'Apex Institute of Advanced Engineering',
    applicantEmail: 'registrar@apex-eng.edu.in',
    applicantPhone: '+91 22 4001 8899',
    institutionName: 'Apex Institute of Advanced Engineering, Pune',
    programOrCourse: 'New Campus Expansion Accreditation Grant',
    submissionDate: '2026-10-25',
    status: 'Pending',
    priority: 'High',
    isDemoSample: true,
    requiredDocumentTypes: [
      'Institutional Affiliation Proof',
      'Identity Proof',
      'Other Supporting Document',
    ],
    reviewerNotes: 'Initial institutional submission waiting for reviewer assignment and preliminary OCR batch reading.',
    documents: [
      {
        id: 'doc-401',
        name: 'Land_Ownership_Deed_Pune_Campus.pdf',
        category: 'Institutional Affiliation Proof',
        fileSize: '4.8 MB',
        mimeType: 'application/pdf',
        pageCount: 1,
        uploadedAt: '2026-10-25 11:20 IST',
        ocrStatus: 'idle',
        previewUrl: createSampleDocumentSvg(
          'Campus Land Title & Freehold Ownership Deed',
          'Institutional Affiliation Proof',
          'Apex Education Trust',
          'REG-PUNE-LAND-2016-991',
          '20-04-2016',
          'Sub-Registrar Office, Haveli Pune'
        ),
        extractedText: '',
        extractedFields: [],
      },
    ],
    findings: [],
    activityTimeline: [
      {
        id: 'act-401',
        timestamp: '2026-10-25 11:20 IST',
        title: 'Initial Campus Expansion Application Filed',
        description: 'Submitted 1 of 3 required documents. Awaiting evaluation.',
        actor: 'Apex Education Trust Registrar',
        type: 'upload',
      },
    ],
  },
];

export const INITIAL_DEMO_REPORTS: VerificationReport[] = [
  {
    id: 'rep-sih-7732',
    applicationId: 'SIH-2026-AP-7732',
    applicantName: 'Rajesh Kumar Verma',
    institutionName: 'National Institute of Technology, Rourkela',
    reportDate: '2026-10-21 16:45 IST',
    reviewerName: 'Dr. Sunita K. Menon',
    reviewerDesignation: 'Senior Institutional Accreditation Evaluator',
    decision: 'NO_ISSUES_FOUND',
    totalDocuments: 2,
    totalFindings: 0,
    criticalCount: 0,
    warningCount: 0,
    findings: [],
    verificationHash: '8f7a9d2c4e1b0f5e3d7a9b1c8e2f4a6c0b9d8e7f1a3c5e7a9b1d3f5e7c9b1d3f',
    reviewerNotes: 'Verified all credentials against institutional norms. No spelling, date, or identity discrepancies found.',
  },
];

export function formatCaseId(id: string): string {
  if (!id) return 'CASE-0000';
  return id.replace(/^SIH-(?:\d{4}-)?(?:AP-|INST-)?/i, 'CASE-');
}

const STORAGE_KEY_USER_CASE = 'vericampus_user_case_v2';
const STORAGE_KEY_USER_APPLICATIONS = 'vericampus_user_apps_v2';

export function createNewUserCase(): ApplicationCase {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return {
    id: `user-case-${Date.now()}`,
    applicationId: `CASE-${randomSuffix}`,
    applicantName: 'New Applicant',
    applicantEmail: '',
    applicantPhone: '',
    institutionName: 'Document Verification Dossier',
    programOrCourse: 'Accreditation Review',
    submissionDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    priority: 'Normal',
    isDemoSample: false,
    requiredDocumentTypes: [],
    reviewerNotes: '',
    documents: [],
    findings: [],
    activityTimeline: [],
  };
}

export function loadActiveUserCase(): ApplicationCase {
  try {
    // Clear stale v1 data if present
    localStorage.removeItem('vericampus_applications_v1');
    const raw = localStorage.getItem(STORAGE_KEY_USER_CASE);
    if (raw) {
      const parsed: ApplicationCase = JSON.parse(raw);
      if (!parsed.isDemoSample) {
        return {
          ...parsed,
          applicationId: formatCaseId(parsed.applicationId),
        };
      }
    }
  } catch (err) {
    console.error('Failed to load active user case from localStorage:', err);
  }
  const fresh = createNewUserCase();
  saveActiveUserCase(fresh);
  return fresh;
}

export function saveActiveUserCase(app: ApplicationCase) {
  try {
    if (!app.isDemoSample) {
      localStorage.setItem(STORAGE_KEY_USER_CASE, JSON.stringify(app));
    }
  } catch (err) {
    console.error('Failed to save active user case to localStorage:', err);
  }
}

// Local storage helper functions
export function loadApplications(): ApplicationCase[] {
  try {
    const userCase = loadActiveUserCase();
    const rawUserApps = localStorage.getItem(STORAGE_KEY_USER_APPLICATIONS);
    let userApps: ApplicationCase[] = [];
    if (rawUserApps) {
      const parsed = JSON.parse(rawUserApps);
      if (Array.isArray(parsed)) {
        userApps = parsed.filter((a) => !a.isDemoSample);
      }
    }

    // Merge active user case if not already in userApps
    const hasActiveCase = userApps.some((a) => a.id === userCase.id);
    const combinedUserApps = hasActiveCase ? userApps : [userCase, ...userApps];

    return [
      ...combinedUserApps.map((a) => ({ ...a, applicationId: formatCaseId(a.applicationId) })),
      ...INITIAL_DEMO_APPLICATIONS.map((a) => ({ ...a, applicationId: formatCaseId(a.applicationId) })),
    ];
  } catch (err) {
    console.error('Failed to load applications from localStorage:', err);
    return INITIAL_DEMO_APPLICATIONS;
  }
}

export function saveApplications(apps: ApplicationCase[]) {
  try {
    const userOnly = apps.filter((a) => !a.isDemoSample);
    localStorage.setItem(STORAGE_KEY_USER_APPLICATIONS, JSON.stringify(userOnly));
  } catch (err) {
    console.error('Failed to save applications to localStorage:', err);
  }
}

export function loadReports(): VerificationReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (!raw) {
      saveReports(INITIAL_DEMO_REPORTS);
      return INITIAL_DEMO_REPORTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load reports from localStorage:', err);
    return INITIAL_DEMO_REPORTS;
  }
}

export function saveReports(reports: VerificationReport[]) {
  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
  } catch (err) {
    console.error('Failed to save reports to localStorage:', err);
  }
}

export function loadReviewerProfile(): ReviewerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name && parsed.name.trim() !== '') {
        return parsed;
      }
    }
    return DEFAULT_REVIEWER_PROFILE;
  } catch {
    return DEFAULT_REVIEWER_PROFILE;
  }
}

export function saveReviewerProfile(profile: ReviewerProfile) {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save reviewer profile to localStorage:', err);
  }
}

export function resetToDemoData(): { applications: ApplicationCase[]; reports: VerificationReport[] } {
  saveApplications(INITIAL_DEMO_APPLICATIONS);
  saveReports(INITIAL_DEMO_REPORTS);
  return { applications: INITIAL_DEMO_APPLICATIONS, reports: INITIAL_DEMO_REPORTS };
}
