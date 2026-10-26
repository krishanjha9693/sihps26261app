import React, { useState } from 'react';
import {
  ShieldCheck,
  Bell,
  Smartphone,
  Monitor,
  X,
} from 'lucide-react';
import { ReviewerProfile } from '../../types';

interface HeaderProps {
  currentSection: string;
  reviewer?: ReviewerProfile;
  viewportMode: 'mobile' | 'desktop';
  isRealMobileDevice: boolean;
  onToggleViewport: () => void;
  onOpenAndroidStudio?: () => void;
  onOpenAssistant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  viewportMode,
  isRealMobileDevice,
  onToggleViewport,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Discrepancy Flagged',
      text: 'Candidate Dr. Aakash Sharma: Legal name mismatch between Aadhaar and PhD Degree.',
      time: '12m ago',
    },
    {
      id: 'notif-2',
      title: 'OCR Complete',
      text: 'Extracted 12 fields for Gujarat University research fellowship dossier.',
      time: '45m ago',
    },
    {
      id: 'notif-3',
      title: 'Report Authenticated',
      text: 'Official verification report generated for dossier AP-2026-7732.',
      time: '2h ago',
    },
  ]);

  const handleToggleNotifications = () => {
    const nextState = !notificationsOpen;
    setNotificationsOpen(nextState);
    if (nextState && hasUnread) {
      setHasUnread(false);
    }
  };

  const sectionTitles: Record<string, string> = {
    home: 'VeriCampus AI',
    verify: 'Workspace',
    'ask-ai': 'Ask AI',
  };

  return (
    <header className="relative z-30 h-14 w-full flex items-center justify-between px-3 sm:px-6 bg-white border-b border-slate-200 shadow-xs shrink-0">
      {/* Zone 1: Logo & Section Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate">
            {sectionTitles[currentSection] || 'VeriCampus AI'}
          </h1>
        </div>
      </div>

      {/* Zone 2: Action Icons with touch targets */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Toggle Frame (Only show on desktop) */}
        {!isRealMobileDevice && (
          <button
            onClick={onToggleViewport}
            className="p-1.5 sm:px-2.5 sm:py-1 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title={viewportMode === 'mobile' ? 'Switch to Full Workstation' : 'Switch to Android Pixel Frame'}
          >
            {viewportMode === 'mobile' ? (
              <>
                <Monitor className="w-4 h-4 text-indigo-600" />
                <span className="hidden md:inline">Workstation</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <span className="hidden md:inline">Android Frame</span>
              </>
            )}
          </button>
        )}

        {/* Notifications Icon with active dot */}
        <div className="relative">
          <button
            onClick={handleToggleNotifications}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-lg border border-slate-200 transition-colors relative cursor-pointer"
            title="Notifications"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={() => setNotifications([])}
                      className="text-[11px] text-slate-500 hover:text-indigo-600 font-medium"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No new notifications
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-3 hover:bg-slate-50 transition-colors text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{notif.title}</span>
                        <span className="text-[10px] text-slate-400">{notif.time}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{notif.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
