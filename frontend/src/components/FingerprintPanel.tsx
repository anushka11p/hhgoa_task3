import React from 'react';
import { Fingerprint, Lock, ArrowRight, ShieldCheck, Copy, Check } from 'lucide-react';

interface FingerprintPanelProps {
  contentHash: string | null;
  contentUrl: string | null;
  onAnchor: () => void;
  isAnchoring: boolean;
  isAnchored: boolean;
}

export const FingerprintPanel: React.FC<FingerprintPanelProps> = ({
  contentHash,
  contentUrl,
  onAnchor,
  isAnchoring,
  isAnchored,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!contentHash) return null;

  const copyHash = () => {
    navigator.clipboard.writeText(contentHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="surface p-6 rounded-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-4">
        <div>
          <span className="section-label">STEP 04 // CRYPTOGRAPHIC REDUCTION</span>
          <h2 className="text-xl font-bold font-mono tracking-tight text-[var(--text-primary)] mt-1">
            SHA-256 CONTENT FINGERPRINT
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">HASH DIGEST:</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--border-bright)]">
            256-BIT SECURE HASH
          </span>
        </div>
      </div>

      {/* Prominent Hash Container */}
      <div className="surface-raised p-5 rounded-sm border border-[var(--border-bright)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
            <Lock className="w-4 h-4 text-[var(--accent)]" />
            <span>CALCULATED CONTENT HASH (HEX)</span>
          </div>
          <button
            onClick={copyHash}
            className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[var(--accent)]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>

        <div className="p-4 bg-[#050b08] rounded border border-[var(--border)] font-mono text-sm tracking-wider text-[var(--accent)] break-all select-all font-semibold shadow-inner">
          {contentHash}
        </div>

        {contentUrl && (
          <div className="text-[11px] font-mono text-[var(--text-muted)] truncate flex items-center gap-2">
            <span>SOURCE TARGET:</span>
            <span className="text-[var(--text-secondary)] truncate">{contentUrl}</span>
          </div>
        )}
      </div>

      {/* Privacy Architecture Notice */}
      <div className="p-4 rounded-sm bg-[#09150e] border border-[var(--border)] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-secondary)] leading-relaxed font-mono">
          <strong className="text-[var(--text-primary)]">ZERO BIOMETRICS ON-CHAIN: </strong>
          The discovered public media asset is hashed into an immutable 32-byte digest. Neither user face photographs
          nor mathematical face embeddings will touch the blockchain ledger.
        </div>
      </div>

      {/* Anchor Trigger Action */}
      {!isAnchored && (
        <div className="pt-2 flex justify-end">
          <button
            onClick={onAnchor}
            disabled={isAnchoring}
            className="btn-primary text-xs flex items-center gap-2 px-6 py-3"
          >
            {isAnchoring ? (
              <>
                <div className="w-4 h-4 border-2 border-[#07100c] border-t-transparent rounded-full animate-spin" />
                <span>COMMITTING TX TO EVM LEDGER...</span>
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                <span>ANCHOR EVIDENCE TO BLOCKCHAIN</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
