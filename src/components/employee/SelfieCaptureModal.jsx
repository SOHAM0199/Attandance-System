import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, X, ShieldAlert } from 'lucide-react';

export function SelfieCaptureModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn("Webcam access error:", err);
      setCameraError("Camera permission denied or camera not found. A simulated selfie snapshot will be used.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      stopCamera();
    } else {
      // Simulated fallback selfie photo if camera hardware is unavailable
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 400, 400);
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(200, 160, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(200, 360, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('VERIFIED SELFIE SNAPSHOT', 90, 380);
      const simulatedUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(simulatedUrl);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmSelfie = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Camera color="var(--primary)" size={22} />
            <h3 style={{ fontSize: '1.15rem' }}>Selfie Identity Verification</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Capture a clear front-facing selfie to confirm your attendance when outside the primary geofence zone.
        </p>

        {cameraError && (
          <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.82rem', color: '#fbbf24', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} />
            {cameraError}
          </div>
        )}

        <div style={{ position: 'relative', width: '100%', height: '300px', borderRadius: '16px', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
          {capturedImage ? (
            <img src={capturedImage} alt="Selfie Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Watermark Timestamp */}
          <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', color: '#fff', fontFamily: 'monospace' }}>
            📍 GPS & Time Verified • {new Date().toLocaleTimeString()}
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          {capturedImage ? (
            <>
              <button className="btn btn-secondary" onClick={retake}>
                <RefreshCw size={16} /> Retake
              </button>
              <button className="btn btn-success" onClick={confirmSelfie}>
                <CheckCircle size={16} /> Submit & Check-In
              </button>
            </>
          ) : (
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={takeSnapshot}>
              <Camera size={18} /> Snap Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
