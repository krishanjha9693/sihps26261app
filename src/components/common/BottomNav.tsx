import React from 'react';
import { Home, ShieldCheck, Sparkles } from 'lucide-react';

export type NavSection = 'home' | 'verify' | 'ask-ai';

interface BottomNavProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  pendingCount?: number;
  isInsideFrame?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentSection,
  onSelectSection,
  pendingCount = 0,
  isInsideFrame = false,
}) => {
  const navItems = [
    { id: 'home' as NavSection, label: 'Home', icon: Home },
    {
      id: 'verify' as NavSection,
      label: 'Verify',
      icon: ShieldCheck,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'ask-ai' as NavSection,
      label: 'Ask AI',
      icon: Sparkles,
      isCenterAccent: true,
    },
  ];

  return (
    <nav
      className={`${
        isInsideFrame ? 'absolute bottom-0 left-0 right-0' : 'fixed bottom-0 left-0 right-0'
      } z-40 bg-white/95 border-t border-slate-200 backdrop-blur-md h-16 flex items-center shrink-0 shadow-xs`}
    >
      <div className="w-full max-w-md mx-auto flex items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          const isCenter = item.isCenterAccent;

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className="flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer"
            >
              <div
                className={`relative flex items-center justify-center px-4 py-1.5 rounded-full transition-all duration-200 ${
                  isActive
                    ? isCenter
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-indigo-50 text-indigo-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 min-w-[18px] h-[18px] bg-rose-600 text-white font-mono text-xs font-bold rounded-full flex items-center justify-center leading-none shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-xs tracking-tight mt-0.5 transition-colors ${
                  isActive
                    ? 'text-indigo-600 font-bold'
                    : 'text-slate-500 font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
