export type PipelineStatus =
  | 'IDLE'
  | 'UPLOADED'
  | 'FACE_DETECTED'
  | 'EMBEDDED'
  | 'SEARCHING'
  | 'CANDIDATES_FOUND'
  | 'MATCHED'
  | 'FINGERPRINTED'
  | 'ANCHORING'
  | 'ANCHORED'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'TAMPER_DETECTED'
  | 'ERROR';

export interface FaceDetectionResult {
  detected: boolean;
  quality_score: number;
  bbox: [number, number, number, number] | null;
  processing_time_ms: number;
  embedding_dim: number | null;
}

export interface CandidateMatch {
  url: string;
  image_url: string;
  domain: string;
  title: string;
  similarity: number;
  similarity_pct: number;
  content_hash: string | null;
  snippet: string | null;
  search_provider: string;
  discovered_at: string;
  confidence_label: 'MATCH' | 'POSSIBLE_MATCH' | 'LOW_CONFIDENCE';
}

export interface BlockchainRecord {
  content_hash: string;
  source_reference: string;
  match_score_bps: number;
  match_score_pct: number;
  tx_hash: string | null;
  block_number: number | null;
  timestamp: number | null;
  network: string;
  contract_address: string | null;
  mode: 'PUBLIC_TESTNET' | 'LOCAL_DEMO_CHAIN' | string;
  explorer_url: string | null;
}

export interface VerificationResult {
  local_hash: string;
  onchain_hash: string;
  hashes_match: boolean;
  face_similarity: number;
  blockchain_confirmed: boolean;
  tamper_simulated: boolean;
  evidence_confidence: number;
  tamper_status: 'TAMPER_DETECTED' | 'NOT_ALTERED';
  overall_result: 'VERIFIED' | 'FAILED';
}

export interface TimelineEvent {
  ts: string;
  message: string;
}

export interface InvestigationData {
  id: string;
  status: PipelineStatus;
  created_at: string;
  updated_at: string;
  face_result: FaceDetectionResult | null;
  candidates: CandidateMatch[];
  best_match: CandidateMatch | null;
  candidate_count: number;
  search_provider_used: string;
  search_query: string;
  content_hash: string | null;
  content_url: string | null;
  blockchain_record: BlockchainRecord | null;
  verification_result: VerificationResult | null;
  events: TimelineEvent[];
}

export interface HealthStatus {
  status: string;
  face_backend: string;
  blockchain_mode: string;
  search_provider: string;
  demo_fallback_enabled: boolean;
  similarity_threshold: number;
}
