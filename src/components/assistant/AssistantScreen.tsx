import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Copy, Check, ShieldAlert, ArrowRight, CornerDownRight } from 'lucide-react';
import { ApplicationCase, ReviewerProfile } from '../../types';

interface AssistantScreenProps {
  currentCase?: ApplicationCase | null;
  reviewer: ReviewerProfile;
  onApplyDraftNote?: (note: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    noteSnippet?: string;
  };
}

export const AssistantScreen: React.FC<AssistantScreenProps> = ({
  currentCase,
  reviewer,
  onApplyDraftNote,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `Hello ${reviewer.name}. I am the VeriCampus AI Verification Copilot.
I analyze cross-document extracted data, explain discrepancy findings, and help you draft evidence-backed accreditation notes.
How can I assist your case evaluation today?`,
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'Explain why legal name was flagged as critical',
    'Summarize all pending discrepancies in this case',
    'Draft comprehensive reviewer evaluation notes',
    'Check chronological order of degrees and experience',
    'What evidence should be requested from the applicant?',
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          context: {
            applicantName: currentCase?.applicantName,
            applicationId: currentCase?.applicationId,
            institution: currentCase?.institutionName,
            status: currentCase?.status,
            documents: currentCase?.documents.map((d) => ({
              name: d.name,
              category: d.category,
              fields: d.extractedFields,
            })),
            findings: currentCase?.findings,
          },
        }),
      });

      let aiReply = '';
      if (response.ok) {
        const json = await response.json();
        if (json.reply) {
          aiReply = json.reply;
        }
      }

      if (!aiReply) {
        // High-precision offline rule knowledge fallback
        aiReply = generateOfflineAssistantReply(query, currentCase);
      }

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: aiReply.includes('DRAFT REVIEWER NOTE:')
          ? {
              label: 'Apply to Reviewer Notes',
              noteSnippet: extractDraftNoteSnippet(aiReply),
            }
          : undefined,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const fallbackReply = generateOfflineAssistantReply(query, currentCase);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      {/* Assistant Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">VeriCampus AI Copilot</h2>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                SIH Assist
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Active Context: {currentCase ? `${currentCase.applicantName} (${currentCase.applicationId})` : 'Institutional Verification Rules'}
            </p>
          </div>
        </div>

        {currentCase && (
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-700">
            <span>{currentCase.documents.length} Docs</span>
            <span>·</span>
            <span className={currentCase.findings.length > 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700'}>
              {currentCase.findings.length} Findings
            </span>
          </div>
        )}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'ai' && (
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>

              {m.suggestedAction && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-indigo-600 font-medium">Ready to insert into dossier</span>
                  {onApplyDraftNote && (
                    <button
                      onClick={() => onApplyDraftNote(m.suggestedAction?.noteSnippet || m.text)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 text-xs font-medium transition-colors"
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                      {m.suggestedAction.label}
                    </button>
                  )}
                </div>
              )}

              <div className={`flex items-center justify-between mt-2 pt-1 text-[10px] ${m.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                <span>{m.timestamp}</span>
                <button
                  onClick={() => copyMessage(m.id, m.text)}
                  className={`hover:opacity-100 transition-colors flex items-center gap-1 ${m.sender === 'user' ? 'text-indigo-100 hover:text-white' : 'hover:text-slate-700'}`}
                >
                  {copiedId === m.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-bl-none text-xs text-slate-500 flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-slate-600">Analyzing cross-document evidence &amp; rules...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2.5 bg-white border-t border-slate-200 overflow-x-auto flex items-center gap-2">
        <span className="text-[11px] font-medium text-slate-500 shrink-0">Suggestions:</span>
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs whitespace-nowrap border border-slate-200 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about discrepancies, rule findings, or request draft notes..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isProcessing}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
        <div className="mt-2 text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          <span>VeriCampus AI assists inquiry. Findings must be substantiated by authorized human reviewer evaluation.</span>
        </div>
      </div>
    </div>
  );
};

function extractDraftNoteSnippet(text: string): string {
  const match = text.match(/DRAFT REVIEWER NOTE:([\s\S]*?)(?:$|\n\n[A-Z])/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return text;
}

function generateOfflineAssistantReply(query: string, appCase?: ApplicationCase | null): string {
  const q = query.toLowerCase();

  if (!appCase) {
    return `In VeriCampus AI, you can inspect applications, examine high-resolution document scans, run ML Kit OCR extraction, and evaluate cross-document consistency rules.
Please select an application case to unlock contextual discrepancy inquiry.`;
  }

  if (q.includes('name') || q.includes('spelling') || q.includes('identity')) {
    const nameFinding = appCase.findings.find((f) => f.field === 'applicantName');
    if (nameFinding) {
      return `ANALYSIS OF LEGAL NAME DISCREPANCY:
Document Reference: ${nameFinding.sourceDocumentName} vs ${nameFinding.comparisonDocumentName || 'Declared Dossier'}.
Observed Value: "${nameFinding.observedValue}"
Expected Value: "${nameFinding.expectedValue}"

Reason for Warning:
The OCR extraction observed a character-level discrepancy between documents. In institutional accreditation, exact concordance of the candidate's legal name across identity credentials and degree parchments is mandatory to prevent credential substitution.

RECOMMENDED ACTION:
1. Verify if the candidate has an official Gazette Notification or Affidavit for spelling adjustment.
2. Require the applicant to submit an institutional name endorsement certificate before final sign-off.`;
    }
  }

  if (q.includes('draft') || q.includes('note') || q.includes('summary')) {
    const findingsList = appCase.findings.map((f, i) => `${i + 1}. [${f.severity.toUpperCase()}] ${f.title}`).join('\n');
    return `DRAFT REVIEWER NOTE:
Case Reference: ${appCase.applicationId} - ${appCase.applicantName}
Institution: ${appCase.institutionName}

Evaluation Summary:
Conducted automated optical character recognition and multi-document consistency checks on ${appCase.documents.length} submitted credentials.

Audit Observations:
${findingsList || 'All cross-document comparisons exhibited complete concordance without discrepancy.'}

Evaluation Conclusion:
${
  appCase.findings.length > 0
    ? 'Recommended Status: Needs Additional Information. Candidate must clarify identified discrepancies prior to accreditation grant.'
    : 'Recommended Status: Approved. No discrepancies or inconsistencies detected across submitted records.'
}
Evaluated by Authorized Reviewer.`;
  }

  if (q.includes('expiry') || q.includes('validity') || q.includes('date')) {
    return `CREDENTIAL VALIDITY ANALYSIS:
Evaluating certificates for active registration against 2026 academic accreditation guidelines.
Documents with expired term limits require valid renewal receipts or updated council endorsement stamps.`;
  }

  return `Observation on ${appCase.applicantName}'s Case:
- Total Documents Uploaded: ${appCase.documents.length}
- Current Evaluation Status: ${appCase.status}
- Identified Findings: ${appCase.findings.length}
- Recommended Next Step: Review evidence highlights in the Evidence Viewer, inspect highlighted regions, and formulate final reviewer determination.`;
}
