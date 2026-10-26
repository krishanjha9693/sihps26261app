export type DocumentCategory =
  | 'Identity Proof'
  | 'Educational Certificate'
  | 'Academic Transcript'
  | 'Institutional Affiliation Proof'
  | 'Professional Registration'
  | 'Experience Certificate'
  | 'Other Supporting Document';

export type ApplicationStatus =
  | 'Pending'
  | 'In Review'
  | 'Needs Attention'
  | 'Completed';

export type PriorityLevel = 'High' | 'Normal' | 'Low';

export type FindingSeverity = 'critical' | 'warning' | 'info';

export interface ExtractedField {
  fieldName: string;
  label: string;
  value: string;
  confidence: number; // 0.0 - 1.0
  isUserModified?: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number }; // Percentage 0-100
}

export interface DocumentQualityReport {
  isReadable: boolean;
  blurScore: number; // 0-100 (higher is sharper)
  blurDetected: boolean;
  resolutionRating: 'High' | 'Standard' | 'Low' | 'Insufficient';
  estimatedDPI: number;
  hasTruncatedEdges: boolean;
  duplicateHashMatch?: string;
  observations: string[];
}

export interface VerificationDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  fileSize: string;
  mimeType: string;
  pageCount: number;
  uploadedAt: string;
  previewUrl: string; // Data URL or asset path
  rawBase64?: string;
  ocrStatus: 'idle' | 'processing' | 'completed' | 'error';
  extractedText: string;
  extractedFields: ExtractedField[];
  qualityReport?: DocumentQualityReport;
}

export interface Finding {
  id: string;
  title: string;
  severity: FindingSeverity;
  ruleId: string;
  explanation: string;
  sourceDocumentId: string;
  sourceDocumentName: string;
  comparisonDocumentId?: string;
  comparisonDocumentName?: string;
  field: string;
  observedValue: string;
  expectedValue: string;
  pageNumber: number;
  evidenceRegion?: { x: number; y: number; width: number; height: number };
  recommendedAction: string;
  reviewerDismissed?: boolean;
}

export type ReviewDecisionType =
  | 'NO_ISSUES_FOUND'
  | 'NEEDS_ADDITIONAL_INFO'
  | 'REQUIRES_MANUAL_VERIFICATION'
  | 'COMPLETED_WITH_FINDINGS';

export interface FinalDecision {
  decision: ReviewDecisionType;
  decidedAt: string;
  reviewerName: string;
  reviewerId: string;
  reviewerDesignation: string;
  reviewerNotes: string;
  decisionReason: string;
}

export interface ActivityTimelineItem {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  actor: string;
  type: 'upload' | 'ocr' | 'quality' | 'rule_check' | 'decision' | 'report';
}

export interface ApplicationCase {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  institutionName: string;
  programOrCourse: string;
  applicationId: string; // e.g. SIH-2026-AP-8921
  submissionDate: string;
  status: ApplicationStatus;
  priority: PriorityLevel;
  requiredDocumentTypes: DocumentCategory[];
  documents: VerificationDocument[];
  findings: Finding[];
  decision?: FinalDecision;
  activityTimeline: ActivityTimelineItem[];
  reviewerNotes: string;
  isDemoSample?: boolean;
}

export interface VerificationReport {
  id: string;
  applicationId: string;
  applicantName: string;
  institutionName: string;
  reportDate: string;
  reviewerName: string;
  reviewerDesignation?: string;
  decision: ReviewDecisionType;
  totalDocuments: number;
  totalFindings: number;
  criticalCount: number;
  warningCount: number;
  findings: Finding[];
  verificationHash: string; // SHA-256 style evidence fingerprint
  reviewerNotes: string;
}

export interface ReviewerProfile {
  name: string;
  email: string;
  reviewerId: string;
  designation?: string;
  institution?: string;
  role?: string;
  phone?: string;
  theme: 'dark' | 'light' | 'system';
  language: string;
  soundFeedback: boolean;
  compactCards: boolean;
}
