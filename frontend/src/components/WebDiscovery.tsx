import React, { useState } from 'react';
import { Globe, Search, Terminal, AlertTriangle, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { TimelineEvent } from '../types';

interface WebDiscoveryProps {
  onTriggerSearch: (query: string) => void;
  isSearching: boolean;
  searchProvider: string;
  candidateCount: number;
  events: TimelineEvent[];
  disabled: boolean;
  hasSearched: boolean;
}

export const WebDiscovery: React.FC<WebDiscoveryProps> = ({
  onTriggerSearch,
  isSearching,
  searchProvider,
  candidateCount,
  events,
  disabled,
  hasSearched,
}) => {
  const [query, setQuery] = useState('public face portrait identity profile photography');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled && !isSearching) {
      onTriggerSearch(query);
    }
  };

  const isDemoFallback = searchProvider?.includes('DEMO_FALLBACK');

  return (
    <div className="surface p-6 rounded-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-4">
        <div>
          <span className="section-label">STEP 02 // PUBLIC WEB DISCOVERY</span>
          <h2 className="text-xl font-bold font-mono tracking-tight text-[var(--text-primary)] mt-1">
            OPEN-WEB SEARCH &amp; REVERSE CORRELATION
          </h2>
        </div>

        {searchProvider && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--text-muted)]">ACTIVE ENGINE:</span>
            <span
              className={`font-mono text-xs px-2.5 py-1 rounded border uppercase font-bold ${
                isDemoFallback
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--border-bright)]'
              }`}
            >
              {searchProvider}
            </span>
          </div>
        )}
      </div>

      {isDemoFallback && (
        <div className="p-3 rounded-sm bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed font-mono">
            <strong>HONEST TRANSPARENCY NOTICE:</strong> External search API keys (SERPAPI_KEY / BING_API_KEY) are not set in environment.
            The pipeline is executing using dynamic public fixtures from Wikimedia / Unsplash to evaluate face embeddings and candidate scoring without simulation deception.
          </div>
        </div>
      )}

      {/* Query Bar */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={disabled || isSearching}
            placeholder="Search query context for open-web correlation..."
            className="w-full bg-[var(--bg-base)] border border-[var(--border)] focus:border-[var(--accent)] text-xs font-mono text-[var(--text-primary)] pl-10 pr-4 py-3 rounded-sm outline-none transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || isSearching}
          className="btn-primary text-xs flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#07100c]" />
              <span>CRAWLING CANDIDATES...</span>
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              <span>EXECUTE WEB DISCOVERY</span>
            </>
          )}
        </button>
      </form>

      {/* Live Forensics Terminal Stream */}
      <div className="surface-raised rounded-sm overflow-hidden border border-[var(--border)]">
        <div className="bg-[#0a140f] px-4 py-2 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
            <Terminal className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>FORENSIC TELEMETRY STREAM</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {events.length} LOGGED EVENTS
            </span>
          </div>
        </div>

        <div className="p-4 bg-[#050b08] font-mono text-xs max-h-56 overflow-y-auto space-y-1.5 scrollbar-thin">
          {events.length === 0 ? (
            <div className="text-[var(--text-muted)] py-4 text-center">
              Awaiting telemetry initiation. Upload a face to start ingestion.
            </div>
          ) : (
            events.map((ev, i) => (
              <div key={i} className="flex items-start gap-2 leading-relaxed">
                <span className="text-[var(--text-muted)] select-none">
                  [{new Date(ev.ts).toLocaleTimeString()}]
                </span>
                <span
                  className={
                    ev.message.includes('confirmed') || ev.message.includes('fingerprint')
                      ? 'text-[var(--accent)] font-semibold'
                      : ev.message.includes('failed') || ev.message.includes('TAMPER')
                      ? 'text-red-400 font-semibold'
                      : 'text-[var(--text-secondary)]'
                  }
                >
                  {ev.message}
                </span>
              </div>
            ))
          )}
          {isSearching && (
            <div className="flex items-center gap-2 text-[var(--accent)] animate-pulse pt-1">
              <span className="text-[var(--text-muted)]">[{new Date().toLocaleTimeString()}]</span>
              <span>Downloading candidate web buffers &amp; computing pairwise cosine distances...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
