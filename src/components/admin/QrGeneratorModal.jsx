import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAttendance } from '../../context/AttendanceContext';
import { QrCode, X, Download, Printer } from 'lucide-react';

export function QrGeneratorModal({ isOpen, onClose }) {
  const { geofenceConfig } = useAttendance();

  if (!isOpen) return null;

  const qrPayload = JSON.stringify({
    system: "SmartPulse-AMS",
    office: geofenceConfig.officeName,
    lat: geofenceConfig.hqLat,
    lng: geofenceConfig.hqLng,
    timestamp: new Date().toISOString()
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px', textAlign: 'center' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <QrCode color="var(--primary)" size={22} />
            <h3 style={{ fontSize: '1.15rem' }}>Office Attendance Kiosk QR</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Display or print this QR code at office entry points for employee attendance scanning.
        </p>

        {/* QR Display Card */}
        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '20px', display: 'inline-block', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', marginBottom: '1rem' }}>
          <QRCodeSVG 
            value={qrPayload} 
            size={200}
            level="H"
            includeMargin={true}
          />
          <div style={{ color: '#0f172a', fontWeight: '800', fontSize: '0.95rem', marginTop: '0.5rem', fontFamily: 'sans-serif' }}>
            {geofenceConfig.officeName}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.72rem', fontFamily: 'monospace' }}>
            OFFICE ATTENDANCE KIOSK • HQ SCAN
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Print Kiosk Poster
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
