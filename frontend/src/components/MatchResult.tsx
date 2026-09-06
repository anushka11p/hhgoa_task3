import React from 'react';
import { ExternalLink, CheckCircle2, AlertCircle, Image as ImageIcon, ShieldAlert } from 'lucide-react';
import { CandidateMatch } from '../types';

interface MatchResultProps {
  bestMatch: CandidateMatch | null;
  candidates: CandidateMatch[];
  similarityThreshold: number;
}

export const MatchResult: React.FC<MatchResultProps> = ({
  bestMatch,
  candidates,
  similarityThreshold,
}) => {
  if (!bestMatch && candidates.length === 0) {
    return null;
  }

  const otherCandidates = candidates.filter((c) => c.url !== bestMatch?.url);

  return (
    <div className="surface p-6 rounded-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-4">
        <div>
          <span className="section-label">STEP 03 // PAIRWISE SIMILARITY ANALYSIS</span>
          <h2 className="text-xl font-bold font-mono tracking-tight text-[var(--text-primary)] mt-1">
            CANDIDATE DISCOVERY &amp; MATCH RANKING
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">VERIFICATION THRESHOLD:</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--bg-raised)] text-[var(--text-primary)] border border-[var(--border)]">
            {Math.round(similarityThreshold * 100)}%
          </span>
        </div>
      </div>

      {/* Primary Candidate Feature */}
      {bestMatch ? (
        <div className="surface-raised rounded-sm p-6 border border-[var(--border-bright)] glow-accent space-y-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[var(--accent-dim)] border border-[var(--border-bright)] flex items-center justify-center text-[var(--accent)]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-lg font-bold text-[var(--accent)]">
                    CANDIDATE MATCH CONFIRMED
                  </h3>
                  <span className="status-badge match">
                    {bestMatch.confidence_label}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-mono">
                  Discovered from public source domain: <strong>{bestMatch.domain}</strong>
                </p>
              </div>
            </div>

            {/* Large similarity metric */}
            <div className="text-right">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
                Cosine Similarity Score
              </span>
              <span className="display-number">
                {bestMatch.similarity_pct}%
              </span>
            </div>
          </div>

          {/* Side-by-side preview and forensic data */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Image Preview */}
            <div className="md:col-span-5 bg-black/50 border border-[var(--border)] rounded overflow-hidden p-2 flex items-center justify-center max-h-64">
              {bestMatch.image_url ? (
                <img
                  src={bestMatch.image_url}
                  alt={bestMatch.title || 'Discovered Content'}
                  className="max-h-56 w-auto object-contain rounded"
                />
              ) : (
                <div className="py-12 text-center text-xs font-mono text-[var(--text-muted)] flex flex-col items-center gap-2">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                  <span>PREVIEW BUFFER RESTRICTED</span>
                </div>
              )}
            </div>

            {/* Metadata Table */}
            <div className="md:col-span-7 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-3 py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">SOURCE TITLE</span>
                <span className="col-span-2 text-[var(--text-primary)] truncate font-semibold">
                  {bestMatch.title || 'Public Web Asset'}
                </span>
              </div>

              <div className="grid grid-cols-3 py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">SOURCE DOMAIN</span>
                <span className="col-span-2 text-[var(--accent)] font-semibold">
                  {bestMatch.domain}
                </span>
              </div>

              <div className="grid grid-cols-3 py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">DISCOVERY ENGINE</span>
                <span className="col-span-2 text-[var(--text-secondary)]">
                  {bestMatch.search_provider}
                </span>
              </div>

              <div className="grid grid-cols-3 py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">TIMESTAMP</span>
                <span className="col-span-2 text-[var(--text-secondary)]">
                  {new Date(bestMatch.discovered_at).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-3 py-1.5">
                <span className="text-[var(--text-muted)]">ORIGINAL URL</span>
                <div className="col-span-2 flex items-center gap-2 truncate">
                  <a
                    href={bestMatch.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline truncate flex items-center gap-1"
                  >
                    <span className="truncate">{bestMatch.url}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#0a140f] rounded border border-[var(--border)] text-[11px] font-mono text-[var(--text-secondary)] flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
            <span>
              <strong>FORENSIC CLASSIFICATION:</strong> Visual similarity metric exceeds required confidence bounds.
              Identity claim disclaimer: Matches represent public-source visual similarity, not legal personhood assertion.
            </span>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center surface-raised rounded-sm border border-[var(--border)] space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <h4 className="font-mono text-base font-bold text-[var(--text-primary)]">
            NO CANDIDATES ABOVE VERIFICATION THRESHOLD ({Math.round(similarityThreshold * 100)}%)
          </h4>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            Discovered web images did not meet the required cosine distance bounds. Try adjusting search context or ingesting another portrait frame.
          </p>
        </div>
      )}

      {/* Other candidates if any */}
      {otherCandidates.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[var(--text-muted)]">
              LOWER CONFIDENCE CANDIDATES ({otherCandidates.length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {otherCandidates.slice(0, 4).map((cand, idx) => (
              <div
                key={idx}
                className="surface-raised p-3 rounded-sm border border-[var(--border)] flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-black/40 rounded border border-[var(--border)] overflow-hidden flex-shrink-0">
                  {cand.image_url ? (
                    <img src={cand.image_url} alt="Candidate" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-4 h-4 m-auto text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-primary)] font-semibold truncate">
                      {cand.domain}
                    </span>
                    <span className="text-[var(--text-secondary)] font-bold">
                      {cand.similarity_pct}%
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">
                    {cand.title}
                  </div>
                  <div className="w-full bg-[var(--bg-base)] h-1 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-[var(--text-muted)] h-full"
                      style={{ width: `${cand.similarity_pct}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
