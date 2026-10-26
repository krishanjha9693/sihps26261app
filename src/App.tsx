import React, { useState, useEffect } from 'react';
import {
  ApplicationCase,
  ReviewDecisionType,
  ReviewerProfile,
  VerificationReport,
} from './types';
import {
  loadApplications,
  loadReports,
  loadReviewerProfile,
  loadActiveUserCase,
  saveActiveUserCase,
  createNewUserCase,
  saveApplications,
  saveReports,
} from './services/storage';
import { Header } from './components/common/Header';
import { BottomNav, NavSection } from './components/common/BottomNav';
import { SplashScreen } from './components/common/SplashScreen';
import { HomeDashboard } from './components/home/HomeDashboard';
import { VerificationWorkspace } from './components/verify/VerificationWorkspace';
import { AskAiScreen } from './components/assistant/AskAiScreen';
import { EvidenceViewerModal } from './components/evidence/EvidenceViewerModal';
import { AndroidStudioExporter } from './components/android-export/AndroidStudioExporter';
import { X, Wifi, Battery, Signal } from 'lucide-react';

export default function App() {
  const [applications, setApplications] = useState<ApplicationCase[]>([]);
  const [reports, setReports] = useState<VerificationReport[]>([]);
  const [reviewer] = useState<ReviewerProfile>(loadReviewerProfile());
  const [currentSection, setCurrentSection] = useState<NavSection>('home');
  const [selectedCase, setSelectedCase] = useState<ApplicationCase | null>(null);
  const [evidenceViewerDocId, setEvidenceViewerDocId] = useState<string | null>(null);

  // Auto detect if user is already on a mobile screen
  const [isRealMobile, setIsRealMobile] = useState<boolean>(false);
  // Viewport mode for desktop testing: 'desktop' or 'mobile' (Pixel Frame)
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');

  const [isSplashOpen, setIsSplashOpen] = useState(false);
  const [isAndroidStudioOpen, setIsAndroidStudioOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsRealMobile(mobile);
      if (mobile) {
        setViewportMode('mobile');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const loadedApps = loadApplications();
    const loadedReps = loadReports();
    const userCase = loadActiveUserCase();
    setApplications(loadedApps);
    setReports(loadedReps);
    setSelectedCase(userCase);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleUpdateCase = (updated: ApplicationCase) => {
    const updatedList = applications.map((a) => (a.id === updated.id ? updated : a));
    const exists = updatedList.some((a) => a.id === updated.id);
    const finalList = exists ? updatedList : [updated, ...updatedList];

    setApplications(finalList);
    saveApplications(finalList);
    if (!updated.isDemoSample) {
      saveActiveUserCase(updated);
    }
    if (selectedCase?.id === updated.id) {
      setSelectedCase(updated);
    }
  };

  const handleGenerateReport = (
    appCase: ApplicationCase,
    decision: ReviewDecisionType,
    notes: string
  ) => {
    const reportDate =
      new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) +
      ' ' +
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ' IST';

    const randomBytes =
      typeof window !== 'undefined' && window.crypto
        ? window.crypto.getRandomValues(new Uint8Array(24))
        : new Uint8Array(Array.from({ length: 24 }, () => Math.floor(Math.random() * 256)));
    const hashString = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const newReport: VerificationReport = {
      id: `rep-${Date.now()}`,
      applicationId: appCase.applicationId,
      applicantName: appCase.applicantName,
      institutionName: appCase.institutionName,
      reportDate,
      reviewerName: reviewer.name,
      reviewerDesignation: reviewer.designation || 'Evaluator',
      decision,
      totalDocuments: appCase.documents.length,
      totalFindings: appCase.findings.length,
      criticalCount: appCase.findings.filter((f) => f.severity === 'critical').length,
      warningCount: appCase.findings.filter((f) => f.severity === 'warning').length,
      findings: appCase.findings,
      verificationHash: `SHA256-${hashString}`,
      reviewerNotes: notes,
    };

    const updatedCase: ApplicationCase = {
      ...appCase,
      status: 'Completed',
      decision: {
        decision,
        decidedAt: reportDate,
        reviewerName: reviewer.name,
        reviewerId: reviewer.reviewerId,
        reviewerDesignation: reviewer.designation || 'Evaluator',
        reviewerNotes: notes,
        decisionReason: notes || 'Verified with official evaluation determination.',
      },
      activityTimeline: [
        {
          id: `act-${Date.now()}`,
          timestamp: reportDate,
          title: 'Review Determination Endorsed',
          description: `Decision: ${decision.replace(/_/g, ' ')}. Generated Official Audit Report.`,
          actor: reviewer.name,
          type: 'decision',
        },
        ...appCase.activityTimeline,
      ],
    };

    handleUpdateCase(updatedCase);

    const updatedReports = [newReport, ...reports];
    setReports(updatedReports);
    saveReports(updatedReports);
    // Stay in verification workspace with report available
    setCurrentSection('verify');
  };

  const pendingAttentionCount = applications.filter(
    (a) => a.status === 'Needs Attention' || a.findings.length > 0
  ).length;

  const renderContent = () => (
    <>
      {currentSection === 'home' && (
        <HomeDashboard
          applications={applications}
          reviewer={reviewer}
          onSelectApplication={(app) => {
            setSelectedCase(app);
            setCurrentSection('verify');
          }}
          onStartNewVerification={() => {
            const freshCase = createNewUserCase();
            saveActiveUserCase(freshCase);
            setSelectedCase(freshCase);
            setApplications((prev) => [
              freshCase,
              ...prev.filter((a) => !a.isDemoSample && a.id !== freshCase.id),
              ...prev.filter((a) => a.isDemoSample),
            ]);
            setCurrentSection('verify');
          }}
          onNavigateToAskAi={() => setCurrentSection('ask-ai')}
        />
      )}

      {currentSection === 'verify' && (
        selectedCase ? (
          <VerificationWorkspace
            appCase={selectedCase}
            reviewer={reviewer}
            onUpdateCase={handleUpdateCase}
            onGenerateReport={handleGenerateReport}
            onOpenAssistant={() => setCurrentSection('ask-ai')}
          />
        ) : (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
            <p className="text-xs text-slate-500">No verification case selected.</p>
            <button
              onClick={() => {
                const freshCase = createNewUserCase();
                saveActiveUserCase(freshCase);
                setSelectedCase(freshCase);
                setApplications((prev) => [
                  freshCase,
                  ...prev.filter((a) => !a.isDemoSample && a.id !== freshCase.id),
                  ...prev.filter((a) => a.isDemoSample),
                ]);
              }}
              className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            >
              Start New Verification
            </button>
          </div>
        )
      )}

      {currentSection === 'ask-ai' && (
        <AskAiScreen
          currentCase={selectedCase}
          onGoToVerify={() => setCurrentSection('verify')}
          onOpenDocumentViewer={(docId) => setEvidenceViewerDocId(docId)}
        />
      )}
    </>
  );

  const isSimulatedFrame = !isRealMobile && viewportMode === 'mobile';

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-start antialiased selection:bg-indigo-600 selection:text-white">
      {/* 
        CASE A: Desktop Pixel 8 Pro Frame Simulator Mode
      */}
      {isSimulatedFrame ? (
        <div className="w-full flex flex-col items-center py-6 px-4">
          {/* Top Frame Control Bar */}
          <div className="w-full max-w-[420px] flex items-center justify-between px-3.5 py-2 mb-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 shadow-xs">
            <span className="font-semibold text-indigo-700">Google Pixel 8 Pro (Simulated)</span>
            <button
              onClick={() => setViewportMode('desktop')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
            >
              Switch to Workstation
            </button>
          </div>

          {/* Android Device Bezel */}
          <div className="relative w-full max-w-[390px] h-[810px] bg-[#F8FAFC] rounded-[48px] border-[10px] border-slate-900 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18)] overflow-hidden flex flex-col">
            {/* Camera Punchhole & Status Bar */}
            <div className="h-7 w-full flex items-center justify-between px-6 bg-white border-b border-slate-100 text-[10px] font-mono text-slate-600 select-none shrink-0 z-20">
              <span>09:41</span>
              <div className="w-3.5 h-3.5 bg-slate-900 rounded-full border border-slate-700" />
              <div className="flex items-center gap-1.5">
                <Signal className="w-3 h-3 text-slate-700" />
                <Wifi className="w-3 h-3 text-slate-700" />
                <Battery className="w-3.5 h-3.5 text-slate-700" />
              </div>
            </div>

            {/* Embedded Android App Header */}
            <Header
              currentSection={currentSection}
              reviewer={reviewer}
              viewportMode={viewportMode}
              isRealMobileDevice={isRealMobile}
              onToggleViewport={() => setViewportMode('desktop')}
              onOpenAndroidStudio={() => setIsAndroidStudioOpen(true)}
            />

            {/* Scrollable Screen Content */}
            <div
              className={`flex-1 ${
                currentSection === 'ask-ai'
                  ? 'overflow-hidden px-2 pt-1 pb-16 flex flex-col'
                  : 'overflow-y-auto px-3.5 py-3 pb-20'
              } bg-[#F8FAFC]`}
            >
              {renderContent()}
            </div>

            {/* Anchored Material 3 Bottom Nav (3 Tabs) */}
            <BottomNav
              currentSection={currentSection}
              onSelectSection={(sec) => setCurrentSection(sec)}
              pendingCount={pendingAttentionCount}
              isInsideFrame={true}
            />

            {/* Android Gesture Pill */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-400 rounded-full pointer-events-none z-50" />
          </div>
        </div>
      ) : (
        /* 
          CASE B: Native Edge-to-Edge Android / Responsive Workstation Mode
        */
        <div className="w-full flex flex-col min-h-screen bg-[#F8FAFC]">
          {/* Header */}
          <Header
            currentSection={currentSection}
            reviewer={reviewer}
            viewportMode={viewportMode}
            isRealMobileDevice={isRealMobile}
            onToggleViewport={() => setViewportMode((m) => (m === 'desktop' ? 'mobile' : 'desktop'))}
            onOpenAndroidStudio={() => setIsAndroidStudioOpen(true)}
          />

          {/* Main Content Viewport */}
          <main
            className={`flex-1 w-full max-w-7xl mx-auto px-2 sm:px-6 ${
              currentSection === 'ask-ai'
                ? 'pt-1.5 pb-16 sm:pb-18 h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden'
                : 'py-4 pb-20 sm:pb-24'
            }`}
          >
            {renderContent()}
          </main>

          {/* Persistent Fixed Bottom Navigation (3 Tabs) */}
          <BottomNav
            currentSection={currentSection}
            onSelectSection={(sec) => setCurrentSection(sec)}
            pendingCount={pendingAttentionCount}
            isInsideFrame={false}
          />
        </div>
      )}

      {/* Android Studio Source Code Modal */}
      {isAndroidStudioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-6 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl h-[92vh] sm:h-[88vh] flex flex-col">
            <button
              onClick={() => setIsAndroidStudioOpen(false)}
              className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <AndroidStudioExporter />
          </div>
        </div>
      )}

      {/* Document Viewer Modal triggered from citations in Ask AI */}
      <EvidenceViewerModal
        isOpen={evidenceViewerDocId !== null}
        onClose={() => setEvidenceViewerDocId(null)}
        documents={selectedCase?.documents || []}
        initialDocId={evidenceViewerDocId || undefined}
      />

      {/* Splash Screen Onboarding */}
      <SplashScreen
        isOpen={isSplashOpen}
        onDismiss={() => setIsSplashOpen(false)}
      />
    </div>
  );
}
