import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  Copy,
  Info,
} from 'lucide-react';
import { Finding, VerificationDocument } from '../../types';

interface EvidenceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: VerificationDocument[];
  initialDocId?: string;
  activeFinding?: Finding | null;
}

export const EvidenceViewerModal: React.FC<EvidenceViewerModalProps> = ({
  isOpen,
  onClose,
  documents,
  initialDocId,
  activeFinding,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(
    initialDocId || (documents[0] ? documents[0].id : '')
  );
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [mobileViewMode, setMobileViewMode] = useState<'document' | 'fields'>('document');
  const [activeTab, setActiveTab] = useState<'fields' | 'ocr'>('fields');
  const [copiedText, setCopiedText] = useState<boolean>(false);

  React.useEffect(() => {
    if (initialDocId) {
      setSelectedDocId(initialDocId);
    } else if (documents[0]) {
      setSelectedDocId(documents[0].id);
    }
  }, [initialDocId, documents]);

  if (!isOpen || documents.length === 0) return null;

  const currentDoc = documents.find((d) => d.id === selectedDocId) || documents[0];
  const currentIndex = documents.findIndex((d) => d.id === currentDoc.id);

  const handleNextDoc = () => {
    if (currentIndex < documents.length - 1) {
      setSelectedDocId(documents[currentIndex + 1].id);
    }
  };

  const handlePrevDoc = () => {
    if (currentIndex > 0) {
      setSelectedDocId(documents[currentIndex - 1].id);
    }
  };

  const copyExtractedText = () => {
    if (currentDoc.extractedText) {
      navigator.clipboard.writeText(currentDoc.extractedText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-2 sm:p-4 md:p-6 backdrop-blur-xs">
      <div className="relative flex flex-col w-full h-[96vh] sm:h-[92vh] max-w-6xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 bg-white border-b border-slate-200">
          <div className="min-w-0 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-xs shrink-0">
              DOC
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[180px] sm:max-w-md">
                {currentDoc.name}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                {currentDoc.category} · Document {currentIndex + 1} of {documents.length}
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile View Toggle: Document vs Fields */}
            <div className="flex md:hidden bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setMobileViewMode('document')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  mobileViewMode === 'document' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Scan
              </button>
              <button
                onClick={() => setMobileViewMode('fields')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  mobileViewMode === 'fields' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Data
              </button>
            </div>

            {/* Desktop Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                className="p-1 text-slate-600 hover:text-slate-900 rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 text-slate-700 font-medium">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(220, z + 15))}
                className="p-1 text-slate-600 hover:text-slate-900 rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1 text-slate-600 hover:text-slate-900 rounded"
                title="Rotate Clockwise"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Selection Strip */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar text-xs shrink-0">
          {documents.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDocId(d.id)}
              className={`px-3 py-1 rounded-lg whitespace-nowrap text-xs transition-colors flex items-center gap-1.5 shrink-0 ${
                d.id === currentDoc.id
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="truncate max-w-[140px]">{d.name}</span>
            </button>
          ))}
        </div>

        {/* Main Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Document Canvas */}
          <div
            className={`flex-1 bg-slate-100 relative overflow-auto p-4 flex items-center justify-center ${
              mobileViewMode === 'fields' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div
              className="relative transition-transform duration-200 shadow-lg bg-white rounded overflow-hidden max-h-full max-w-full"
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            >
              {currentDoc.rawBase64?.startsWith('data:application/pdf') ? (
                <iframe
                  src={currentDoc.rawBase64}
                  title={currentDoc.name}
                  className="w-[70vw] max-w-3xl h-[68vh] border-0 rounded bg-white"
                />
              ) : (
                <img
                  src={currentDoc.previewUrl}
                  alt={currentDoc.name}
                  className="max-w-full max-h-[68vh] object-contain select-none"
                />
              )}

              {/* Bounding box highlights */}
              {currentDoc.extractedFields.map((field, fIdx) => {
                const box = field.boundingBox;
                if (!box) return null;
                const isFieldActive = activeFinding?.field === field.fieldName;

                return (
                  <div
                    key={fIdx}
                    className={`absolute border-2 rounded transition-all cursor-pointer ${
                      isFieldActive
                        ? 'border-amber-500 bg-amber-500/20 shadow-md'
                        : 'border-indigo-500/60 bg-indigo-500/10'
                    }`}
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                    }}
                  />
                );
              })}
            </div>

            {/* Floating Nav Controls */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-md text-xs">
              <button
                onClick={handlePrevDoc}
                disabled={currentIndex === 0}
                className="p-1 rounded text-slate-600 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-700 font-medium px-1">
                {currentIndex + 1} of {documents.length}
              </span>
              <button
                onClick={handleNextDoc}
                disabled={currentIndex === documents.length - 1}
                className="p-1 rounded text-slate-600 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Sidebar: Extracted Data / OCR */}
          <div
            className={`w-full md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col h-full overflow-hidden ${
              mobileViewMode === 'document' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs shrink-0">
              <button
                onClick={() => setActiveTab('fields')}
                className={`flex-1 py-2.5 font-bold border-b-2 text-xs transition-colors ${
                  activeTab === 'fields'
                    ? 'border-indigo-600 text-indigo-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Extracted Fields ({currentDoc.extractedFields.length})
              </button>
              <button
                onClick={() => setActiveTab('ocr')}
                className={`flex-1 py-2.5 font-bold border-b-2 text-xs transition-colors ${
                  activeTab === 'ocr'
                    ? 'border-indigo-600 text-indigo-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Raw OCR Text
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
              {activeTab === 'fields' ? (
                <>
                  {currentDoc.extractedFields.map((f, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-medium truncate">{f.label}</span>
                        <span className="font-mono text-indigo-700 font-semibold bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded text-[10px]">
                          {(f.confidence * 100).toFixed(0)}% conf
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 break-words">
                        {f.value || <span className="text-slate-400 italic">Not detected</span>}
                      </div>
                    </div>
                  ))}

                  {/* Quality Checklist */}
                  {currentDoc.qualityReport && (
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs space-y-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-indigo-600" />
                        Quality Diagnostics
                      </div>
                      <div className="text-xs text-slate-600">
                        Sharpness: <span className="font-mono font-bold text-emerald-700">{currentDoc.qualityReport.blurScore}/100</span> · Resolution: {currentDoc.qualityReport.resolutionRating}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">OCR Transcript</span>
                    <button
                      onClick={copyExtractedText}
                      className="text-xs text-indigo-600 font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedText ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-50 font-mono text-xs text-slate-800 rounded-xl border border-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[60vh]">
                    {currentDoc.extractedText || '// No text extracted yet.'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
