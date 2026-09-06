import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PipelineBar } from './components/PipelineBar';
import { FaceScanner } from './components/FaceScanner';
import { WebDiscovery } from './components/WebDiscovery';
import { MatchResult } from './components/MatchResult';
import { FingerprintPanel } from './components/FingerprintPanel';
import { BlockchainPanel } from './components/BlockchainPanel';
import { VerificationPanel } from './components/VerificationPanel';
import { api } from './lib/api';
import { InvestigationData, HealthStatus, PipelineStatus } from './types';
import {
  ShieldCheck,
  Cpu,
  Database,
  ArrowRight,
  Terminal,
  Activity,
  Layers,
  Search,
  ExternalLink,
} from 'lucide-react';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [investigation, setInvestigation] = useState<InvestigationData | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTampering, setIsTampering] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (e) {
      console.warn('Backend offline or starting up:', e);
    }
  };

  const handleStartInvestigation = () => {
    setHasStarted(true);
    const element = document.getElementById('investigation-console');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReset = () => {
    setInvestigation(null);
    setHasStarted(false);
    setErrorNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFaceUpload = async (file: File) => {
    setIsUploading(true);
    setErrorNotice(null);
    try {
      const res = await api.uploadFace(file);
      // Fetch full investigation
      const full = await api.getInvestigation(res.investigation_id);
      setInvestigation(full);
      setHasStarted(true);

      // Auto-scroll to discovery
      setTimeout(() => {
        const discEl = document.getElementById('step-discovery');
        if (discEl) discEl.scrollIntoView({ behavior: 'smooth' });
      }, 600);
    } catch (err: any) {
      console.error('Face upload error:', err);
      const msg = err.response?.data?.error || 'Failed to detect face. Try another portrait image.';
      setErrorNotice(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTriggerSearch = async (query: string) => {
    if (!investigation) return;
    setIsSearching(true);
    setErrorNotice(null);
    try {
      const updated = await api.runSearch(investigation.id, query);
      setInvestigation(updated);

      // Auto-scroll to match result
      setTimeout(() => {
        const matchEl = document.getElementById('step-match');
        if (matchEl) matchEl.scrollIntoView({ behavior: 'smooth' });
      }, 600);
    } catch (err: any) {
      console.error('Search error:', err);
      setErrorNotice('Search discovery encountered an error.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAnchor = async () => {
    if (!investigation) return;
    setIsAnchoring(true);
    setErrorNotice(null);
    try {
      const updated = await api.anchorEvidence(investigation.id);
      setInvestigation(updated);

      setTimeout(() => {
        const blockEl = document.getElementById('step-blockchain');
        if (blockEl) blockEl.scrollIntoView({ behavior: 'smooth' });
      }, 600);
    } catch (err: any) {
      console.error('Anchor error:', err);
      setErrorNotice('Blockchain anchoring failed. Check console for RPC details.');
    } finally {
      setIsAnchoring(false);
    }
  };

  const handleVerify = async () => {
    if (!investigation) return;
    setIsVerifying(true);
    setErrorNotice(null);
    try {
      const updated = await api.verifyEvidence(investigation.id);
      setInvestigation(updated);

      setTimeout(() => {
        const verifyEl = document.getElementById('step-verification');
        if (verifyEl) verifyEl.scrollIntoView({ behavior: 'smooth' });
      }, 600);
    } catch (err: any) {
      console.error('Verify error:', err);
      setErrorNotice('Cryptographic verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    if (!investigation) return;
    setIsTampering(true);
    try {
      const updated = await api.simulateTamper(investigation.id);
      setInvestigation(updated);
    } catch (err: any) {
      console.error('Tamper error:', err);
    } finally {
      setIsTampering(false);
    }
  };

  const handleRestoreOriginal = async () => {
    if (!investigation) return;
    setIsRestoring(true);
    try {
      const updated = await api.restoreOriginal(investigation.id);
      setInvestigation(updated);
    } catch (err: any) {
      console.error('Restore error:', err);
    } finally {
      setIsRestoring(false);
    }
  };

  const currentStatus: PipelineStatus = investigation?.status || 'IDLE';

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] selection:bg-[var(--accent)] selection:text-[#07100c]">
      {/* Top Navbar */}
      <Navbar
        health={health}
        onReset={handleReset}
        investigationId={investigation?.id || null}
      />

      {/* Persistent Pipeline Indicator */}
      <PipelineBar status={currentStatus} />

      {/* Error Alert Bar */}
      {errorNotice && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-center text-xs font-mono text-red-400">
          <strong>ALERT:</strong> {errorNotice}
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--border)] py-16 lg:py-24">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d1a13_1px,transparent_1px),linear-gradient(to_bottom,#0d1a13_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[var(--border-bright)] bg-[var(--accent-dim)] text-[var(--accent)] font-mono text-xs tracking-wider font-semibold">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
              <span>DIGITAL PROVENANCE INVESTIGATION ENGINE</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold font-serif tracking-tight leading-[1.05] text-[var(--text-primary)]">
              Trace the face. <br />
              <span className="text-[var(--accent)] text-glow">Verify the evidence.</span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--text-secondary)] font-sans max-w-2xl leading-relaxed">
              Identify visual matches across public web sources and anchor discovered content to an immutable,
              tamper-evident blockchain record on Polygon Amoy.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={handleStartInvestigation}
                className="btn-primary text-sm flex items-center gap-3 px-8 py-4"
              >
                <span>START INVESTIGATION</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 font-mono text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[var(--accent)]" /> Zero Biometrics On-Chain
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#38bdf8]" /> Polygon Amoy EVM
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Investigation Console */}
      <main id="investigation-console" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Step 01: Face Scan */}
        <section id="step-scan">
          <FaceScanner
            onScanComplete={handleFaceUpload}
            isLoading={isUploading}
            faceResult={investigation?.face_result || null}
          />
        </section>

        {/* Step 02: Web Discovery */}
        <section id="step-discovery">
          <WebDiscovery
            onTriggerSearch={handleTriggerSearch}
            isSearching={isSearching}
            searchProvider={investigation?.search_provider_used || ''}
            candidateCount={investigation?.candidate_count || 0}
            events={investigation?.events || []}
            disabled={!investigation?.face_result?.detected}
            hasSearched={Boolean(investigation?.candidate_count)}
          />
        </section>

        {/* Step 03: Match Results */}
        <section id="step-match">
          <MatchResult
            bestMatch={investigation?.best_match || null}
            candidates={investigation?.candidates || []}
            similarityThreshold={health?.similarity_threshold ?? 0.65}
          />
        </section>

        {/* Step 04: Cryptographic Fingerprint */}
        {investigation?.content_hash && (
          <section id="step-fingerprint">
            <FingerprintPanel
              contentHash={investigation.content_hash}
              contentUrl={investigation.content_url}
              onAnchor={handleAnchor}
              isAnchoring={isAnchoring}
              isAnchored={Boolean(investigation.blockchain_record)}
            />
          </section>
        )}

        {/* Step 05: Blockchain Record */}
        {investigation?.blockchain_record && (
          <section id="step-blockchain">
            <BlockchainPanel record={investigation.blockchain_record} />
          </section>
        )}

        {/* Step 06: Verification & Tamper Detection */}
        {investigation?.blockchain_record && (
          <section id="step-verification">
            <VerificationPanel
              result={investigation?.verification_result || null}
              onVerify={handleVerify}
              onSimulateTamper={handleSimulateTamper}
              onRestoreOriginal={handleRestoreOriginal}
              isVerifying={isVerifying}
              isTampering={isTampering}
              isRestoring={isRestoring}
              disabled={!investigation?.blockchain_record}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[#050b08] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs text-[var(--text-muted)]">
          <div className="space-y-1 text-center md:text-left">
            <div className="text-[var(--text-primary)] font-bold tracking-wider">
              TRACE // VERIFY — FORENSIC PROVENANCE SYSTEM
            </div>
            <div>Built for Hackathon Goa 2026 Shortlisting Task 3</div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <span>Polygon Amoy Testnet</span>
            <span>ArcFace 512-D</span>
            <span>SHA-256 Digest</span>
            <span>Privacy by Design</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
