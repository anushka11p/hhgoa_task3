import React, { useState, useRef } from 'react';
import { UploadCloud, Camera, Eye, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { FaceDetectionResult } from '../types';

interface FaceScannerProps {
  onScanComplete: (file: File) => void;
  isLoading: boolean;
  faceResult: FaceDetectionResult | null;
}

const SAMPLE_FACES = [
  {
    name: 'Sample Portrait 1 (Public)',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600',
    filename: 'portrait_alpha.jpg'
  },
  {
    name: 'Sample Portrait 2 (Public)',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600',
    filename: 'portrait_beta.jpg'
  },
  {
    name: 'Sample Portrait 3 (Public)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
    filename: 'portrait_gamma.jpg'
  }
];

export const FaceScanner: React.FC<FaceScannerProps> = ({
  onScanComplete,
  isLoading,
  faceResult,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WebP)');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onScanComplete(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleSelect = async (sample: typeof SAMPLE_FACES[0]) => {
    try {
      setPreviewUrl(sample.url);
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const file = new File([blob], sample.filename, { type: 'image/jpeg' });
      onScanComplete(file);
    } catch (e) {
      console.error('Failed to load sample face:', e);
    }
  };

  const startWebcam = async () => {
    setIsWebcamActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Webcam access error:', err);
      setIsWebcamActive(false);
      alert('Camera access denied or unavailable.');
    }
  };

  const captureWebcam = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `webcam_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          stopWebcam();
          onScanComplete(file);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  return (
    <div className="surface p-6 rounded-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-4">
        <div>
          <span className="section-label">STEP 01 // INGESTION</span>
          <h2 className="text-xl font-bold font-mono tracking-tight text-[var(--text-primary)] mt-1">
            FACE SCAN &amp; EXTRACTION
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={isWebcamActive ? stopWebcam : startWebcam}
            disabled={isLoading}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isWebcamActive ? 'CANCEL CAMERA' : 'USE WEBCAM'}</span>
          </button>
        </div>
      </div>

      {/* Main Scanner Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Upload Zone or Preview */}
        <div className="lg:col-span-7">
          {isWebcamActive ? (
            <div className="relative rounded border border-[var(--border-bright)] bg-black overflow-hidden flex flex-col items-center justify-center min-h-[340px]">
              <video ref={videoRef} className="w-full h-auto max-h-[400px] object-cover" />
              <div className="absolute bottom-4 flex gap-3">
                <button onClick={captureWebcam} className="btn-primary text-xs px-4 py-2">
                  CAPTURE FRAME
                </button>
                <button onClick={stopWebcam} className="btn-secondary text-xs px-3 py-2">
                  CANCEL
                </button>
              </div>
            </div>
          ) : previewUrl ? (
            <div className="relative rounded border border-[var(--border-bright)] bg-black/40 overflow-hidden min-h-[340px] flex items-center justify-center p-2 scan-wrap">
              <img
                src={previewUrl}
                alt="Scan Subject"
                className="max-h-[360px] w-auto object-contain rounded"
              />

              {/* Bounding Box if detected */}
              {faceResult?.detected && faceResult.bbox && (
                <div
                  className="face-bbox"
                  style={{
                    left: `${faceResult.bbox[0] * 100}%`,
                    top: `${faceResult.bbox[1] * 100}%`,
                    width: `${(faceResult.bbox[2] - faceResult.bbox[0]) * 100}%`,
                    height: `${(faceResult.bbox[3] - faceResult.bbox[1]) * 100}%`,
                  }}
                >
                  <div className="face-bbox-corner -top-1 -left-1 border-t-2 border-l-2" />
                  <div className="face-bbox-corner -top-1 -right-1 border-t-2 border-r-2" />
                  <div className="face-bbox-corner -bottom-1 -left-1 border-b-2 border-l-2" />
                  <div className="face-bbox-corner -bottom-1 -right-1 border-b-2 border-r-2" />
                  <span className="absolute -top-5 left-0 font-mono text-[9px] bg-[var(--accent)] text-[#07100c] px-1 py-0.2 font-bold tracking-wider">
                    FACE_01 // {Math.round(faceResult.quality_score * 100)}%
                  </span>
                </div>
              )}

              {/* Scanning Active Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-[#07100c]/70 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="font-mono text-sm tracking-widest text-[var(--accent)] font-bold">
                    EXTRACTING VECTOR SIGNATURE...
                  </span>
                  <span className="font-mono text-xs text-[var(--text-secondary)] mt-1">
                    Running Deep Metric Embedding (ArcFace / 512D)
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`dropzone rounded p-8 min-h-[340px] flex flex-col items-center justify-center text-center ${
                dragActive ? 'drag-over' : ''
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className="w-14 h-14 rounded-full bg-[var(--accent-dim)] border border-[var(--border-bright)] flex items-center justify-center text-[var(--accent)] mb-4">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h3 className="font-mono text-base font-bold text-[var(--text-primary)] mb-1">
                DRAG &amp; DROP FACE SCAN
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4">
                Upload image file (JPG, PNG, WebP) or click to browse local files.
              </p>
              <span className="btn-secondary text-xs">CHOOSE IMAGE</span>
            </div>
          )}

          {/* Quick Demo Preload */}
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[var(--accent)]" />
              HACKATHON QUICK TEST:
            </span>
            {SAMPLE_FACES.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSampleSelect(s)}
                disabled={isLoading}
                className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--bg-raised)] hover:bg-[var(--accent-dim)] hover:text-[var(--accent)] border border-[var(--border)] text-[var(--text-secondary)] transition-colors"
              >
                Sample #{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Technical Metadata & Extraction Telemetry */}
        <div className="lg:col-span-5 space-y-4">
          <div className="surface-raised p-4 rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="section-label">TELEMETRY</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">512-DIM ARCFACE</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">DETECTION STATUS</span>
                <span className={faceResult?.detected ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-secondary)]'}>
                  {faceResult ? (faceResult.detected ? 'CONFIRMED' : 'NO FACE DETECTED') : 'AWAITING INPUT'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">QUALITY RATING</span>
                <span className="text-[var(--text-primary)]">
                  {faceResult ? `${Math.round(faceResult.quality_score * 100)}%` : '--'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">EMBEDDING VECTOR</span>
                <span className="text-[var(--text-primary)]">
                  {faceResult?.embedding_dim ? `${faceResult.embedding_dim}-dimensional normalized` : '--'}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-[var(--text-muted)]">EXTRACTION LATENCY</span>
                <span className="text-[var(--text-primary)]">
                  {faceResult?.processing_time_ms ? `${faceResult.processing_time_ms} ms` : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Privacy Notice Box */}
          <div className="p-3.5 rounded-sm bg-[#09150e] border border-[var(--border)] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--accent)]">
              <ShieldCheck className="w-4 h-4" />
              <span>PRIVACY ARCHITECTURE GUARANTEE</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Biometric vector coordinates are calculated strictly in volatility memory for candidate cosine distance ranking. 
              <strong> They are never saved to database tables or committed to blockchain logs.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
