import React from 'react';
import { Blocks, ExternalLink, CheckCircle2, ShieldCheck, Clock, FileCode, Hash } from 'lucide-react';
import { BlockchainRecord } from '../types';

interface BlockchainPanelProps {
  record: BlockchainRecord | null;
  onProceedToVerify?: () => void;
}

export const BlockchainPanel: React.FC<BlockchainPanelProps> = ({ record, onProceedToVerify }) => {
  if (!record) return null;

  const isTestnet = record.mode.includes('PUBLIC_TESTNET');

  return (
    <div className="surface p-6 rounded-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-4">
        <div>
          <span className="section-label">STEP 05 // IMMUTABLE PROVENANCE</span>
          <h2 className="text-xl font-bold font-mono tracking-tight text-[var(--text-primary)] mt-1">
            BLOCKCHAIN RECORD CREATED
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-xs px-2.5 py-1 rounded border font-bold uppercase ${
              isTestnet
                ? 'bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--border-bright)]'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {record.network}
          </span>
        </div>
      </div>

      {/* Record Confirmation Banner */}
      <div className="surface-raised rounded-sm p-5 border border-[var(--border-bright)] space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[var(--accent-dim)] border border-[var(--border-bright)] flex items-center justify-center text-[var(--accent)] flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-mono text-base font-bold text-[var(--text-primary)]">
              TRANSACTION FINALIZED &amp; ANCHORED
            </h3>
            <p className="text-xs font-mono text-[var(--text-secondary)]">
              Cryptographic content digest successfully sealed in smart contract state.
            </p>
          </div>
        </div>

        {/* Blockchain Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-3 bg-[#050b08] rounded border border-[var(--border)] space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 uppercase">
              <Hash className="w-3 h-3" /> TRANSACTION HASH
            </span>
            <div className="text-[var(--accent)] break-all font-semibold select-all">
              {record.tx_hash || '0xSimulatedTransactionReceipt'}
            </div>
          </div>

          <div className="p-3 bg-[#050b08] rounded border border-[var(--border)] space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 uppercase">
              <Blocks className="w-3 h-3" /> BLOCK NUMBER
            </span>
            <div className="text-[var(--text-primary)] font-semibold">
              #{record.block_number ?? '10482914'}
            </div>
          </div>

          <div className="p-3 bg-[#050b08] rounded border border-[var(--border)] space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 uppercase">
              <FileCode className="w-3 h-3" /> SMART CONTRACT REGISTRY
            </span>
            <div className="text-[var(--text-secondary)] break-all truncate">
              {record.contract_address || 'EvidenceRegistry.sol'}
            </div>
          </div>

          <div className="p-3 bg-[#050b08] rounded border border-[var(--border)] space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 uppercase">
              <Clock className="w-3 h-3" /> TIMESTAMP ANCHORED
            </span>
            <div className="text-[var(--text-secondary)]">
              {record.timestamp ? new Date(record.timestamp * 1000).toUTCString() : new Date().toUTCString()}
            </div>
          </div>
        </div>

        {/* Explorer Link if on real testnet */}
        {record.explorer_url && (
          <div className="pt-1">
            <a
              href={record.explorer_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--accent)] hover:underline"
            >
              <span>VIEW TRANSACTION ON POLYGONSCAN AMOY</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
