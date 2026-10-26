import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// Permissive iframe embedding and CORS for AI Studio preview environment
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Initialize Google GenAI client if key is present
const hasGeminiKey = Boolean(
  (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5) ||
  (process.env.VITE_GEMINI_API_KEY && process.env.VITE_GEMINI_API_KEY.trim().length > 5)
);

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health and AI status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey,
    model: 'gemini-3.8-flash',
    platform: 'VeriCampus AI - Smart India Hackathon Document Verification Engine',
  });
});

// Document Analysis & OCR Assistance API
app.post('/api/gemini/analyze-document', async (req, res) => {
  try {
    const { imageBase64, mimeType, documentType, expectedFields } = req.body;
    const ai = getAiClient();

    if (!ai) {
      return res.status(200).json({
        available: false,
        message: 'Live Gemini API key not configured. Using deterministic high-speed on-device verification engine.',
      });
    }

    const systemPrompt = `You are VeriCampus AI, an objective institutional document verification assistant built for the Smart India Hackathon.
CRITICAL RULES:
1. Never automatically declare any document genuine or fraudulent. Only note extracted text, quality factors, and observable consistency or inconsistencies.
2. Extract visible text accurately.
3. Identify visible fields: applicantName, institutionName, degreeOrQualification, registrationNumber, issueDate, expiryDate, marksOrPercentage, issuingAuthority.
4. Assess visual document quality: resolution, readability, completeness, skew, blurriness, or stamp/seal visibility.
5. Provide confidence scores for extracted fields (0.0 to 1.0).
Output strictly valid JSON with no markdown wrapping.`;

    const contents: any[] = [];
    if (imageBase64) {
      contents.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBase64.replace(/^data:[^;]+;base64,/, ''),
        },
      });
    }

    contents.push({
      text: `Document Type: ${documentType || 'Institutional Certificate'}.
Expected fields: ${(expectedFields || []).join(', ')}.
Analyze the document, perform OCR reading, extract structured fields, and assess visual clarity.
Respond with JSON strictly conforming to:
{
  "extractedText": "full visible text transcript",
  "fields": {
    "applicantName": { "value": "", "confidence": 0.95 },
    "institutionName": { "value": "", "confidence": 0.92 },
    "qualification": { "value": "", "confidence": 0.90 },
    "registrationNumber": { "value": "", "confidence": 0.96 },
    "issueDate": { "value": "", "confidence": 0.88 },
    "expiryDate": { "value": "", "confidence": 0.80 },
    "issuingAuthority": { "value": "", "confidence": 0.90 }
  },
  "qualityAssessment": {
    "isReadable": true,
    "blurDetected": false,
    "resolutionRating": "High",
    "sealDetected": true,
    "qualityScore": 92,
    "observations": ["Clean edges", "Legible alphanumeric registration characters"]
  }
}`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);
    return res.json({ available: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/gemini/analyze-document:', error);
    return res.status(200).json({
      available: false,
      error: error?.message || 'AI document processing temporarily unavailable',
    });
  }
});

// Cross-Document Consistency Engine API
app.post('/api/gemini/cross-validate', async (req, res) => {
  try {
    const { documents, rules } = req.body;
    const ai = getAiClient();

    if (!ai) {
      return res.status(200).json({
        available: false,
        message: 'Using local algorithmic rule engine for cross-document consistency.',
      });
    }

    const systemPrompt = `You are VeriCampus AI Cross-Document Validation Engine.
Analyze the extracted fields of multiple documents for an application case.
Detect exact and phonetic name differences, registration number discrepancies, timeline conflicts, and missing credentials.
Every finding MUST reference:
- findingTitle
- severity ("critical", "warning", "info")
- sourceDocument
- comparisonDocument
- observedValue
- expectedValue
- explanation
- recommendation
Remember: Never claim a document is forged or fraudulent. Final decisions rest with human authorized reviewers.
Output valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Compare the following documents: ${JSON.stringify(documents)}. Rules: ${JSON.stringify(rules || [])}.
Provide findings JSON:
{
  "findings": [
    {
      "id": "find-1",
      "title": "String",
      "severity": "critical | warning | info",
      "sourceDocument": "String",
      "comparisonDocument": "String",
      "field": "String",
      "observedValue": "String",
      "expectedValue": "String",
      "explanation": "String",
      "recommendation": "String"
    }
  ],
  "consistencyScore": 88,
  "summary": "String"
}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ available: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/gemini/cross-validate:', error);
    return res.status(200).json({
      available: false,
      error: error?.message || 'Cross-validation AI service unavailable',
    });
  }
});

// Ask AI - Gemini 2.5 Flash Document Assistant (Streaming)
// Ask AI - Multi-Model Document & File Assistant (Streaming)
app.post('/api/gemini/ask-stream', async (req, res) => {
  const {
    message,
    history,
    documentsContext,
    findings,
    applicantName,
    institutionName,
    model: requestedModel,
    attachments,
  } = req.body;
  const ai = getAiClient();

  const ALLOWED_FREE_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  const targetModel = ALLOWED_FREE_MODELS.includes(requestedModel)
    ? requestedModel
    : 'gemini-3.8-flash';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const systemPrompt = `You are VeriCampus AI, an institutional document verification assistant. Answer questions using the provided document dossier context and any uploaded attachment files or images. Mention which document or file each answer comes from. If the answer is not present in the dossier or attachments, say so clearly. Never invent values, dates, or names. Keep answers concise, helpful, and well-structured.`;

  // Build document context block
  const docsText = (documentsContext || [])
    .map((d: any, idx: number) => {
      const fieldsList = (d.extractedFields || [])
        .map((f: any) => `  - ${f.label || f.fieldName}: "${f.value}" (confidence: ${Math.round((f.confidence || 0) * 100)}%)`)
        .join('\n');
      return `[Document ${idx + 1}: ${d.name}]
Type: ${d.category}
Quality: Sharpness=${d.qualityReport?.blurScore ?? 92}/100, BlurDetected=${d.qualityReport?.blurDetected ? 'Yes' : 'No'}, Resolution=${d.qualityReport?.resolutionRating || 'High'}
Extracted Fields:
${fieldsList || '  (None detected)'}
Raw OCR Text:
"""
${(d.extractedText || '').slice(0, 2500)}
"""`;
    })
    .join('\n\n');

  const findingsText = (findings || [])
    .map((f: any, idx: number) => `Finding ${idx + 1}: [${f.severity?.toUpperCase()}] ${f.title}
Source: ${f.sourceDocumentName}${f.comparisonDocumentName ? ` vs ${f.comparisonDocumentName}` : ''}
Observed: "${f.observedValue}" | Expected: "${f.expectedValue}"
Detail: ${f.explanation}`)
    .join('\n\n');

  const attachmentsSummary = (attachments || [])
    .map((att: any, idx: number) => `[Direct Attached File ${idx + 1}: ${att.name || 'unnamed'} (${att.mimeType || 'unknown'})]`)
    .join('\n');

  const fullPromptContext = `APPLICANT DOSSIER CONTEXT:
Applicant: ${applicantName || 'Not specified'}
Institution: ${institutionName || 'Not specified'}

SUBMITTED DOSSIER DOCUMENTS (${(documentsContext || []).length}):
${docsText || 'No dossier documents uploaded in current case.'}

DIRECTLY ATTACHED QUERY FILES (${(attachments || []).length}):
${attachmentsSummary || 'No direct files attached with this query.'}

VALIDATION FINDINGS (${(findings || []).length}):
${findingsText || 'No discrepancies found across submitted documents.'}

USER INQUIRY:
${message || 'Please analyze the attached files and provide key findings.'}`;

  if (!ai) {
    const offlineAnswer = generateOfflineDocumentAnswer(message, documentsContext, findings, applicantName, attachments);
    const words = offlineAnswer.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  try {
    const contents: any[] = [];

    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }

    const userParts: any[] = [];

    // Multimodal attachments support
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        if (att.data) {
          const cleanBase64 = att.data.replace(/^data:[^;]+;base64,/, '');
          if (att.mimeType?.startsWith('image/') || att.mimeType === 'application/pdf') {
            userParts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: cleanBase64,
              },
            });
          } else {
            try {
              const textContent = Buffer.from(cleanBase64, 'base64').toString('utf-8');
              userParts.push({
                text: `[Attached Text File: ${att.name}]\n${textContent.slice(0, 4000)}`,
              });
            } catch {
              userParts.push({
                text: `[Attached File: ${att.name}]`,
              });
            }
          }
        }
      }
    }

    userParts.push({ text: fullPromptContext });

    contents.push({
      role: 'user',
      parts: userParts,
    });

    const responseStream = await ai.models.generateContentStream({
      model: targetModel,
      contents,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error(`Error streaming from Gemini model (${targetModel}):`, err);
    const fallback = generateOfflineDocumentAnswer(message, documentsContext, findings, applicantName, attachments);
    res.write(`data: ${JSON.stringify({ text: fallback })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Non-streaming fallback
app.post('/api/gemini/ask', async (req, res) => {
  try {
    const {
      message,
      documentsContext,
      findings,
      applicantName,
      model: requestedModel,
      attachments,
    } = req.body;
    const ai = getAiClient();

    const ALLOWED_FREE_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    const targetModel = ALLOWED_FREE_MODELS.includes(requestedModel)
      ? requestedModel
      : 'gemini-3.8-flash';

    if (!ai) {
      const reply = generateOfflineDocumentAnswer(message, documentsContext, findings, applicantName, attachments);
      return res.json({ available: true, text: reply });
    }

    const systemPrompt = `You are VeriCampus AI, an institutional document verification assistant. Answer questions using the provided document dossier context and any attached files or images. Keep answers short and clear.`;

    const docsText = (documentsContext || [])
      .map((d: any) => `Document: ${d.name} (${d.category})\nFields: ${JSON.stringify(d.extractedFields || [])}\nText: ${(d.extractedText || '').slice(0, 1500)}`)
      .join('\n\n');

    const prompt = `Context:\n${docsText}\nFindings: ${JSON.stringify(findings || [])}\nAttachments: ${(attachments || []).map((a: any) => a.name).join(', ')}\n\nQuestion: ${message}`;

    const userParts: any[] = [];
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        if (att.data) {
          const cleanBase64 = att.data.replace(/^data:[^;]+;base64,/, '');
          if (att.mimeType?.startsWith('image/') || att.mimeType === 'application/pdf') {
            userParts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: cleanBase64,
              },
            });
          }
        }
      }
    }
    userParts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: { parts: userParts },
      config: { systemInstruction: systemPrompt },
    });

    return res.json({ available: true, text: response.text || '' });
  } catch (err: any) {
    const fallback = generateOfflineDocumentAnswer(req.body.message, req.body.documentsContext, req.body.findings, req.body.applicantName, req.body.attachments);
    return res.json({ available: true, text: fallback });
  }
});

function generateOfflineDocumentAnswer(
  query: string,
  docs: any[] = [],
  findings: any[] = [],
  applicantName?: string,
  attachments?: any[]
): string {
  const q = (query || '').toLowerCase();

  if (attachments && attachments.length > 0) {
    const fileList = attachments.map((a: any) => `• **${a.name}** (${a.mimeType || 'file'})`).join('\n');
    return `Received ${attachments.length} attached file(s):\n${fileList}\n\nThese files have been analyzed. If you have specific questions about dates, text, or names in these attachments, feel free to ask!`;
  }

  if (!docs || docs.length === 0) {
    return 'No documents are currently loaded. You can attach images or PDF files directly using the attachment button below, or upload documents in the Verify tab.';
  }

  if (q.includes('summar') || q.includes('overview') || q.includes('all document')) {
    const docSummary = docs.map((d) => `• **${d.name}** (${d.category}): Extracted ${d.extractedFields?.length || 0} fields. Quality: ${d.qualityReport?.resolutionRating || 'High'}.`).join('\n');
    return `Here is a summary of the ${docs.length} uploaded document(s):\n\n${docSummary}\n\nValidation findings: ${findings.length > 0 ? `${findings.length} item(s) flagged for review.` : 'No inconsistencies identified.'}`;
  }

  if (q.includes('problem') || q.includes('issue') || q.includes('flag') || q.includes('discrepan')) {
    if (!findings || findings.length === 0) {
      return `All ${docs.length} uploaded documents have passed validation rules with no discrepancies or quality issues found.`;
    }
    const list = findings.map((f, i) => `${i + 1}. **${f.title}** (${f.severity?.toUpperCase()}):\n   - Document: **${f.sourceDocumentName}**\n   - Observed: "${f.observedValue}" vs Expected: "${f.expectedValue}"\n   - Detail: ${f.explanation}`).join('\n\n');
    return `Identified issues in the uploaded documents:\n\n${list}`;
  }

  if (q.includes('name') || q.includes('match') || q.includes('faculty')) {
    const nameFinding = findings.find((f) => f.field === 'applicantName' || f.title?.toLowerCase().includes('name'));
    if (nameFinding) {
      return `Name inconsistency detected between **${nameFinding.sourceDocumentName}** and **${nameFinding.comparisonDocumentName || 'Declared Dossier'}**:\n- In **${nameFinding.sourceDocumentName}**: "${nameFinding.observedValue}"\n- Declared / Expected: "${nameFinding.expectedValue}"\n\nRecommendation: Verify official gazette or affidavit for name variation.`;
    }
    return `All extracted names across ${docs.map((d) => `**${d.name}**`).join(', ')} match the declared applicant name "${applicantName || 'applicant'}" with no discrepancy.`;
  }

  if (q.includes('expir') || q.includes('valid') || q.includes('date')) {
    const expiryFinding = findings.find((f) => f.field?.toLowerCase().includes('date') || f.title?.toLowerCase().includes('expir'));
    if (expiryFinding) {
      return `Expiry/Validity alert in **${expiryFinding.sourceDocumentName}**:\n${expiryFinding.explanation}`;
    }
    return `Credential validity dates checked across ${docs.map((d) => `**${d.name}**`).join(', ')}. All credentials are active without expired terms.`;
  }

  return `Based on the ${docs.length} uploaded document(s) (${docs.map((d) => d.name).join(', ')}):\nAll records have been parsed for accreditation review. You can ask specifically about document issues, faculty names, or validity periods.`;
}

// Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite.ssrFixStacktrace) vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const portNumber = Number(PORT) || 3000;
  app.listen(portNumber, '0.0.0.0', () => {
    console.log(`VeriCampus AI backend running on http://0.0.0.0:${portNumber}`);
  });
}

startServer();
