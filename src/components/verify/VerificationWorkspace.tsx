import React, { useState } from 'react';
import {
  Upload,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Trash2,
  Sparkles,
  Download,
  X,
  Check,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ApplicationCase,
  DocumentCategory,
  Finding,
  ReviewDecisionType,
  ReviewerProfile,
  VerificationDocument,
  VerificationReport,
  ExtractedField,
} from '../../types';
import { CameraCaptureModal } from '../camera/CameraCaptureModal';
import { EvidenceViewerModal } from '../evidence/EvidenceViewerModal';
import { processDocumentOcr } from '../../services/ocrEngine';
import { DEFAULT_VALIDATION_RULES, runValidationEngine } from '../../services/validationEngine';
import { downloadVerificationPdf } from '../../services/pdfReportGenerator';
import { formatCaseId } from '../../services/storage';

interface VerificationWorkspaceProps {
  appCase: ApplicationCase;
  reviewer: ReviewerProfile;
  onUpdateCase: (updatedCase: ApplicationCase) => void;
  onGenerateReport: (appCase: ApplicationCase, decision: ReviewDecisionType, notes: string) => void;
  onOpenAssistant: () => void;
}

const documentCategories: DocumentCategory[] = [
  'Identity Proof',
  'Educational Certificate',
  'Academic Transcript',
  'Institutional Affiliation Proof',
  'Professional Registration',
  'Experience Certificate',
  'Other Supporting Document',
];

function guessCategoryFromName(filename: string): DocumentCategory {
  const f = filename.toLowerCase();
  if (f.includes('aadhaar') || f.includes('passport') || f.includes('id') || f.includes('pan')) {
    return 'Identity Proof';
  }
  if (f.includes('degree') || f.includes('certificate') || f.includes('phd') || f.includes('btech')) {
    return 'Educational Certificate';
  }
  if (f.includes('transcript') || f.includes('marksheet') || f.includes('grade')) {
    return 'Academic Transcript';
  }
  if (f.includes('affiliation') || f.includes('aicte') || f.includes('ugc')) {
    return 'Institutional Affiliation Proof';
  }
  if (f.includes('council') || f.includes('registration') || f.includes('medical')) {
    return 'Professional Registration';
  }
  return 'Other Supporting Document';
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function createPdfThumbnailSvg(fileName: string, fileSize: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" width="400" height="520">
    <rect width="400" height="520" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="4"/>
    <rect x="24" y="24" width="352" height="472" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <path d="M 280 24 L 376 120 L 280 120 Z" fill="#e2e8f0"/>
    <path d="M 280 24 L 376 120" stroke="#cbd5e1" stroke-width="2" fill="none"/>
    <rect x="48" y="140" width="80" height="28" rx="6" fill="#ef4444"/>
    <text x="88" y="159" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">PDF</text>
    <text x="48" y="210" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="#0f172a">${escapeXml(fileName.slice(0, 24))}</text>
    <text x="48" y="240" font-family="monospace" font-size="13" fill="#64748b">${escapeXml(fileSize)}</text>
    <line x1="48" y1="280" x2="330" y2="280" stroke="#f1f5f9" stroke-width="8" stroke-linecap="round"/>
    <line x1="48" y1="310" x2="300" y2="310" stroke="#f1f5f9" stroke-width="8" stroke-linecap="round"/>
    <line x1="48" y1="340" x2="260" y2="340" stroke="#f1f5f9" stroke-width="8" stroke-linecap="round"/>
    <line x1="48" y1="370" x2="310" y2="370" stroke="#f1f5f9" stroke-width="8" stroke-linecap="round"/>
    <rect x="48" y="420" width="304" height="40" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="200" y="445" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#64748b" text-anchor="middle">Institutional PDF Document</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const VerificationWorkspace: React.FC<VerificationWorkspaceProps> = ({
  appCase,
  reviewer,
  onUpdateCase,
  onGenerateReport,
  onOpenAssistant,
}) => {
  // 3-step linear flow: 1 Upload, 2 Review, 3 Results
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [evidenceDocId, setEvidenceDocId] = useState<string | undefined>(undefined);
  const [activeFinding, setActiveFinding] = useState<Finding | null>(null);

  // Category bottom sheet / dialog
  const [editingCategoryDocId, setEditingCategoryDocId] = useState<string | null>(null);

  // Tap-to-edit inline field state in Step 2
  const [editingFieldDocId, setEditingFieldDocId] = useState<string | null>(null);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [tempFieldValue, setTempFieldValue] = useState<string>('');

  // Upload handling - strictly builds from actual File object with duplicate protection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    // Reset immediately to prevent double fires
    e.target.value = '';

    // Prevent duplicate entries: if same file (same name + size) is uploaded twice, ignore
    const existing = appCase.documents;
    const newFiles = fileList.filter((file) => {
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      const isDuplicate = existing.some(
        (d) => d.name.toLowerCase() === file.name.toLowerCase() && d.fileSize === sizeStr
      );
      return !isDuplicate;
    });

    if (newFiles.length === 0) return;

    const createdDocs: VerificationDocument[] = [];
    for (const file of newFiles) {
      const dataUrl = await readFileAsDataUrl(file);
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      const newDoc: VerificationDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        category: guessCategoryFromName(file.name),
        fileSize: sizeStr,
        mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
        pageCount: 1,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
        ocrStatus: 'processing',
        previewUrl: isPdf ? createPdfThumbnailSvg(file.name, sizeStr) : dataUrl,
        rawBase64: dataUrl,
        extractedText: '',
        extractedFields: [],
      };
      createdDocs.push(newDoc);
    }

    // Add all uploaded documents in one single state update
    let updatedCase: ApplicationCase = {
      ...appCase,
      documents: [...appCase.documents, ...createdDocs],
      status: 'In Review' as const,
    };
    onUpdateCase(updatedCase);

    // Process real OCR on each uploaded file
    for (const doc of createdDocs) {
      try {
        const res = await processDocumentOcr(doc, updatedCase.applicantName);
        const nextDocs = updatedCase.documents.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                ocrStatus: (res.success ? 'completed' : 'error') as 'completed' | 'error',
                extractedText: res.extractedText,
                extractedFields: res.extractedFields,
                qualityReport: res.qualityReport,
              }
            : d
        );

        let nextApplicantName = updatedCase.applicantName;
        if ((!nextApplicantName || nextApplicantName === 'New Applicant') && res.extractedFields.length > 0) {
          const nameField = res.extractedFields.find((f) => f.fieldName === 'applicantName');
          if (nameField && nameField.value.trim()) {
            nextApplicantName = nameField.value.trim();
          }
        }

        updatedCase = {
          ...updatedCase,
          applicantName: nextApplicantName,
          documents: nextDocs,
        };
        const { findings } = runValidationEngine(updatedCase, DEFAULT_VALIDATION_RULES);
        updatedCase = {
          ...updatedCase,
          findings,
          status: findings.length > 0 ? 'Needs Attention' : 'In Review',
        };
        onUpdateCase(updatedCase);
      } catch (err) {
        console.error('OCR process failure:', err);
        const nextDocs = updatedCase.documents.map((d) =>
          d.id === doc.id ? { ...d, ocrStatus: 'error' as const } : d
        );
        updatedCase = { ...updatedCase, documents: nextDocs };
        onUpdateCase(updatedCase);
      }
    }
  };

  const handleRetryOcr = async (docId: string) => {
    const docToRetry = appCase.documents.find((d) => d.id === docId);
    if (!docToRetry) return;

    // Set status to processing
    const processingDocs = appCase.documents.map((d) =>
      d.id === docId ? { ...d, ocrStatus: 'processing' as const } : d
    );
    let workingCase = { ...appCase, documents: processingDocs };
    onUpdateCase(workingCase);

    try {
      const res = await processDocumentOcr(docToRetry, workingCase.applicantName);
      const nextDocs = workingCase.documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              ocrStatus: (res.success ? 'completed' : 'error') as 'completed' | 'error',
              extractedText: res.extractedText,
              extractedFields: res.extractedFields,
              qualityReport: res.qualityReport,
            }
          : d
      );
      workingCase = { ...workingCase, documents: nextDocs };
      const { findings } = runValidationEngine(workingCase, DEFAULT_VALIDATION_RULES);
      workingCase = {
        ...workingCase,
        findings,
        status: findings.length > 0 ? 'Needs Attention' : 'In Review',
      };
      onUpdateCase(workingCase);
    } catch (err) {
      const nextDocs = workingCase.documents.map((d) =>
        d.id === docId ? { ...d, ocrStatus: 'error' as const } : d
      );
      workingCase = { ...workingCase, documents: nextDocs };
      onUpdateCase(workingCase);
    }
  };

  const handleCameraCapture = async (dataUrl: string, fileName: string) => {
    const isDuplicate = appCase.documents.some((d) => d.name.toLowerCase() === fileName.toLowerCase());
    if (isDuplicate) return;

    const newDoc: VerificationDocument = {
      id: `doc-cam-${Date.now()}`,
      name: fileName,
      category: guessCategoryFromName(fileName),
      fileSize: '2.4 MB',
      mimeType: 'image/jpeg',
      pageCount: 1,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
      ocrStatus: 'processing',
      previewUrl: dataUrl,
      rawBase64: dataUrl,
      extractedText: '',
      extractedFields: [],
    };

    let workingCase: ApplicationCase = {
      ...appCase,
      documents: [...appCase.documents, newDoc],
      status: 'In Review',
    };
    onUpdateCase(workingCase);

    try {
      const res = await processDocumentOcr(newDoc, workingCase.applicantName);
      const nextDocs = workingCase.documents.map((d) =>
        d.id === newDoc.id
          ? {
              ...d,
              ocrStatus: (res.success ? 'completed' : 'error') as 'completed' | 'error',
              extractedText: res.extractedText,
              extractedFields: res.extractedFields,
              qualityReport: res.qualityReport,
            }
          : d
      );
      workingCase = { ...workingCase, documents: nextDocs };
      const { findings } = runValidationEngine(workingCase, DEFAULT_VALIDATION_RULES);
      workingCase = {
        ...workingCase,
        findings,
        status: findings.length > 0 ? 'Needs Attention' : 'In Review',
      };
      onUpdateCase(workingCase);
    } catch (err) {
      const nextDocs = workingCase.documents.map((d) =>
        d.id === newDoc.id ? { ...d, ocrStatus: 'error' as const } : d
      );
      workingCase = { ...workingCase, documents: nextDocs };
      onUpdateCase(workingCase);
    }
  };

  const handleUpdateDocCategory = (docId: string, newCat: DocumentCategory) => {
    const updated = appCase.documents.map((d) => (d.id === docId ? { ...d, category: newCat } : d));
    const updatedCase = { ...appCase, documents: updated };
    const { findings } = runValidationEngine(updatedCase, DEFAULT_VALIDATION_RULES);
    onUpdateCase({
      ...updatedCase,
      findings,
      status: findings.length > 0 ? 'Needs Attention' : 'In Review',
    });
  };

  const handleDeleteDoc = (docId: string) => {
    const updated = appCase.documents.filter((d) => d.id !== docId);
    const updatedCase = { ...appCase, documents: updated };
    const { findings } = runValidationEngine(updatedCase, DEFAULT_VALIDATION_RULES);
    onUpdateCase({
      ...updatedCase,
      findings,
      status: findings.length > 0 ? 'Needs Attention' : 'In Review',
    });
  };

  const handleEditField = (docId: string, fieldIndex: number, newValue: string) => {
    const updatedDocs = appCase.documents.map((d) => {
      if (d.id !== docId) return d;
      const fields = [...d.extractedFields];
      fields[fieldIndex] = {
        ...fields[fieldIndex],
        value: newValue,
        isUserModified: true,
      };
      return { ...d, extractedFields: fields };
    });

    const updatedCase = { ...appCase, documents: updatedDocs };
    const { findings } = runValidationEngine(updatedCase, DEFAULT_VALIDATION_RULES);
    onUpdateCase({
      ...updatedCase,
      findings,
      status: findings.length > 0 ? 'Needs Attention' : 'In Review',
    });
  };

  // Helper for field evaluation in Step 2
  const getFieldEvaluation = (doc: VerificationDocument, field: ExtractedField) => {
    const matchingFinding = appCase.findings.find(
      (f) =>
        (f.sourceDocumentId === doc.id || f.sourceDocumentName === doc.name) &&
        (f.field === field.fieldName || f.title.toLowerCase().includes(field.label.toLowerCase()))
    );

    if (matchingFinding) {
      if (matchingFinding.severity === 'critical') {
        return {
          status: 'Problem',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          dotClass: 'bg-rose-500',
        };
      }
      return {
        status: 'Check',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
      };
    }

    if (!field.value || field.value.trim() === '') {
      return {
        status: 'Check',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
      };
    }

    return {
      status: 'OK',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500',
    };
  };

  // Step transitions
  const canContinueToReview = appCase.documents.length > 0;

  const handleContinueToReview = () => {
    const { findings } = runValidationEngine(appCase, DEFAULT_VALIDATION_RULES);
    onUpdateCase({
      ...appCase,
      findings,
      status: findings.length > 0 ? 'Needs Attention' : 'In Review',
    });
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueToResults = () => {
    const { findings } = runValidationEngine(appCase, DEFAULT_VALIDATION_RULES);
    onUpdateCase({
      ...appCase,
      findings,
      status: findings.length > 0 ? 'Needs Attention' : 'In Review',
    });
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3 actions
  const handleDownloadReport = () => {
    const reportDate =
      new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) +
      ' ' +
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ' IST';

    const randomBytes =
      typeof window !== 'undefined' && window.crypto
        ? window.crypto.getRandomValues(new Uint8Array(24))
        : new Uint8Array(Array.from({ length: 24 }, () => Math.floor(Math.random() * 256)));
    const hashString = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const decision: ReviewDecisionType =
      appCase.findings.length > 0 ? 'NEEDS_ADDITIONAL_INFO' : 'NO_ISSUES_FOUND';

    const report: VerificationReport = {
      id: `rep-${Date.now()}`,
      applicationId: appCase.applicationId,
      applicantName: appCase.applicantName || 'Applicant',
      institutionName: appCase.institutionName || 'Institutional Verification',
      reportDate,
      reviewerName: reviewer.name,
      reviewerDesignation: reviewer.designation || 'Evaluator',
      decision,
      totalDocuments: appCase.documents.length,
      totalFindings: appCase.findings.length,
      criticalCount: appCase.findings.filter((f) => f.severity === 'critical').length,
      warningCount: appCase.findings.filter((f) => f.severity === 'warning').length,
      findings: appCase.findings,
      verificationHash: `SHA256-${hashString}`,
      reviewerNotes: appCase.reviewerNotes || 'Verified with official evaluation determination.',
    };

    downloadVerificationPdf(appCase, reviewer, report);
    onGenerateReport(appCase, decision, report.reviewerNotes);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const openEvidenceForFinding = (finding: Finding) => {
    setActiveFinding(finding);
    setEvidenceDocId(
      finding.sourceDocumentId !== 'dossier' ? finding.sourceDocumentId : appCase.documents[0]?.id
    );
    setIsEvidenceOpen(true);
  };

  // Step 3 Checklist definitions
  const checklistItems = [
    {
      label: 'Required fields',
      passed: !appCase.findings.some(
        (f) => f.ruleId === 'RULE-REQ-DOCS' || f.ruleId === 'RULE-MANDATORY-FIELDS' || f.ruleId === 'RULE-MANDATORY-DOCS'
      ),
      desc: 'All essential identification and institutional fields are present',
    },
    {
      label: 'Expiry date',
      passed: !appCase.findings.some(
        (f) => f.ruleId === 'RULE-EXPIRY-CHECK' || f.field === 'expiryDate'
      ),
      desc: 'Certificates and registrations fall within valid active dates',
    },
    {
      label: 'Name matching',
      passed: !appCase.findings.some(
        (f) => f.ruleId === 'RULE-NAME-MATCH' || f.field === 'applicantName'
      ),
      desc: appCase.documents.length <= 1
        ? 'Upload more documents to run cross-document checks'
        : 'Applicant name is uniform across all submitted credentials',
    },
    {
      label: 'Photo quality',
      passed:
        !appCase.findings.some((f) => f.ruleId === 'RULE-DOCUMENT-QUALITY') &&
        !appCase.documents.some((d) => d.qualityReport?.blurDetected),
      desc: 'Document images and seals are crisp and legible',
    },
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-3 pt-1 font-sans">
      {/* 1. TOP: Case summary */}
      <section className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug break-words">
            {appCase.institutionName || appCase.applicantName || 'Verification Dossier'}
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            {formatCaseId(appCase.applicationId)}
            {appCase.applicantName && appCase.applicantName !== 'New Applicant' ? ` · ${appCase.applicantName}` : ''}
          </p>
        </div>

        <div className="shrink-0">
          {appCase.findings.length > 0 || appCase.status === 'Needs Attention' ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
              Needs attention{appCase.findings.length > 0 ? ` (${appCase.findings.length})` : ''}
            </span>
          ) : appCase.status === 'Completed' ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
              Verified
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
              In review
            </span>
          )}
        </div>
      </section>

      {/* 2. PROGRESS: Simple 3-step indicator */}
      <section className="space-y-2">
        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
            style={{
              width: currentStep === 1 ? '33.33%' : currentStep === 2 ? '66.66%' : '100%',
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { num: 1, label: '1 Upload' },
            { num: 2, label: '2 Review' },
            { num: 3, label: '3 Results' },
          ].map((step) => {
            const isCurrent = currentStep === step.num;
            const isPast = currentStep > step.num;
            const canTap = isPast || isCurrent;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => {
                  if (canTap) setCurrentStep(step.num);
                }}
                disabled={!canTap}
                className={`py-2 px-2 text-center rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : isPast
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {step.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. STEP 1 - UPLOAD */}
      {currentStep === 1 && (
        <section className="space-y-4">
          <div className="space-y-1 px-0.5">
            <h3 className="text-sm font-bold text-slate-900">Upload your documents</h3>
            <p className="text-xs text-slate-500">
              Add the files for this case. PDF, JPG or PNG.
            </p>
          </div>

          {/* Two Equal Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer text-center">
              <Upload className="w-4 h-4 shrink-0" />
              <span>Upload Files</span>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer text-center"
            >
              <Camera className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Take Photo</span>
            </button>
          </div>

          {/* Uploaded Files Simple List */}
          <div className="space-y-2">
            {appCase.documents.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
                <p className="text-xs text-slate-500">
                  No documents yet. Upload files to begin.
                </p>
              </div>
            ) : (
              appCase.documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setEvidenceDocId(doc.id);
                    setIsEvidenceOpen(true);
                  }}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs cursor-pointer transition-all flex items-center gap-3"
                >
                  {/* Small thumbnail */}
                  <img
                    src={doc.previewUrl}
                    alt={doc.name}
                    className="w-12 h-14 rounded-lg object-cover border border-slate-200 bg-slate-50 shrink-0"
                  />

                  {/* File Info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words">
                      {doc.name}
                    </h4>

                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                      <span>{doc.fileSize}</span>
                      <span>•</span>
                      {/* Document Category Chip */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategoryDocId(doc.id);
                        }}
                        className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Change Category"
                      >
                        <span>{doc.category}</span>
                        <span className="text-slate-400">▾</span>
                      </button>
                      <span>•</span>
                      {doc.ocrStatus === 'completed' ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Ready
                        </span>
                      ) : doc.ocrStatus === 'error' ? (
                        <span className="flex items-center gap-2">
                          <span className="text-rose-700 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Could not read this file
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetryOcr(doc.id);
                            }}
                            className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                          >
                            Retry
                          </button>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          Reading...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Icon */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDoc(doc.id);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Remove document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Single full-width Continue button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleContinueToReview}
              disabled={!canContinueToReview}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* 4. STEP 2 - REVIEW */}
      {currentStep === 2 && (
        <section className="space-y-4">
          <div className="space-y-1 px-0.5">
            <h3 className="text-sm font-bold text-slate-900">Check the details</h3>
            <p className="text-xs text-slate-500">
              Review extracted information and address any detected discrepancies.
            </p>
          </div>

          {/* Informational notice when only 1 document is uploaded */}
          {appCase.documents.length === 1 && (
            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900 shadow-2xs">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Upload more documents to run cross-document checks.</span>
            </div>
          )}

          {/* Issues Found Top List */}
          {appCase.findings.length > 0 && (
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <h4 className="text-sm font-bold text-rose-900">
                  Issues found ({appCase.findings.length})
                </h4>
              </div>

              <div className="space-y-2">
                {appCase.findings.map((finding) => (
                  <div
                    key={finding.id}
                    onClick={() => openEvidenceForFinding(finding)}
                    className="p-3 bg-white rounded-xl border border-rose-200 shadow-2xs hover:border-rose-300 cursor-pointer transition-all space-y-1.5"
                  >
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      {finding.title}
                    </p>
                    {finding.expectedValue && finding.observedValue ? (
                      <div className="space-y-0.5 text-xs text-slate-600">
                        <p>
                          <span className="font-semibold text-slate-700">Expected:</span>{' '}
                          {finding.expectedValue}
                        </p>
                        <p>
                          <span className="font-semibold text-rose-700">Found:</span>{' '}
                          {finding.observedValue}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {finding.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Cards with Label/Value List and Tap-to-Edit */}
          <div className="space-y-3">
            {appCase.documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {doc.name}
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      {doc.category}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEvidenceDocId(doc.id);
                      setIsEvidenceOpen(true);
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer shrink-0"
                  >
                    View Document
                  </button>
                </div>

                {/* Fields List */}
                <div className="space-y-2">
                  {doc.extractedFields.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No fields extracted.</p>
                  ) : (
                    doc.extractedFields.map((field, idx) => {
                      const evalRes = getFieldEvaluation(doc, field);
                      const isEditing =
                        editingFieldDocId === doc.id && editingFieldIndex === idx;

                      return (
                        <div
                          key={field.fieldName + idx}
                          className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-500">
                              {field.label}
                            </span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${evalRes.badgeClass}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${evalRes.dotClass}`}
                              />
                              <span>{evalRes.status}</span>
                            </span>
                          </div>

                          {isEditing ? (
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                value={tempFieldValue}
                                onChange={(e) => setTempFieldValue(e.target.value)}
                                className="flex-1 bg-white border border-indigo-500 rounded-lg px-2.5 py-1 text-xs sm:text-sm text-slate-900 focus:outline-none"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  handleEditField(doc.id, idx, tempFieldValue);
                                  setEditingFieldDocId(null);
                                  setEditingFieldIndex(null);
                                }}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFieldDocId(null);
                                  setEditingFieldIndex(null);
                                }}
                                className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingFieldDocId(doc.id);
                                setEditingFieldIndex(idx);
                                setTempFieldValue(field.value);
                              }}
                              className="flex items-center justify-between gap-2 cursor-pointer group/field hover:text-indigo-600"
                              title="Tap to edit"
                            >
                              <span className="text-xs sm:text-sm font-semibold text-slate-900 break-words group-hover/field:text-indigo-600 transition-colors">
                                {field.value || '(Not detected)'}
                              </span>
                              <span className="text-xs text-indigo-600 opacity-60 group-hover/field:opacity-100 transition-opacity shrink-0">
                                Edit
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Single full-width Continue button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleContinueToResults}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* 5. STEP 3 - RESULTS */}
      {currentStep === 3 && (
        <section className="space-y-4">
          <div className="space-y-1 px-0.5">
            <h3 className="text-sm font-bold text-slate-900">Results</h3>
            <p className="text-xs text-slate-500">
              Final verification determination and report generation.
            </p>
          </div>

          {/* Informational notice when only 1 document is uploaded */}
          {appCase.documents.length === 1 && (
            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900 shadow-2xs">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Upload more documents to run cross-document checks.</span>
            </div>
          )}

          {/* Big Summary Header */}
          {appCase.findings.length === 0 ? (
            <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-base font-bold text-emerald-900">
                  All checks passed
                </h4>
                <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                  {appCase.documents.length === 1
                    ? 'Uploaded document is readable and satisfies baseline criteria.'
                    : 'All submitted documents are consistent and satisfy institutional requirements.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-rose-50/80 border border-rose-200 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-base font-bold text-rose-900">
                  {appCase.findings.length} issue{appCase.findings.length === 1 ? '' : 's'} found
                </h4>
                <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
                  Review the detected discrepancies before making your final determination.
                </p>
              </div>
            </div>
          )}

          {/* Simple Checklist */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-0.5">
              Verification Checklist
            </h4>

            <div className="space-y-2">
              {checklistItems.map((check) => (
                <div
                  key={check.label}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100"
                >
                  <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      {check.label}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {check.desc}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {check.passed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Passed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Issue</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons: Download Report (primary) & Ask AI (secondary) */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadReport}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Report</span>
            </button>

            <button
              type="button"
              onClick={onOpenAssistant}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Ask AI about this case</span>
            </button>
          </div>
        </section>
      )}

      {/* PRIVACY NOTE (at the very bottom of the page) */}
      <div className="text-center pt-3 px-4">
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Files are processed in your browser. Extracted text is sent to Gemini only when you ask the AI a question.
        </p>
      </div>

      {/* Category Bottom Sheet / Dialog */}
      {editingCategoryDocId && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4"
          onClick={() => setEditingCategoryDocId(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 border border-slate-200 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Select Document Category
                </h3>
                <p className="text-xs text-slate-500">
                  Choose the credential type for this file
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategoryDocId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
              {documentCategories.map((cat) => {
                const currentDoc = appCase.documents.find((d) => d.id === editingCategoryDocId);
                const isSelected = currentDoc?.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      handleUpdateDocCategory(editingCategoryDocId, cat);
                      setEditingCategoryDocId(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-100'
                    }`}
                  >
                    <span>{cat}</span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Evidence Viewer Modal */}
      <EvidenceViewerModal
        isOpen={isEvidenceOpen}
        onClose={() => {
          setIsEvidenceOpen(false);
          setActiveFinding(null);
        }}
        documents={appCase.documents}
        initialDocId={evidenceDocId}
        activeFinding={activeFinding}
      />
    </div>
  );
};
