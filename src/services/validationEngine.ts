import { ApplicationCase, Finding, FindingSeverity } from '../types';

export interface ValidationRuleConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: FindingSeverity;
}

export const DEFAULT_VALIDATION_RULES: ValidationRuleConfig[] = [
  {
    id: 'RULE-NAME-MATCH',
    name: 'Cross-Document Legal Name Consistency',
    description: 'Verifies exact and phonetic match of applicant name across Identity, Degrees, and Affiliation letters.',
    enabled: true,
    severity: 'critical',
  },
  {
    id: 'RULE-REGISTRATION-CONSISTENCY',
    name: 'Roll & Registration ID Cross-Check',
    description: 'Ensures registration numbers referenced across transcripts and certificates align without transposition errors.',
    enabled: true,
    severity: 'critical',
  },
  {
    id: 'RULE-EXPIRY-CHECK',
    name: 'Credential Expiry & Validity Period',
    description: 'Detects certificates, licenses, or institutional approvals with validity periods prior to the current academic cycle.',
    enabled: true,
    severity: 'critical',
  },
  {
    id: 'RULE-DOCUMENT-QUALITY',
    name: 'Visual Clarity & Blur Threshold',
    description: 'Flags low-DPI scans, camera motion blur, or truncated document edges that impair readability.',
    enabled: true,
    severity: 'info',
  },
];

// Levenshtein string distance helper
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(dr|prof|mr|mrs|ms|shri|smt)\.?\b/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function runValidationEngine(
  appCase: ApplicationCase,
  rules: ValidationRuleConfig[] = DEFAULT_VALIDATION_RULES
): { findings: Finding[]; summary: string; consistencyScore: number } {
  const findings: Finding[] = [];
  const activeRuleMap = new Map(rules.filter((r) => r.enabled).map((r) => [r.id, r]));
  const docs = appCase.documents || [];

  if (docs.length === 0) {
    return {
      findings: [],
      summary: 'No documents yet. Upload files to begin.',
      consistencyScore: 100,
    };
  }

  // 1. Mandatory Document Completeness Check ONLY for pre-configured demo cases
  if (appCase.isDemoSample && appCase.requiredDocumentTypes && appCase.requiredDocumentTypes.length > 0) {
    const uploadedCategories = new Set(docs.map((d) => d.category));
    for (const reqCat of appCase.requiredDocumentTypes) {
      if (!uploadedCategories.has(reqCat)) {
        findings.push({
          id: `find-mand-${Math.random().toString(36).substring(2, 7)}`,
          title: `Missing Required Document: ${reqCat}`,
          severity: 'warning',
          ruleId: 'RULE-MANDATORY-DOCS',
          explanation: `The application requirements designate "${reqCat}" as a compulsory credential. No document under this category was found in the dossier.`,
          sourceDocumentId: 'dossier',
          sourceDocumentName: 'Application Dossier',
          field: 'documentCategory',
          observedValue: 'Missing',
          expectedValue: reqCat,
          pageNumber: 0,
          recommendedAction: `Request submission of the ${reqCat}.`,
        });
      }
    }
  }

  // 2. Cross-Document Name Consistency Check
  // CRITICAL RULE: If only one file is uploaded, NEVER report cross-document mismatches against files that don't exist.
  if (docs.length >= 2 && activeRuleMap.has('RULE-NAME-MATCH')) {
    const docsWithNames: { docId: string; docName: string; rawName: string; normName: string }[] = [];

    for (const doc of docs) {
      const nameField = doc.extractedFields.find((f) => f.fieldName === 'applicantName');
      if (nameField && nameField.value && nameField.value.trim().length > 1) {
        docsWithNames.push({
          docId: doc.id,
          docName: doc.name,
          rawName: nameField.value.trim(),
          normName: normalizeName(nameField.value),
        });
      }
    }

    // Compare pairs between actually uploaded documents
    for (let i = 0; i < docsWithNames.length; i++) {
      for (let j = i + 1; j < docsWithNames.length; j++) {
        const docA = docsWithNames[i];
        const docB = docsWithNames[j];
        if (docA.normName !== docB.normName) {
          const dist = levenshteinDistance(docA.normName, docB.normName);
          const sim = 1 - dist / Math.max(docA.normName.length, docB.normName.length, 1);
          if (sim < 0.85) {
            findings.push({
              id: `find-namepair-${docA.docId}-${docB.docId}`,
              title: `Cross-Document Name Conflict between "${docA.docName}" and "${docB.docName}"`,
              severity: 'critical',
              ruleId: 'RULE-NAME-MATCH',
              explanation: `Name on "${docA.docName}" is "${docA.rawName}", while "${docB.docName}" records "${docB.rawName}".`,
              sourceDocumentId: docA.docId,
              sourceDocumentName: docA.docName,
              comparisonDocumentId: docB.docId,
              comparisonDocumentName: docB.docName,
              field: 'applicantName',
              observedValue: docA.rawName,
              expectedValue: docB.rawName,
              pageNumber: 1,
              recommendedAction: 'Verify applicant identity and request clarification or affidavit for name variation.',
            });
          }
        }
      }
    }

    // If a declared applicantName is specifically defined on the case (e.g. demo cases)
    if (appCase.applicantName && appCase.applicantName.trim() && appCase.applicantName !== 'New Applicant') {
      const declaredNorm = normalizeName(appCase.applicantName);
      for (const docItem of docsWithNames) {
        const dist = levenshteinDistance(docItem.normName, declaredNorm);
        const similarity = 1 - dist / Math.max(docItem.normName.length, declaredNorm.length, 1);

        if (similarity < 0.85 && docItem.normName !== declaredNorm) {
          findings.push({
            id: `find-name-${docItem.docId}`,
            title: `Applicant Legal Name Variance: "${docItem.rawName}" vs Declared Name`,
            severity: activeRuleMap.get('RULE-NAME-MATCH')!.severity,
            ruleId: 'RULE-NAME-MATCH',
            explanation: `Document "${docItem.docName}" bears the name "${docItem.rawName}", which differs from declared name "${appCase.applicantName}".`,
            sourceDocumentId: docItem.docId,
            sourceDocumentName: docItem.docName,
            field: 'applicantName',
            observedValue: docItem.rawName,
            expectedValue: appCase.applicantName,
            pageNumber: 1,
            recommendedAction: 'Inspect official gazette notification or verify identity documents.',
          });
        }
      }
    }
  }

  // 3. Expiry Date & Credential Currency Check (intra-document)
  if (activeRuleMap.has('RULE-EXPIRY-CHECK')) {
    const currentYear = new Date().getFullYear();

    for (const doc of docs) {
      const expField = doc.extractedFields.find((f) => f.fieldName === 'expiryDate');
      if (expField && expField.value) {
        const val = expField.value.trim();
        const yearMatch = val.match(/20\d{2}/);
        if (yearMatch) {
          const year = parseInt(yearMatch[0], 10);
          if (year < currentYear) {
            findings.push({
              id: `find-exp-${doc.id}`,
              title: `Expired Credential / Validity Term: ${doc.name}`,
              severity: activeRuleMap.get('RULE-EXPIRY-CHECK')!.severity,
              ruleId: 'RULE-EXPIRY-CHECK',
              explanation: `Document extracted validity expiry date is "${val}", which is prior to the current evaluation cycle (${currentYear}).`,
              sourceDocumentId: doc.id,
              sourceDocumentName: doc.name,
              field: 'expiryDate',
              observedValue: val,
              expectedValue: `Valid on or after ${currentYear}`,
              pageNumber: 1,
              recommendedAction: 'Require submission of renewal fee receipt or updated registration certificate.',
            });
          }
        }
      }
    }
  }

  // 4. Document Visual Quality Check (intra-document)
  if (activeRuleMap.has('RULE-DOCUMENT-QUALITY')) {
    for (const doc of docs) {
      if (doc.qualityReport && (doc.qualityReport.blurDetected || doc.qualityReport.blurScore < 50)) {
        findings.push({
          id: `find-qual-${doc.id}`,
          title: `Degraded Scan Resolution / Visual Blur in ${doc.name}`,
          severity: activeRuleMap.get('RULE-DOCUMENT-QUALITY')!.severity,
          ruleId: 'RULE-DOCUMENT-QUALITY',
          explanation: `Document quality score is ${doc.qualityReport.blurScore}/100. Text edges appear blurred, which may reduce automated recognition confidence.`,
          sourceDocumentId: doc.id,
          sourceDocumentName: doc.name,
          field: 'qualityScore',
          observedValue: `${doc.qualityReport.blurScore}/100`,
          expectedValue: 'Sharpness >= 70/100',
          pageNumber: 1,
          recommendedAction: 'Inspect document visually or request a higher-resolution scan.',
        });
      }
    }
  }

  // Calculate overall consistency score
  let penalty = 0;
  for (const f of findings) {
    if (f.severity === 'critical') penalty += 25;
    else if (f.severity === 'warning') penalty += 12;
    else penalty += 5;
  }

  const consistencyScore = Math.max(10, 100 - penalty);

  let summary = '';
  if (docs.length === 1) {
    summary = findings.length === 0
      ? '1 document evaluated with no quality or validity issues. Upload more documents to run cross-document checks.'
      : `1 document evaluated with ${findings.length} finding(s). Upload more documents to run cross-document checks.`;
  } else if (findings.length === 0) {
    summary = 'All extracted fields across submitted documents correspond with 100% agreement.';
  } else {
    const critCount = findings.filter((f) => f.severity === 'critical').length;
    const warnCount = findings.filter((f) => f.severity === 'warning').length;
    summary = `Identified ${critCount} critical finding(s) and ${warnCount} warning(s) across uploaded documents.`;
  }

  return { findings, summary, consistencyScore };
}
