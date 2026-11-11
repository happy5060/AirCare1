import React from 'react';
import { Database } from 'lucide-react';
import type { PageId } from './Header';

interface FooterProps {
  onNavigate: (page: PageId) => void;
  onOpenDiagnostics?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenDiagnostics }) => {
  return (
    <footer className="w-full bg-surface-container-low border-t border-outline-variant/30 mt-16 py-8">
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-outline-variant/20">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <span className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
              AirCare • Air Quality Analysis and Visualization Using Data Analytics
            </span>
            <span className="text-xs text-on-surface-variant font-body mt-1 max-w-2xl leading-relaxed">
              BCA Minor Project. Designed for ordinary citizens to check today's air quality, inspect historical CPCB records (2015–2025), and compare cities.
            </span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-label text-on-surface-variant">
            <button
              onClick={() => onNavigate('today')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Today's AQI
            </button>
            <span className="text-outline-variant">•</span>
            <button
              onClick={() => onNavigate('past')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Past Air Quality
            </button>
            <span className="text-outline-variant">•</span>
            <button
              onClick={() => onNavigate('compare')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Compare Cities
            </button>
            {onOpenDiagnostics && (
              <>
                <span className="text-outline-variant">•</span>
                <button
                  onClick={onOpenDiagnostics}
                  className="hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium"
                  title="Inspect Supabase database storage and connection diagnostics"
                >
                  <Database className="w-3.5 h-3.5" />
                  Database Status
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 text-[11px] text-outline font-label text-center sm:text-left">
          <span>
            © 2026 AirCare Platform • Evaluates authentic CPCB standard data (0–500 index scale).
          </span>
          <span className="text-tertiary">
            Data Notice: Static CAAQMS station snapshot dated Oct 20, 2026. Strictly NO black-box AI/ML or speculative forecasting.
          </span>
        </div>
      </div>
    </footer>
  );
};
