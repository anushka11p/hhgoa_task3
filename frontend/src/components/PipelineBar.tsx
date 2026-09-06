import React from 'react';
import { PipelineStatus } from '../types';
import { Scan, Globe, CheckCircle, Fingerprint, Blocks, ShieldAlert, ChevronRight } from 'lucide-react';

interface PipelineBarProps {
  status: PipelineStatus;
}

interface Step {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  statuses: PipelineStatus[];
}

const STEPS: Step[] = [
  { id: 'face', name: 'FACE SCAN', icon: Scan, statuses: ['UPLOADED', 'FACE_DETECTED', 'EMBEDDED'] },
  { id: 'discover', name: 'DISCOVER', icon: Globe, statuses: ['SEARCHING', 'CANDIDATES_FOUND'] },
  { id: 'match', name: 'MATCH', icon: CheckCircle, statuses: ['MATCHED'] },
  { id: 'fingerprint', name: 'FINGERPRINT', icon: Fingerprint, statuses: ['FINGERPRINTED'] },
  { id: 'anchor', name: 'ANCHOR', icon: Blocks, statuses: ['ANCHORING', 'ANCHORED'] },
  { id: 'verify', name: 'VERIFY', icon: ShieldAlert, statuses: ['VERIFYING', 'VERIFIED', 'TAMPER_DETECTED'] },
];

const ORDERED_FLOW: PipelineStatus[] = [
  'IDLE',
  'UPLOADED',
  'FACE_DETECTED',
  'EMBEDDED',
  'SEARCHING',
  'CANDIDATES_FOUND',
  'MATCHED',
  'FINGERPRINTED',
  'ANCHORING',
  'ANCHORED',
  'VERIFYING',
  'VERIFIED',
  'TAMPER_DETECTED',
];

export const PipelineBar: React.FC<PipelineBarProps> = ({ status }) => {
  const currentStatusIndex = ORDERED_FLOW.indexOf(status);

  return (
    <div className="w-full bg-[#0d1a13]/80 border-y border-[var(--border)] py-3 px-4 overflow-x-auto">
      <div className="max-w-7xl mx-auto flex items-center justify-between min-w-[650px] gap-2">
        {STEPS.map((step, idx) => {
          const isCurrent = step.statuses.includes(status);
          const firstStatusIndex = ORDERED_FLOW.indexOf(step.statuses[0]);
          const isPassed = currentStatusIndex > firstStatusIndex && !isCurrent;
          const Icon = step.icon;

          let stateClasses = 'text-[var(--text-muted)] border-transparent opacity-60';
          if (isCurrent) {
            stateClasses = 'text-[var(--accent)] bg-[var(--accent-dim)] border-[var(--border-bright)] shadow-[0_0_12px_rgba(200,241,53,0.15)] font-bold';
          } else if (isPassed) {
            stateClasses = 'text-[var(--text-primary)] border-[var(--border)] bg-[#111f18]';
          }

          return (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border font-mono text-xs transition-all ${stateClasses}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'animate-pulse text-[var(--accent)]' : ''}`} />
                <span>{step.name}</span>
                {isPassed && <span className="text-[10px] text-[var(--accent)] ml-0.5">✓</span>}
              </div>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
