import React, { useState } from 'react';
import {
  Search,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  ChevronRight,
  X,
  Lock,
} from 'lucide-react';
import { ApplicationCase, ApplicationStatus, PriorityLevel } from '../../types';
import { createSampleDocumentSvg } from '../../services/storage';

interface ApplicationsScreenProps {
  applications: ApplicationCase[];
  onSelectApplication: (appCase: ApplicationCase) => void;
  onCreateApplication: (newCase: ApplicationCase) => void;
  onDeleteApplication: (appId: string) => void;
}

export const ApplicationsScreen: React.FC<ApplicationsScreenProps> = ({
  applications,
  onSelectApplication,
  onCreateApplication,
  onDeleteApplication,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ApplicationStatus>('All');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New Application Form State
  const [formApplicantName, setFormApplicantName] = useState('');
  const [formInstitutionName, setFormInstitutionName] = useState('');
  const [formProgram, setFormProgram] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPriority, setFormPriority] = useState<PriorityLevel>('Normal');

  const filtered = applications
    .filter((a) => {
      const matchSearch =
        a.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.applicationId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return b.submissionDate.localeCompare(a.submissionDate);
      if (sortBy === 'priority') {
        const pOrder: Record<PriorityLevel, number> = { High: 3, Normal: 2, Low: 1 };
        return pOrder[b.priority] - pOrder[a.priority];
      }
      return a.status.localeCompare(b.status);
    });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formApplicantName.trim() || !formInstitutionName.trim()) return;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newAppId = `SIH-2026-AP-${randomSuffix}`;

    const newCase: ApplicationCase = {
      id: `case-${Date.now()}`,
      applicationId: newAppId,
      applicantName: formApplicantName.trim(),
      applicantEmail: formEmail.trim() || `${formApplicantName.toLowerCase().replace(/\s+/g, '.')}@example.ac.in`,
      applicantPhone: formPhone.trim() || '+91 98000 00000',
      institutionName: formInstitutionName.trim(),
      programOrCourse: formProgram.trim() || 'Institutional Accreditation Review',
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      priority: formPriority,
      isDemoSample: false,
      requiredDocumentTypes: [
        'Identity Proof',
        'Educational Certificate',
        'Academic Transcript',
        'Institutional Affiliation Proof',
      ],
      reviewerNotes: '',
      documents: [],
      findings: [],
      activityTimeline: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
          title: 'Case Registered',
          description: `Application ${newAppId} created by reviewer.`,
          actor: 'System Admin',
          type: 'upload',
        },
      ],
    };

    onCreateApplication(newCase);
    setIsCreateModalOpen(false);
    setFormApplicantName('');
    setFormInstitutionName('');
    setFormProgram('');
    setFormEmail('');
    setFormPhone('');
    onSelectApplication(newCase);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-6">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-xl font-bold text-slate-900">Application Cases</h2>
          <p className="text-xs text-slate-500">
            {applications.length} Institutional Dossiers Registered
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Case</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate, institution, or ID..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
          />
        </div>

        {/* Swipeable chip filter strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(['All', 'Needs Attention', 'In Review', 'Pending', 'Completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-600 shrink-0 ml-auto"
          >
            <option value="date">Sort: Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-xs">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900 mb-0.5">No Matching Cases Found</h4>
            <p className="text-xs text-slate-500">Try modifying your search or filter criteria.</p>
          </div>
        ) : (
          filtered.map((app) => {
            const hasCrit = app.findings.some((f) => f.severity === 'critical');

            return (
              <div
                key={app.id}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all space-y-2.5"
              >
                <div className="cursor-pointer" onClick={() => onSelectApplication(app)}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {app.applicationId}
                    </span>
                    {app.priority === 'High' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        HIGH PRIORITY
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate">
                    {app.applicantName}
                  </h3>
                  <p className="text-xs text-slate-600 truncate">{app.institutionName} · {app.programOrCourse}</p>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                  {/* Status Indicator */}
                  {app.findings.length > 0 ? (
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        hasCrit
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {app.findings.length} Finding(s)
                    </span>
                  ) : app.status === 'Completed' ? (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Verified
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600 px-2.5 py-0.5 bg-slate-100 rounded-full border border-slate-200">
                      {app.status}
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setDeleteConfirmId(app.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Case"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSelectApplication(app)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all border border-indigo-200"
                    >
                      <span>Review Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Delete Application Case?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will remove this case and its linked document records from your local browser storage.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteApplication(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Application Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full space-y-3.5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">New Accreditation Case</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Applicant / Faculty Name *
                </label>
                <input
                  type="text"
                  required
                  value={formApplicantName}
                  onChange={(e) => setFormApplicantName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Chander"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Institution Name *
                </label>
                <input
                  type="text"
                  required
                  value={formInstitutionName}
                  onChange={(e) => setFormInstitutionName(e.target.value)}
                  placeholder="e.g. Indian Institute of Science"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Course / Track</label>
                <input
                  type="text"
                  value={formProgram}
                  onChange={(e) => setFormProgram(e.target.value)}
                  placeholder="e.g. Faculty Qualification"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
