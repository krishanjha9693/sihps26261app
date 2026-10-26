import React, { useState } from 'react';
import {
  FileText,
  Download,
  Share2,
  Search,
  Check,
} from 'lucide-react';
import { ApplicationCase, ReviewerProfile, VerificationReport } from '../../types';
import { downloadVerificationPdf } from '../../services/pdfReportGenerator';

interface ReportsScreenProps {
  reports: VerificationReport[];
  applications: ApplicationCase[];
  reviewer: ReviewerProfile;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  reports,
  applications,
  reviewer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredReports = reports.filter((r) =>
    r.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.applicationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.institutionName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownloadReport = (rep: VerificationReport) => {
    const linkedApp = applications.find((a) => a.applicationId === rep.applicationId) || {
      id: rep.id,
      applicationId: rep.applicationId,
      applicantName: rep.applicantName,
      applicantEmail: 'applicant@institution.ac.in',
      applicantPhone: '+91 98000 00000',
      institutionName: rep.institutionName,
      programOrCourse: 'Accreditation Evaluation',
      submissionDate: rep.reportDate.split(' ')[0],
      status: 'Completed' as const,
      priority: 'Normal' as const,
      requiredDocumentTypes: [],
      documents: [],
      findings: rep.findings,
      reviewerNotes: rep.reviewerNotes,
      activityTimeline: [],
    };

    downloadVerificationPdf(linkedApp, reviewer, rep);
  };

  const handleShareReport = async (rep: VerificationReport) => {
    const shareText = `VeriCampus AI Accreditation Audit Report: ${rep.applicationId} for ${rep.applicantName} (${rep.institutionName}). Decision: ${rep.decision}. Cryptographic Hash: ${rep.verificationHash.substring(0, 16)}...`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Accreditation Report - ${rep.applicationId}`,
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(shareText);
    setCopiedId(rep.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-xl font-bold text-slate-900">Verification Reports</h2>
          <p className="text-[11px] text-slate-500">
            {reports.length} Official Signed Dossiers
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports by applicant, ID, or institution..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
          />
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-xs">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-800 mb-0.5">No Reports Found</h4>
            <p className="text-[11px] text-slate-500">
              Finalize an application in the Workspace to generate signed reports.
            </p>
          </div>
        ) : (
          filteredReports.map((rep) => {
            const isNoIssue = rep.decision === 'NO_ISSUES_FOUND';

            return (
              <div
                key={rep.id}
                className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-xs transition-all space-y-2.5 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {rep.applicationId}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded ${
                        isNoIssue
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {rep.decision.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {rep.applicantName}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">{rep.institutionName}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                  <span>{rep.reportDate.split(' ')[0]}</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleShareReport(rep)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium border border-slate-200 transition-colors"
                    >
                      {copiedId === rep.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3 h-3" />
                          <span>Share</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDownloadReport(rep)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
