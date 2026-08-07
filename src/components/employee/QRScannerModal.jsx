import React, { useEffect, useState } from 'react';
import { QrCode, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    let scanner = null;
    if (isOpen) {
      setScanResult(null);

      // Timeout to ensure DOM element '#qr-reader' is mounted
      const timer = setTimeout(() => {
        try {
          scanner = new Html5QrcodeScanner("qr-reader", {
            fps: 10,
            qrbox: { width: 220, height: 220 }
          }, false);

          scanner.render((decodedText) => {
            setScanResult(decodedText);
            scanner.clear();
            onScanSuccess(decodedText);
          }, (error) => {
            // Ignore scan attempt errors
          });
        } catch (e) {
          console.warn("QR Scanner initialization notice:", e);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          try { scanner.clear(); } catch(e){}
        }
      };
    }
  }, [isOpen]);

  const triggerSimulatedScan = () => {
    const mockCode = `HQ-ATTENDANCE-KIOSK-${Date.now()}`;
    setScanResult(mockCode);
    setTimeout(() => {
      onScanSuccess(mockCode);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <QrCode color="var(--primary)" size={22} />
            <h3 style={{ fontSize: '1.15rem' }}>Scan Office QR Code</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Point your device camera at the Attendance QR Kiosk located at your workplace desk or entrance.
        </p>

        {/* QR Scanner Container */}
        <div style={{ background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem', minHeight: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {scanResult ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <CheckCircle2 color="#10b981" size={48} style={{ margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#10b981' }}>QR Code Verified!</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontFamily: 'monospace' }}>{scanResult}</div>
            </div>
          ) : (
            <div id="qr-reader" style={{ width: '100%', maxWidth: '320px' }}></div>
          )}
        </div>

        {/* Fallback Simulation Button */}
        <div style={{ marginTop: '1.25rem' }}>
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.1)', borderColor: 'var(--primary-glow)', color: '#a5b4fc' }}
            onClick={triggerSimulatedScan}
          >
            <Sparkles size={16} /> Simulate Office Kiosk QR Scan
          </button>
        </div>
      </div>
    </div>
  );
}
