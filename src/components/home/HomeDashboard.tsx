import React, { useState } from 'react';
import {
  ShieldCheck,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ApplicationCase, ReviewerProfile } from '../../types';
import { formatCaseId } from '../../services/storage';

interface HomeDashboardProps {
  applications: ApplicationCase[];
  reviewer?: ReviewerProfile;
  onSelectApplication: (appCase: ApplicationCase) => void;
  onStartNewVerification: () => void;
  onNavigateToAskAi: () => void;
}

type FilterType = 'all' | 'in_review' | 'need_attention' | 'verified';

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  applications,
  reviewer,
  onSelectApplication,
  onStartNewVerification,
  onNavigateToAskAi,
}) => {
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [showAll, setShowAll] = useState<boolean>(false);

  // Synchronized counts matching the case list criteria
  const totalCases = applications.length;
  const needAttentionCases = applications.filter(
    (a) => a.status === 'Needs Attention' || a.findings.length > 0
  );
  const verifiedCases = applications.filter(
    (a) => a.status === 'Completed' && a.findings.length === 0
  );
  const inReviewCases = applications.filter(
    (a) => (a.status === 'Pending' || a.status === 'In Review') && a.findings.length === 0
  );

  const needAttentionCount = needAttentionCases.length;
  const verifiedCount = verifiedCases.length;
  const inReviewCount = inReviewCases.length;

  // Filter cases based on current selection
  const filteredCases = applications.filter((app) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'need_attention') {
      return app.status === 'Needs Attention' || app.findings.length > 0;
    }
    if (statusFilter === 'verified') {
      return app.status === 'Completed' && app.findings.length === 0;
    }
    if (statusFilter === 'in_review') {
      return (app.status === 'Pending' || app.status === 'In Review') && app.findings.length === 0;
    }
    return true;
  });

  const displayedCases = showAll ? filteredCases : filteredCases.slice(0, 3);

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const getFilterLabel = () => {
    switch (statusFilter) {
      case 'in_review':
        return 'In Review';
      case 'need_attention':
        return 'Need Attention';
      case 'verified':
        return 'Verified';
      default:
        return 'All';
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-3 pt-1 font-sans">
      {/* 1. WELCOME SECTION (top, no heading) */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Institutional Document Verification
          </h2>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
            {todayFormatted}
          </span>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          Upload and validate certificates, degrees, and identity records before submission with instant verification.
        </p>

        <div className="pt-1">
          <button
            onClick={onStartNewVerification}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Validate Documents</span>
          </button>
        </div>
      </section>

      {/* 2. OVERVIEW SECTION */}
      <section className="space-y-2">
        <h3 className="text-sm font-bold text-slate-900 px-0.5">Overview</h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Total Cases */}
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-2xl bg-white border text-left shadow-xs transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
                {totalCases}
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <span className="text-xs font-medium text-slate-600 block mt-2">
              Total Cases
            </span>
          </button>

          {/* In Review */}
          <button
            type="button"
            onClick={() =>
              setStatusFilter((prev) => (prev === 'in_review' ? 'all' : 'in_review'))
            }
            className={`p-4 rounded-2xl bg-white border text-left shadow-xs transition-all cursor-pointer ${
              statusFilter === 'in_review'
                ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-700 tabular-nums">
                {inReviewCount}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <span className="text-xs font-medium text-slate-600 block mt-2">
              In Review
            </span>
          </button>

          {/* Need Attention */}
          <button
            type="button"
            onClick={() =>
              setStatusFilter((prev) => (prev === 'need_attention' ? 'all' : 'need_attention'))
            }
            className={`p-4 rounded-2xl bg-white border text-left shadow-xs transition-all cursor-pointer ${
              statusFilter === 'need_attention'
                ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-rose-700 tabular-nums">
                {needAttentionCount}
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <span className="text-xs font-medium text-slate-600 block mt-2">
              Need Attention
            </span>
          </button>

          {/* Verified */}
          <button
            type="button"
            onClick={() =>
              setStatusFilter((prev) => (prev === 'verified' ? 'all' : 'verified'))
            }
            className={`p-4 rounded-2xl bg-white border text-left shadow-xs transition-all cursor-pointer ${
              statusFilter === 'verified'
                ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 tabular-nums">
                {verifiedCount}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <span className="text-xs font-medium text-slate-600 block mt-2">
              Verified
            </span>
          </button>
        </div>
      </section>

      {/* 3. RECENT CASES SECTION */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Recent Cases</h3>
            {statusFilter !== 'all' && (
              <span className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                Filtered: {getFilterLabel()}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter('all');
                  }}
                  className="ml-1 text-slate-400 hover:text-slate-700 cursor-pointer font-bold leading-none"
                  title="Clear filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          {filteredCases.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors"
            >
              {showAll ? 'Show less' : 'View all'}
            </button>
          )}
        </div>

        {displayedCases.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
            <p className="text-xs text-slate-500">No cases match the selected filter.</p>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              Reset filter
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedCases.map((app) => {
              const isAttention = app.findings.length > 0 || app.status === 'Needs Attention';
              const isCompleted = app.status === 'Completed' && app.findings.length === 0;

              return (
                <div
                  key={app.id}
                  onClick={() => onSelectApplication(app)}
                  className="group p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-sm cursor-pointer transition-all flex items-center justify-between gap-3"
                >
                  {/* Left: Case Info (wrapping, never truncated) */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 leading-snug break-words group-hover:text-indigo-600 transition-colors">
                      {app.institutionName || app.applicantName}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      {formatCaseId(app.applicationId)}
                      {app.applicantName && app.institutionName ? ` · ${app.applicantName}` : ''}
                    </p>
                  </div>

                  {/* Right: Single Status Badge + Small Arrow */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {isAttention ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                        Needs attention{app.findings.length > 0 ? ` (${app.findings.length})` : ''}
                      </span>
                    ) : isCompleted ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                        In review
                      </span>
                    )}

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. NEED HELP? SHORTCUT TO ASK AI */}
      <section className="space-y-2">
        <h3 className="text-sm font-bold text-slate-900 px-0.5">Need help?</h3>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              Ask AI about your documents
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Get quick answers about dates, names, missing fields, or rules.
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateToAskAi}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask AI</span>
          </button>
        </div>
      </section>

      {/* PRIVACY NOTE (at the very bottom of the page) */}
      <div className="text-center pt-3 px-4">
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Files are processed in your browser. Extracted text is sent to Gemini only when you ask the AI a question.
        </p>
      </div>
    </div>
  );
};
