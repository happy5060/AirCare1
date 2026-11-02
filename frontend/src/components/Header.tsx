import React, { useState } from 'react';

export type PageId = 'today' | 'past' | 'compare';

interface HeaderProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export const Header: React.FC<HeaderProps> = ({ activePage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: PageId; label: string; icon: string }[] = [
    { id: 'today', label: "Today's AQI", icon: 'air' },
    { id: 'past', label: 'Past Air Quality', icon: 'calendar_month' },
    { id: 'compare', label: 'Compare Cities', icon: 'compare_arrows' },
  ];

  return (
    <header className="w-full bg-surface-container-low border-b border-outline-variant/30 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-opacity-95">
      <div className="w-full max-w-[1536px] px-4 sm:px-6 flex items-center justify-between mx-auto h-16">
        {/* Brand Logo & Product Title */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onNavigate('today')}
            className="font-headline text-lg font-bold text-on-surface flex items-center gap-2.5 group text-left focus:outline-none"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-surface-container-high border border-primary/40 text-primary group-hover:border-primary transition-colors shadow-inner">
              <span className="material-symbols-outlined text-2xl animate-pulse-glow">air</span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-surface-container-low"></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="leading-none text-lg font-headline font-extrabold tracking-tight text-white">
                  AirCare
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/25">
                  BCA Project
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant font-body tracking-normal mt-0.5">
                Air Quality Analysis &amp; Monitoring
              </span>
            </div>
          </button>

          {/* Desktop Navigation Items (The 4 Main Features) */}
          <nav className="hidden lg:flex items-center gap-2 ml-4 font-headline text-sm font-medium tracking-tight">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all duration-150 text-xs font-semibold ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container shadow-md shadow-primary/20'
                      : 'text-on-surface-variant hover:text-white hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Snapshot Notice (Honest Demarcation) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/40 text-xs">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="text-on-surface-variant font-mono text-[11px]">
              Snapshot Baseline: <strong className="text-white">Oct 20, 2026</strong>
            </span>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-outline-variant/30 bg-surface-container-low px-4 py-3 space-y-1 shadow-xl">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-outline-variant/20 text-[11px] font-mono text-outline px-2">
            Baseline Snapshot: Oct 20, 2026 • CPCB 2015–2025 Archive
          </div>
        </div>
      )}
    </header>
  );
};
