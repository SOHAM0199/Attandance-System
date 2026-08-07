import React, { useState, useEffect } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { verifyGeofence } from '../../utils/geofence';
import { StatusBadge } from '../common/StatusBadge';
import { 
  MapPin, 
  QrCode, 
  Camera, 
  CheckCircle2, 
  LogOut, 
  AlertTriangle, 
  Compass, 
  CalendarPlus,
  Clock,
  UserCheck,
  Lock
} from 'lucide-react';

export function CheckInCard({ onOpenQrModal, onOpenSelfieModal, onOpenLeaveModal, onOpenAdminLogin, onOpenEmployeeLogin }) {
  const { 
    currentUser, 
    userLocation, 
    fetchUserLocation, 
    geofenceConfig, 
    attendanceLogs, 
    checkIn, 
    checkOut,
    logoutEmployee 
  } = useAttendance();

  // Find today's log for current employee
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLog = currentUser ? attendanceLogs.find(l => l.employeeId === currentUser.id && l.date === todayStr) : null;

  const isCheckedIn = !!todayLog;
  const isCheckedOut = todayLog && todayLog.checkOutTime !== '--:--';

  // Compute live geofence status
  const geofenceResult = verifyGeofence(
    userLocation.lat,
    userLocation.lng,
    geofenceConfig.hqLat,
    geofenceConfig.hqLng,
    geofenceConfig.radiusMeters
  );

  useEffect(() => {
    if (!userLocation.fetched) {
      fetchUserLocation();
    }
  }, []);

  if (!currentUser) {
    return (
      <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', margin: '1rem 0' }}>
        <div style={{ background: 'rgba(99, 102, 241, 0.15)', width: '68px', height: '68px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: 'var(--primary)' }}>
          <UserCheck size={34} />
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Employee Portal Login Required</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: '1.5' }}>
          Please log in with your unique Employee ID & Password to view your dashboard, check in, and apply for leaves.
        </p>
        <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onOpenEmployeeLogin} style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}>
            <UserCheck size={18} /> Login to Employee Portal
          </button>
          <button className="btn btn-secondary" onClick={onOpenAdminLogin} style={{ padding: '0.85rem 1.5rem', fontSize: '0.9rem' }}>
            <Lock size={16} /> Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner & Profile Overview */}
      <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '180px', height: '180px', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* User Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              style={{ width: '70px', height: '70px', borderRadius: '20px', objectFit: 'cover', border: '2px solid var(--primary)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.4rem' }}>{currentUser.name}</h2>
                <span className="badge badge-info">{currentUser.id}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.1rem' }}>
                {currentUser.role} • <strong style={{ color: '#e5e7eb' }}>{currentUser.department}</strong>
              </p>
            </div>
          </div>

          {/* Quick Stats Pill & Actions */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Casual Leave</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>{currentUser.leaveBalance?.casual || 10} Days</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sick Leave</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#10b981' }}>{currentUser.leaveBalance?.sick || 7} Days</div>
            </div>
            <button className="btn btn-secondary" onClick={onOpenLeaveModal} style={{ height: '100%', alignSelf: 'center' }}>
              <CalendarPlus size={16} /> Apply Leave
            </button>
            <button className="btn btn-secondary" onClick={logoutEmployee} style={{ height: '100%', alignSelf: 'center', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', gap: '0.35rem' }} title="Logout of employee session">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Check-In Control Panel */}
      <div className="grid-2">
        {/* Left Column: Geofence Verification Status Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <MapPin color="var(--primary)" size={20} />
              <h3 style={{ fontSize: '1.1rem' }}>GPS Geofence Radar</h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={fetchUserLocation} disabled={userLocation.loading}>
              <Compass size={14} className={userLocation.loading ? 'spin' : ''} /> {userLocation.loading ? 'Locating...' : 'Refresh GPS'}
            </button>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '14px', padding: '1rem', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configured HQ Location:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>{geofenceConfig.officeName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current Distance from HQ:</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: geofenceResult.isWithin ? '#34d399' : '#f87171' }}>
                {geofenceResult.distanceMeters} meters
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Allowed Radius Threshold:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>{geofenceConfig.radiusMeters} meters</span>
            </div>
          </div>

          {/* Status Alert */}
          {geofenceResult.isWithin ? (
            <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', padding: '0.75rem 1rem', borderRadius: '12px', color: '#34d399', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={18} />
              <div>
                <strong>Location Verified!</strong> You are inside the authorized workplace perimeter.
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', padding: '0.75rem 1rem', borderRadius: '12px', color: '#fbbf24', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertTriangle size={20} />
              <div>
                <strong>Geofence Alert:</strong> You are outside HQ radius. Use <strong>Selfie Verification</strong> to check in.
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Attendance Action Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <UserCheck color="var(--primary)" size={20} />
              <h3 style={{ fontSize: '1.1rem' }}>Today's Check-In Portal</h3>
            </div>

            {isCheckedIn ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid var(--success-border)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
                  <StatusBadge type="attendance" value={todayLog.attendanceStatus} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Check-In Time:</span>
                  <strong style={{ color: '#fff', fontSize: '1rem' }}>{todayLog.checkInTime}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Verification Method:</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{todayLog.method}</span>
                </div>
                {todayLog.checkOutTime !== '--:--' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Check-Out Time:</span>
                    <strong style={{ color: '#fff', fontSize: '1rem' }}>{todayLog.checkOutTime}</strong>
                  </div>
                )}
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={onOpenSelfieModal} style={{ fontSize: '0.78rem' }}>
                    <Camera size={14} /> Open Selfie Verification Camera
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Select your preferred attendance method below to log today's check-in timestamp.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div>
            {!isCheckedIn ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button className="btn btn-primary" onClick={onOpenQrModal} style={{ padding: '0.85rem' }}>
                    <QrCode size={18} /> Scan Office QR
                  </button>
                  <button className="btn btn-secondary" onClick={onOpenSelfieModal} style={{ padding: '0.85rem' }}>
                    <Camera size={18} /> Selfie Check-In
                  </button>
                </div>
                
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  📍 GPS Geofence status is automatically verified & reported to the Admin Dashboard.
                </div>
              </div>
            ) : !isCheckedOut ? (
              <button 
                className="btn btn-danger" 
                style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}
                onClick={() => checkOut(todayLog.id)}
              >
                <LogOut size={18} /> Check-Out Now
              </button>
            ) : (
              <div style={{ textAlign: 'center', color: '#10b981', fontWeight: '700', padding: '0.75rem', background: 'var(--success-bg)', borderRadius: '12px' }}>
                ✅ Shift Completed for Today!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
