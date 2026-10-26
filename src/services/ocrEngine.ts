import { ExtractedField, VerificationDocument } from '../types';
import { analyzeImageQuality, getDefaultQualityReport } from './qualityEngine';

export interface OcrProcessResult {
  success: boolean;
  extractedText: string;
  extractedFields: ExtractedField[];
  qualityReport: any;
}

export async function processDocumentOcr(
  doc: VerificationDocument,
  _applicantName?: string
): Promise<OcrProcessResult> {
  const base64Data = doc.rawBase64 || doc.previewUrl;
  const isImageOrPdf = base64Data && (
    base64Data.startsWith('data:image/') ||
    base64Data.startsWith('data:application/pdf') ||
    doc.mimeType?.startsWith('image/') ||
    doc.mimeType === 'application/pdf'
  );

  let qualityReport = getDefaultQualityReport();
  if (base64Data && base64Data.startsWith('data:image/')) {
    try {
      qualityReport = await analyzeImageQuality(base64Data, doc.category);
    } catch {
      qualityReport = getDefaultQualityReport();
    }
  }

  if (isImageOrPdf) {
    try {
      const response = await fetch('/api/gemini/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: doc.mimeType || 'image/jpeg',
          documentType: doc.category,
          expectedFields: [
            'applicantName',
            'registrationNumber',
            'qualification',
            'issueDate',
            'expiryDate',
            'institutionName',
            'issuingAuthority',
          ],
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.available && json.data) {
          const geminiData = json.data;
          const fields: ExtractedField[] = [];

          if (geminiData.fields && typeof geminiData.fields === 'object') {
            for (const [key, val] of Object.entries(geminiData.fields) as any) {
              if (val && typeof val.value === 'string' && val.value.trim().length > 0) {
                fields.push({
                  fieldName: key,
                  label: formatFieldLabel(key),
                  value: val.value.trim(),
                  confidence: typeof val.confidence === 'number' ? val.confidence : 0.92,
                  boundingBox: getFieldBoundingBox(key),
                });
              }
            }
          }

          const realText = typeof geminiData.extractedText === 'string' ? geminiData.extractedText.trim() : '';
          const hasContent = realText.length > 0 || fields.length > 0;

          if (hasContent) {
            return {
              success: true,
              extractedText: realText,
              extractedFields: fields,
              qualityReport,
            };
          }
        }
      }
    } catch (err) {
      console.warn('Real OCR call error:', err);
    }
  }

  // If extraction fails or finds nothing, do NOT fabricate or simulate any values!
  return {
    success: false,
    extractedText: '',
    extractedFields: [],
    qualityReport,
  };
}

function formatFieldLabel(key: string): string {
  const map: Record<string, string> = {
    applicantName: 'Full Legal Name',
    institutionName: 'Issuing Authority / Institution',
    qualification: 'Conferred Qualification',
    registrationNumber: 'Registration / Roll Number',
    issueDate: 'Date of Issuance',
    expiryDate: 'Validity Expiry Date',
    issuingAuthority: 'Syndicate Registrar Authority',
  };
  return map[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
}

function getFieldBoundingBox(key: string) {
  const boxMap: Record<string, { x: number; y: number; width: number; height: number }> = {
    applicantName: { x: 10, y: 35, width: 80, height: 10 },
    registrationNumber: { x: 10, y: 48, width: 45, height: 8 },
    issueDate: { x: 55, y: 48, width: 35, height: 8 },
    expiryDate: { x: 55, y: 56, width: 35, height: 8 },
    qualification: { x: 10, y: 22, width: 80, height: 8 },
    institutionName: { x: 10, y: 6, width: 80, height: 12 },
  };
  return boxMap[key] || { x: 15, y: 40, width: 70, height: 10 };
}
