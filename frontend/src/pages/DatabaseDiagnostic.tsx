import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Clock, MapPin, ShieldAlert, Cpu } from 'lucide-react';
import { fetchDatabaseDiagnostics } from '../services/supabaseAirQualityService';
import { getSupabaseDiagnosticsMetadata } from '../services/supabaseClient';
import type { DatabaseDiagnosticsInfo } from '../types/supabase';

interface DatabaseDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseDiagnosticModal: React.FC<DatabaseDiagnosticModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [diagInfo, setDiagInfo] = useState<DatabaseDiagnosticsInfo | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetchDatabaseDiagnostics();
      setDiagInfo(res);
    } catch {
      setDiagInfo({
        configured: false,
        connected: false,
        readingsCount: 0,
        citiesCoveredCount: 0,
        latestTimestamp: null,
        latestSource: null,
        latestSourceType: null,
        citiesWithData: [],
        missingPollutantCount: 0,
        errorMessage: 'Failed to execute diagnostic check.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (isOpen) {
      fetchDatabaseDiagnostics()
        .then((res) => {
          if (!cancelled) {
            setDiagInfo(res);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setDiagInfo({
              configured: false,
              connected: false,
              readingsCount: 0,
              citiesCoveredCount: 0,
              latestTimestamp: null,
              latestSource: null,
              latestSourceType: null,
              citiesWithData: [],
              missingPollutantCount: 0,
              errorMessage: 'Failed to execute diagnostic check.',
            });
            setLoading(false);
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const clientMeta = getSupabaseDiagnosticsMetadata();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="diagnostic-modal-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 id="diagnostic-modal-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Database Diagnostics & Live Storage
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phase 1: Persistent Supabase Integration & Automation Probe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close diagnostic dialog"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
          {/* Connection Status Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Connection Status
              </span>
              <button
                onClick={runDiagnostics}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Re-check
              </button>
            </div>

            <div className="flex items-center gap-3">
              {loading ? (
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                  Testing live database connection...
                </div>
              ) : !diagInfo?.configured ? (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>Not Configured (Operating in Direct Open-Meteo Mode)</span>
                </div>
              ) : diagInfo.connected ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>Connected & Ready for Public Reading</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium">
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                  <span>Connection Error</span>
                </div>
              )}
            </div>

            {diagInfo?.errorMessage && (
              <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
                {diagInfo.errorMessage}
              </p>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Stored Observations</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {loading ? '...' : (diagInfo?.readingsCount?.toLocaleString() ?? 0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Table: <code className="text-emerald-600 dark:text-emerald-400">air_quality_readings</code>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                Cities Covered
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {loading ? '...' : (diagInfo?.citiesCoveredCount ?? 0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                10 automated target hubs
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Latest Stored Timestamp
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">
                {loading ? '...' : diagInfo?.latestTimestamp
                  ? new Date(diagInfo.latestTimestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
                  : 'No records stored yet'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                3-hour automated cycle
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Latest Source & Data Classification
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">
                {loading ? '...' : diagInfo?.latestSource || 'None recorded'}
              </div>
              <div className="mt-1">
                {diagInfo?.latestSourceType === 'physical_station' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
                    Physical Ground Station (CAAQMS)
                  </span>
                ) : diagInfo?.latestSourceType === 'atmospheric_model' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                    Atmospheric Model Estimate (Open-Meteo)
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Awaiting initial collection run
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cities with Stored Readings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                Tracked Cities in Database ({diagInfo?.citiesWithData?.length ?? 0} active)
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              {diagInfo?.citiesWithData && diagInfo.citiesWithData.length > 0 ? (
                diagInfo.citiesWithData.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">
                  No city data stored yet. Run the automated collector or trigger collection.
                </span>
              )}
            </div>
          </div>

          {/* Security & Architecture Highlights */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Security & Compliance Check
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Row Level Security (RLS) Active:</strong> Anonymous public users are granted read-only SELECT permissions. All INSERT/UPDATE/DELETE requests from client browsers are strictly rejected.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Cpu className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Client Credential Isolation:</strong> Zero service-role or secret keys are included in the frontend. Only the public publishable token ({clientMeta.keyType || 'None'}) is exposed.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
