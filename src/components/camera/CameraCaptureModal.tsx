import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, RefreshCw, X, Zap, Sun, RotateCw } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string, fileName: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [flashOn, setFlashOn] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'normal' | 'contrast' | 'mono'>('contrast');
  const [rotation, setRotation] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setErrorMessage(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setErrorMessage(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setHasCamera(true);
    } catch (err: any) {
      console.warn('Real camera not available or permission denied, using scanner simulator:', err);
      setHasCamera(false);
      setErrorMessage('Physical camera not accessible in browser environment. Interactive document scanner mode is active.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && hasCamera) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Apply rotation if needed
        if (rotation !== 0) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(video, -canvas.width / 2, -canvas.height / 2);
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // Apply contrast enhancement
        if (filterMode === 'contrast') {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;
          const factor = 1.3;
          for (let i = 0; i < d.length; i += 4) {
            d[i] = Math.min(255, Math.max(0, factor * (d[i] - 128) + 128));
            d[i + 1] = Math.min(255, Math.max(0, factor * (d[i + 1] - 128) + 128));
            d[i + 2] = Math.min(255, Math.max(0, factor * (d[i + 2] - 128) + 128));
          }
          ctx.putImageData(imgData, 0, 0);
        } else if (filterMode === 'mono') {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            d[i] = v > 120 ? 255 : 30;
            d[i + 1] = v > 120 ? 255 : 30;
            d[i + 2] = v > 120 ? 255 : 30;
          }
          ctx.putImageData(imgData, 0, 0);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    } else {
      // Generate realistic test document capture
      generateSimulatedCapture();
    }
  };

  const generateSimulatedCapture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Paper background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 1200, 1600);

      // Border and header
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0f172a';
      ctx.strokeRect(40, 40, 1120, 1520);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(40, 40, 1120, 180);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NATIONAL BOARD OF HIGHER ACCREDITATION', 600, 110);
      ctx.font = '22px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('CAMERA-X SCANNED INSTITUTIONAL RECORD', 600, 160);

      // Candidate block
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'left';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('Candidate Name: Aakash Sharma', 100, 320);
      ctx.font = '24px monospace';
      ctx.fillText('Serial ID: CAM-SCAN-2026-9812', 100, 380);
      ctx.fillText('Issue Date: 16-10-2024', 100, 440);
      ctx.fillText('Accreditation Track: Faculty Qualification', 100, 500);

      // Stamp
      ctx.beginPath();
      ctx.arc(600, 850, 120, 0, Math.PI * 2);
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AUTHENTICATED', 600, 840);
      ctx.font = '18px monospace';
      ctx.fillText('SIH CAMERA-X 2026', 600, 875);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      const fileName = `Camera_Scan_${Date.now().toString().slice(-4)}.jpg`;
      onCapture(capturedImage, fileName);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-xs">
      <div className="relative flex flex-col w-full max-w-xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Document Scanner</h3>
              <p className="text-xs text-slate-500">Position document within the illuminated viewfinder</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Area */}
        <div className="relative aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Scanned Document"
              className="w-full h-full object-contain"
            />
          ) : hasCamera ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${flashOn ? 'brightness-125' : ''}`}
              />
              {/* Document Alignment Frame */}
              <div className="absolute inset-8 border-2 border-indigo-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-3 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                <div className="flex justify-between items-start">
                  <div className="w-6 h-6 border-t-4 border-l-4 border-cyan-400" />
                  <div className="w-6 h-6 border-t-4 border-r-4 border-cyan-400" />
                </div>
                <div className="text-center">
                  <span className="px-3 py-1 bg-black/60 rounded-md text-[11px] font-medium text-cyan-300 backdrop-blur-sm">
                    Fit entire page inside bounds
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-6 h-6 border-b-4 border-l-4 border-cyan-400" />
                  <div className="w-6 h-6 border-b-4 border-r-4 border-cyan-400" />
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 text-slate-300">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-indigo-400">
                <Camera className="w-8 h-8" />
              </div>
              <h4 className="text-base font-semibold text-white mb-1">Document Capture Simulator</h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Hardware camera stream inactive in container. Click "Capture Simulated Document" to test image processing pipeline.
              </p>
            </div>
          )}

          {/* Flash Effect Overlay */}
          {flashOn && (
            <div className="absolute inset-0 bg-white/20 pointer-events-none transition-opacity" />
          )}
        </div>

        {/* Filter & Enhancement Controls */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-700 gap-1 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setFilterMode('contrast')}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors shrink-0 ${
                filterMode === 'contrast'
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              High Contrast
            </button>
            <button
              onClick={() => setFilterMode('normal')}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors shrink-0 ${
                filterMode === 'normal'
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Standard Color
            </button>
            <button
              onClick={() => setFilterMode('mono')}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors shrink-0 ${
                filterMode === 'mono'
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Monochrome B&amp;W
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setFlashOn(!flashOn)}
              className={`p-1.5 rounded-lg border transition-colors ${
                flashOn
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Toggle Flash"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="p-1.5 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors"
              title="Rotate 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-200">
          {capturedImage ? (
            <>
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-all"
              >
                <Check className="w-4 h-4" />
                Use Document
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                onClick={capturePhoto}
                className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 text-white shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                <div className="w-13 h-13 rounded-full border-2 border-white/80 group-hover:bg-slate-800 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
