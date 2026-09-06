import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cpu,
  Fingerprint,
  Blocks,
  FileCheck,
} from 'lucide-react';
import { VerificationResult } from '../types';

interface VerificationPanelProps {
  result: VerificationResult | null;
  onVerify: () => void;
  onSimulateTamper: () => void;
  onRestoreOriginal: () => void;
  isVerifying: boolean;
  isTampering: boolean;
  isRestoring: boolean;
  disabled: boolean;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({
  result,
  onVerify,
  onSimulateTamper,
  onRestoreOriginal,
  isVerifying,
  isTampering,
  isRestoring,
  disabled,
}) => {
  const isVerified = result?.overall_result === 'VERIFIED';
  const isTampered = result?.tamper_status === 'TAMPER_DETECTED' || result?.tamper_simulated;

  return (
    <div className="surface p-6 rounded-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-4">
        <div>
          <span className="section-label">STEP 06 // AUDIT &amp; TAMPER DETECTION</span>
          <h2 className="text-xl font-bold font-mono tracking-tight text-[var(--text-primary)] mt-1">
            CRYPTOGRAPHIC PROOF &amp; INTEGRITY AUDIT
          </h2>
        </div>

        {result && (
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs px-3 py-1 rounded border font-bold uppercase ${
                isVerified
                  ? 'bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--border-bright)]'
                  : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}
            >
              {isVerified ? '✓ INTEGRITY CONFIRMED' : '✕ INTEGRITY BREACHED'}
            </span>
          </div>
        )}
      </div>

      {!result ? (
        <div className="surface-raised p-8 rounded-sm text-center border border-[var(--border)] space-y-4">
          <FileCheck className="w-10 h-10 text-[var(--accent)] mx-auto" />
          <div className="space-y-1">
            <h3 className="font-mono text-base font-bold text-[var(--text-primary)]">
              READY FOR INDEPENDENT VERIFICATION
            </h3>
            <p className="text-xs text-[var(--text-secondary)] font-mono max-w-md mx-auto">
              The engine will re-acquire content from its public web origin, recalculate its SHA-256 digest in isolation,
              and query the EVM state for bit-for-bit cryptographic congruence.
            </p>
          </div>
          <button
            onClick={onVerify}
            disabled={disabled || isVerifying}
            className="btn-primary text-xs mx-auto flex items-center gap-2"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-[#07100c] border-t-transparent rounded-full animate-spin" />
                <span>QUERYING ON-CHAIN AUDIT STATE...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>RUN CRYPTOGRAPHIC VERIFICATION</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Verdict Card */}
          <div
            className={`surface-raised rounded-sm p-6 border ${
              isVerified
                ? 'border-[var(--border-bright)] shadow-[0_0_24px_rgba(200,241,53,0.12)]'
                : 'border-red-500/40 bg-red-950/10 shadow-[0_0_24px_rgba(230,57,70,0.15)]'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded flex items-center justify-center border ${
                    isVerified
                      ? 'bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--border-bright)]'
                      : 'bg-red-500/20 text-red-400 border-red-500/40'
                  }`}
                >
                  {isVerified ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
                </div>
                <div>
                  <h3
                    className={`font-mono text-xl font-bold ${
                      isVerified ? 'text-[var(--accent)]' : 'text-red-400'
                    }`}
                  >
                    {isVerified ? 'CONTENT VERIFIED — PROVENANCE INTACT' : 'VERIFICATION FAILED — TAMPER DETECTED'}
                  </h3>
                  <p className="text-xs font-mono text-[var(--text-secondary)]">
                    {isVerified
                      ? 'Independent re-hash matches the immutable blockchain record exactly.'
                      : 'Discovered content hash does not match the immutable blockchain commitment.'}
                  </p>
                </div>
              </div>

              {/* Evidence Confidence Score */}
              <div className="text-right">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
                  Evidence Confidence Index
                </span>
                <span
                  className={`display-number ${
                    isVerified ? 'text-[var(--accent)]' : 'text-red-400'
                  }`}
                >
                  {Math.round(result.evidence_confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Hash Comparison Table */}
            <div className="pt-4 space-y-3 font-mono text-xs">
              <div className="p-3 bg-[#050b08] rounded border border-[var(--border)] space-y-1">
                <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] uppercase">
                  <span>LOCAL DIGEST (RE-CALCULATED FROM WEB ASSET)</span>
                  {result.tamper_simulated && (
                    <span className="text-amber-400 font-bold">[1 BYTE ALTERED FOR DEMO]</span>
                  )}
                </div>
                <div
                  className={`break-all font-semibold select-all ${
                    isVerified ? 'text-[var(--text-primary)]' : 'text-red-400'
                  }`}
                >
                  {result.local_hash}
                </div>
              </div>

              <div className="p-3 bg-[#050b08] rounded border border-[var(--border)] space-y-1">
                <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] uppercase">
                  <span>ON-CHAIN DIGEST (COMMITTED TO SMART CONTRACT)</span>
                  <span className="text-[var(--accent)] font-bold">[IMMUTABLE RECORD]</span>
                </div>
                <div className="text-[var(--accent)] break-all font-semibold select-all">
                  {result.onchain_hash}
                </div>
              </div>
            </div>

            {/* Forensic Matrix Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--border)] font-mono text-xs">
              <div className="p-2.5 rounded bg-[var(--bg-base)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">FACE SIMILARITY</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {Math.round(result.face_similarity * 1000) / 10}%
                </span>
              </div>

              <div className="p-2.5 rounded bg-[var(--bg-base)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">FINGERPRINT HASH</span>
                <span className={`font-bold ${result.hashes_match ? 'text-[var(--accent)]' : 'text-red-400'}`}>
                  {result.hashes_match ? 'MATCH' : 'MISMATCH'}
                </span>
              </div>

              <div className="p-2.5 rounded bg-[var(--bg-base)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">BLOCKCHAIN RECORD</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {result.blockchain_confirmed ? 'CONFIRMED' : 'UNCONFIRMED'}
                </span>
              </div>

              <div className="p-2.5 rounded bg-[var(--bg-base)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">TAMPER STATUS</span>
                <span className={`font-bold ${isVerified ? 'text-[var(--accent)]' : 'text-red-400'}`}>
                  {result.tamper_status === 'NOT_ALTERED' ? 'NOT ALTERED' : 'ALTERED'}
                </span>
              </div>
            </div>
          </div>

          {/* Hackathon Money-Shot Controls: Simulate Tamper & Restore */}
          <div className="surface-raised rounded-sm p-5 border border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                HACKATHON DEMO: PROVE WHY BLOCKCHAIN IS NECESSARY
              </span>
              <p className="text-[11px] font-mono text-[var(--text-secondary)]">
                Mutate 1 byte of the content buffer to verify the cryptographic mismatch against the immutable on-chain record.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isTampered ? (
                <button
                  onClick={onSimulateTamper}
                  disabled={isTampering}
                  className="btn-danger text-xs whitespace-nowrap flex-1 sm:flex-none flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>SIMULATE TAMPER CHECK</span>
                </button>
              ) : (
                <button
                  onClick={onRestoreOriginal}
                  disabled={isRestoring}
                  className="btn-primary text-xs whitespace-nowrap flex-1 sm:flex-none flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESTORE ORIGINAL ASSET</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
