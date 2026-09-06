import React from 'react';
import { ShieldCheck, Cpu, Database, Activity, RefreshCw } from 'lucide-react';
import { HealthStatus } from '../types';

interface NavbarProps {
  health: HealthStatus | null;
  onReset: () => void;
  investigationId: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ health, onReset, investigationId }) => {
  const isTestnet = health?.blockchain_mode?.includes('PUBLIC_TESTNET');

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[#07100c]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onReset}>
          <div className="w-8 h-8 rounded-sm bg-[var(--accent)] flex items-center justify-center text-[#07100c] font-black text-sm tracking-tighter">
            T//V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm tracking-wider font-bold text-[var(--text-primary)]">
                TRACE // VERIFY
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--border-bright)]">
                FORENSIC ENGINE
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] tracking-tight hidden sm:block">
              Face Identification &amp; Blockchain Provenance Pipeline
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Privacy by Design Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-[11px] font-mono text-[var(--text-secondary)]">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Biometric Data Ephemeral</span>
          </div>

          {/* Search Provider */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-[11px] font-mono text-[var(--text-secondary)]">
            <Cpu className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="uppercase">
              Search: {health ? health.search_provider : 'PROBING...'}
            </span>
          </div>

          {/* Blockchain Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono font-medium">
            <Database className="w-3.5 h-3.5 text-[var(--accent)]" />
            {isTestnet ? (
              <span className="text-[var(--accent)]">TESTNET: POLYGON AMOY</span>
            ) : (
              <span className="text-[#f59e0b]">CHAIN: LOCAL DEMO</span>
            )}
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
            </span>
          </div>

          {/* New Investigation Button */}
          {investigationId && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--bg-surface)] hover:bg-[var(--accent-dim)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
              title="Start fresh investigation"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">NEW SCAN</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
