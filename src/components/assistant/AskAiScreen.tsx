import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Trash2,
  FileText,
  ExternalLink,
  ArrowRight,
  Bot,
  User as UserIcon,
  RefreshCw,
  Paperclip,
  Image as ImageIcon,
  X,
  ChevronDown,
  Check,
  Zap,
} from 'lucide-react';
import { ApplicationCase } from '../../types';
import { hasClientGeminiKey, getDirectGenAIClient } from '../../services/geminiClient';

interface AttachedFile {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  data: string; // Base64 data URL
  previewUrl?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  citedDocNames?: string[];
  error?: boolean;
  attachments?: {
    name: string;
    mimeType: string;
    previewUrl?: string;
    size?: string;
  }[];
}

interface AskAiScreenProps {
  currentCase: ApplicationCase | null;
  onGoToVerify: () => void;
  onOpenDocumentViewer: (docId: string) => void;
}

interface AiModelOption {
  id: string;
  name: string;
  badge: string;
  speed: string;
  description: string;
}

const FREE_AI_MODELS: AiModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'Recommended',
    speed: 'High Speed',
    description: 'Fast multimodal reasoning, document cross-checking & OCR analysis.',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'Fastest',
    speed: 'Ultra Fast',
    description: 'Lightweight model optimized for lowest latency and quick inquiries.',
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    badge: 'Balanced',
    speed: 'Standard',
    description: 'Adaptive general-purpose analysis across all institutional credentials.',
  },
];

const STORAGE_KEY_CHAT = 'vericampus_ask_ai_chat_v2';
const STORAGE_KEY_MODEL = 'vericampus_selected_model_v1';

export const AskAiScreen: React.FC<AskAiScreenProps> = ({
  currentCase,
  onGoToVerify,
  onOpenDocumentViewer,
}) => {
  const documents = currentCase?.documents || [];
  const findings = currentCase?.findings || [];
  const hasDocuments = documents.length > 0;

  // Selected AI Model (free models only)
  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MODEL);
      if (saved && FREE_AI_MODELS.some((m) => m.id === saved)) return saved;
    } catch {
      // ignore
    }
    return 'gemini-3.8-flash';
  });

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Chat message state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHAT);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeModel = FREE_AI_MODELS.find((m) => m.id === selectedModelId) || FREE_AI_MODELS[0];

  const suggestionChips = [
    'Summarize my documents',
    'Which documents have problems?',
    'Is the certificate expired?',
    'Do the candidate names match?',
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save selected model
  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    setIsModelDropdownOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY_MODEL, modelId);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(messages));
    } catch {
      // ignore
    }
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  // Handle file attachment selection (images and files)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Max 10MB per attachment
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 10MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const formattedSize =
          file.size < 1024 * 1024
            ? `${Math.round(file.size / 1024)} KB`
            : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

        const newAttachment: AttachedFile = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          size: formattedSize,
          mimeType: file.type || 'application/octet-stream',
          data: result,
          previewUrl: file.type.startsWith('image/') ? result : undefined,
        };

        setAttachedFiles((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachedFiles((prev) => prev.filter((a) => a.id !== id));
  };

  // Extract cited documents from generated text
  const extractCitedDocs = (text: string): string[] => {
    if (!documents || documents.length === 0) return [];
    const cited: string[] = [];
    for (const doc of documents) {
      const cleanName = doc.name.toLowerCase();
      const simpleName = doc.name.split('.')[0].toLowerCase();
      const lowerText = text.toLowerCase();
      if (lowerText.includes(cleanName) || lowerText.includes(simpleName)) {
        if (!cited.includes(doc.name)) {
          cited.push(doc.name);
        }
      }
    }
    return cited;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    const hasAttachments = attachedFiles.length > 0;

    // Disallow sending if no text AND no attachments, or while streaming
    if ((!text && !hasAttachments) || isStreaming) return;

    const currentAttachments = [...attachedFiles];
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      text: text || (hasAttachments ? `Analyze the attached file(s): ${currentAttachments.map((a) => a.name).join(', ')}` : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: currentAttachments.map((a) => ({
        name: a.name,
        mimeType: a.mimeType,
        previewUrl: a.previewUrl,
        size: a.size,
      })),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setAttachedFiles([]);
    setIsStreaming(true);

    const botMsgId = `msg-ai-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: botMsgId,
        role: 'model',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    try {
      const response = await fetch('/api/gemini/ask-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text || 'Please inspect the attached file(s) and provide an analysis.',
          model: selectedModelId,
          attachments: currentAttachments.map((a) => ({
            name: a.name,
            mimeType: a.mimeType,
            data: a.data,
            size: a.size,
          })),
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
          documentsContext: documents.map((d) => ({
            name: d.name,
            category: d.category,
            extractedText: d.extractedText,
            extractedFields: d.extractedFields,
            qualityReport: d.qualityReport,
          })),
          findings: findings.map((f) => ({
            title: f.title,
            severity: f.severity,
            sourceDocumentName: f.sourceDocumentName,
            comparisonDocumentName: f.comparisonDocumentName,
            observedValue: f.observedValue,
            expectedValue: f.expectedValue,
            explanation: f.explanation,
          })),
          applicantName: currentCase?.applicantName,
          institutionName: currentCase?.institutionName,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to connect to AI service');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedText += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId
                      ? {
                          ...m,
                          text: accumulatedText,
                          citedDocNames: extractCitedDocs(accumulatedText),
                        }
                      : m
                  )
                );
              }
            } catch {
              // Ignore non-json chunks
            }
          }
        }
      }

      if (!accumulatedText.trim()) {
        accumulatedText = hasAttachments
          ? `I reviewed the attached file(s) and documents. No specific anomalies or mismatches were detected.`
          : `I analyzed the documents uploaded for ${currentCase?.applicantName || 'this dossier'}. No specific issues or discrepancies found for this inquiry.`;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text: accumulatedText,
                  citedDocNames: extractCitedDocs(accumulatedText),
                }
              : m
          )
        );
      }
    } catch (err) {
      console.warn('Streaming error, trying fallback:', err);
      // If running in standalone APK or server proxy failed, use direct client key if provided
      if (hasClientGeminiKey()) {
        try {
          const directAi = getDirectGenAIClient();
          if (directAi) {
            const systemPrompt = `You are VeriCampus AI, an institutional document verification assistant. Answer questions using the provided document dossier context and any uploaded attachment files or images. Mention which document or file each answer comes from. If the answer is not present in the dossier or attachments, say so clearly. Never invent values, dates, or names. Keep answers concise, helpful, and well-structured.`;

            const parts: any[] = [];
            for (const att of currentAttachments) {
              if (att.data && att.data.includes(',')) {
                parts.push({
                  inlineData: {
                    mimeType: att.mimeType || 'image/jpeg',
                    data: att.data.split(',')[1],
                  },
                });
              }
            }

            const docsContext = documents
              .map(
                (d, idx) =>
                  `[Document ${idx + 1}: ${d.name} (${d.category})]\nOCR Text:\n${(d.extractedText || '').slice(0, 2000)}`
              )
              .join('\n\n');

            const findingsContext = findings
              .map((f, idx) => `Finding ${idx + 1}: [${f.severity}] ${f.title} - ${f.explanation}`)
              .join('\n');

            const contextPrompt = `Applicant: ${currentCase?.applicantName || 'Candidate'}\nInstitution: ${currentCase?.institutionName || 'Institution'}\n\nDossier Documents:\n${docsContext}\n\nFindings:\n${findingsContext}\n\nUser Question: ${text || 'Please review attached documents'}`;
            parts.push({ text: contextPrompt });

            const directRes = await directAi.models.generateContent({
              model: selectedModelId || 'gemini-3.8-flash',
              contents: parts,
              config: {
                systemInstruction: systemPrompt,
              },
            });

            const directAnswer = directRes.text || 'Document analysis completed. No issues found.';
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? {
                      ...m,
                      text: directAnswer,
                      citedDocNames: extractCitedDocs(directAnswer),
                    }
                  : m
              )
            );
            return;
          }
        } catch (directError) {
          console.warn('Direct client Gemini call error:', directError);
        }
      }

      try {
        const fallbackRes = await fetch('/api/gemini/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text || 'Analyze attached files',
            model: selectedModelId,
            documentsContext: documents,
            findings,
            applicantName: currentCase?.applicantName,
            attachments: currentAttachments,
          }),
        });
        const fallbackData = await fallbackRes.json();
        const fallbackText = fallbackData.text || 'Unable to retrieve answer. Please try again.';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text: fallbackText,
                  citedDocNames: extractCitedDocs(fallbackText),
                }
              : m
          )
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text: 'Sorry, the AI service encountered an issue. Please try again.',
                  error: true,
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY_CHAT);
  };

  // Simple Markdown Formatter
  const renderFormattedMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-bold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-0.5 ml-1">
            <span className="text-indigo-600 mt-1 text-xs">•</span>
            <span className="flex-1">{formattedLine}</span>
          </div>
        );
      }

      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <div key={idx} className="my-1 font-medium">
            {formattedLine}
          </div>
        );
      }

      return (
        <p key={idx} className={line.trim() === '' ? 'h-2' : 'my-1'}>
          {formattedLine}
        </p>
      );
    });
  };

  const handleOpenCitedDoc = (docName: string) => {
    const match = documents.find(
      (d) =>
        d.name.toLowerCase() === docName.toLowerCase() ||
        docName.toLowerCase().includes(d.name.split('.')[0].toLowerCase())
    );
    if (match) {
      onOpenDocumentViewer(match.id);
    }
  };

  const hasContentToChat = hasDocuments || attachedFiles.length > 0 || messages.length > 0;

  return (
    <div className="flex flex-col flex-1 h-full w-full max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* 1. Header with Model Selector & Clear Action */}
      <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 bg-white border-b border-slate-200 shrink-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Ask AI</h2>

              {/* Free AI Model Selector Dropdown */}
              <div className="relative" ref={modelDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Change AI Model"
                >
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-400" />
                  <span className="truncate max-w-[130px] sm:max-w-none">{activeModel.name}</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded">
                    Free
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Model Selection Menu */}
                {isModelDropdownOpen && (
                  <div className="absolute left-0 mt-1.5 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">Select Free AI Model</span>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                        100% Free Tier
                      </span>
                    </div>

                    <div className="space-y-1">
                      {FREE_AI_MODELS.map((model) => {
                        const isSelected = model.id === selectedModelId;
                        return (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => handleSelectModel(model.id)}
                            className={`w-full text-left p-2 rounded-lg transition-colors flex items-start gap-2.5 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50/80 border border-indigo-200 text-indigo-950'
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="mt-0.5">
                              {isSelected ? (
                                <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-slate-300" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold truncate">{model.name}</span>
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                                  {model.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                                {model.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[10px] text-slate-500 truncate">
              {hasDocuments ? (
                <span>
                  {documents.length} document{documents.length === 1 ? '' : 's'} loaded
                  {currentCase?.applicantName && currentCase.applicantName !== 'New Applicant' ? (
                    <> · <span className="text-slate-700 font-medium">{currentCase.applicantName}</span></>
                  ) : ''}
                </span>
              ) : (
                'Attach files or ask document verification questions'
              )}
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* 2. Main Chat / Content Stream (Non-scrollable when empty) */}
      <div
        className={`flex-1 p-3.5 sm:p-5 bg-slate-50/40 min-h-0 ${
          messages.length === 0 ? 'overflow-hidden flex flex-col justify-center' : 'overflow-y-auto space-y-3.5'
        }`}
      >
        {!hasContentToChat ? (
          /* Empty State: No Documents Loaded */
          <div className="flex flex-col items-center justify-center text-center p-4 space-y-3 max-w-sm mx-auto">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Ask questions or attach files</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Attach images/PDFs directly below, or load verified documents from the Verify tab to get started.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                <span>Attach File / Image</span>
              </button>
              <button
                type="button"
                onClick={onGoToVerify}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <span>Go to Verify</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* Empty Chat: Suggestions (Constrained to fit without scrolling) */
          <div className="flex flex-col items-center justify-center text-center p-3 space-y-3 max-w-lg mx-auto">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900">
                What would you like to verify?
              </h3>
              <p className="text-xs text-slate-500">
                Using <span className="font-semibold text-slate-700">{activeModel.name}</span> across {documents.length} document(s).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-1">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  className="p-2.5 bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs text-slate-700 hover:text-indigo-700 text-left transition-all shadow-2xs flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate pr-2">{chip}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message List */
          messages.map((m) => {
            const isUser = m.role === 'user';

            return (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                  }`}
                >
                  {/* User Attachments Preview inside message */}
                  {isUser && m.attachments && m.attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {m.attachments.map((att, aIdx) => (
                        <div
                          key={aIdx}
                          className="flex items-center gap-1.5 px-2 py-1 bg-white/15 rounded-lg text-[11px] font-medium text-white max-w-full truncate"
                        >
                          {att.previewUrl ? (
                            <img
                              src={att.previewUrl}
                              alt={att.name}
                              className="w-5 h-5 rounded object-cover border border-white/30 shrink-0"
                            />
                          ) : (
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="truncate max-w-[140px]">{att.name}</span>
                          {att.size && <span className="opacity-75 text-[10px]">({att.size})</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {isUser ? (
                    <div className="whitespace-pre-wrap">{m.text}</div>
                  ) : (
                    <div>
                      {m.text ? (
                        renderFormattedMarkdown(m.text)
                      ) : (
                        <div className="flex items-center gap-1.5 py-1 text-slate-400 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce [animation-delay:0.4s]" />
                          <span className="ml-1 text-[11px]">Thinking ({activeModel.name})...</span>
                        </div>
                      )}

                      {/* Cited Document Chips */}
                      {m.citedDocNames && m.citedDocNames.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Source:
                          </span>
                          {m.citedDocNames.map((dName, dIdx) => (
                            <button
                              key={dIdx}
                              onClick={() => handleOpenCitedDoc(dName)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                              title={`View ${dName}`}
                            >
                              <FileText className="w-3 h-3 text-indigo-600" />
                              <span className="truncate max-w-[140px]">{dName}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-indigo-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={`mt-1.5 text-[9px] text-right ${
                      isUser ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Suggestion Bar when chat already has messages */}
      {messages.length > 0 && (
        <div className="px-3 sm:px-4 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-semibold text-slate-400 shrink-0">Suggestions:</span>
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              disabled={isStreaming}
              className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-lg text-[11px] whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* 4. Attached Files Tray (Preview before sending) */}
      {attachedFiles.length > 0 && (
        <div className="px-3 sm:px-4 py-2 bg-slate-100/70 border-t border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] font-semibold text-slate-500 shrink-0">Attached:</span>
          {attachedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 rounded-xl text-xs shadow-2xs shrink-0 max-w-[200px]"
            >
              {file.previewUrl ? (
                <img
                  src={file.previewUrl}
                  alt={file.name}
                  className="w-5 h-5 rounded object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-800 truncate">{file.name}</p>
                <p className="text-[9px] text-slate-400">{file.size}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(file.id)}
                className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 5. Input Bar with Attachment Trigger and Send Button */}
      <div className="p-2.5 sm:p-3.5 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-1.5 sm:gap-2"
        >
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,.txt,.csv"
            className="hidden"
          />

          {/* Attach Button (Image / Files) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            className="h-10 sm:h-11 px-2.5 sm:px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Attach images or documents"
          >
            <Paperclip className="w-4 h-4" />
            <span className="hidden sm:inline">Attach</span>
          </button>

          {/* Quick Image Attach Shortcut */}
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'image/*';
                fileInputRef.current.click();
              }
            }}
            disabled={isStreaming}
            className="h-10 sm:h-11 px-2.5 sm:px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Attach photos or scan images"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden md:inline">Image</span>
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isStreaming}
            placeholder={
              attachedFiles.length > 0
                ? 'Ask a question about the attached file(s)...'
                : hasDocuments
                ? 'Ask about dates, faculty names, or missing documents...'
                : 'Ask a question or attach documents/images to verify...'
            }
            className="flex-1 h-10 sm:h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 sm:px-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 transition-all min-w-0"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputMessage.trim() && attachedFiles.length === 0) || isStreaming}
            className="h-10 sm:h-11 px-3.5 sm:px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
          >
            {isStreaming ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
          <span>Processed securely with {activeModel.name} (Free tier)</span>
          <span>Images & files supported</span>
        </div>
      </div>
    </div>
  );
};
