import React from 'react';
import { ShieldCheck, ArrowRight, FileCheck, Search, Award, Sparkles, X } from 'lucide-react';

interface SplashScreenProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isOpen, onDismiss }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 sm:p-6 backdrop-blur-xs">
      <div className="relative max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Emblem & Brand */}
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-600/20">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">VeriCampus AI</h1>
            <p className="text-xs font-mono text-indigo-600 font-semibold tracking-wide uppercase mt-0.5">
              Smart India Hackathon · Accreditation Platform
            </p>
          </div>
          <p className="text-xs font-medium text-slate-500 italic">
            “Smart Verification. Clear Evidence. Confident Decisions.”
          </p>
        </div>

        {/* Onboarding Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold">
              <FileCheck className="w-4 h-4" />
              <span>Multi-Source Ingestion</span>
            </div>
            <p className="text-[11px] text-slate-600">
              PDFs, scans, and real CameraX captures categorized with DPI quality checks.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold">
              <Search className="w-4 h-4" />
              <span>Cross-Document Rules</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Evaluates name concordance, registration codes, validity expiry, and chronology.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
              <Award className="w-4 h-4" />
              <span>Evidence-Linked Decisions</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Every finding links directly to the source document with interactive bounding regions.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-amber-700 text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Human Reviewer Authority</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Distinguishes detected inconsistencies from fraud. Final decisions remain with authorized reviewers.
            </p>
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-2">
          <button
            onClick={onDismiss}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all"
          >
            <span>Enter Verification Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
