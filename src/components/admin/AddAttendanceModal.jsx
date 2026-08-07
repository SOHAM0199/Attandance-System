import React, { useState } from 'react';
import { CalendarPlus, X, AlertCircle } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

export function AddAttendanceModal({ isOpen, onClose }) {
  const { employees, addManualAttendance } = useAttendance();

  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkInTime, setCheckInTime] = useState('09:00 AM');
  const [checkOutTime, setCheckOutTime] = useState('05:30 PM');
  const [method, setMethod] = useState('Manual Admin Entry');
  const [locationStatus, setLocationStatus] = useState('Verified (HQ Desk)');
  const [attendanceStatus, setAttendanceStatus] = useState('Present');
  const [selfieCaptured, setSelfieCaptured] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const targetEmp = employees.find(emp => emp.id === employeeId);
    if (!targetEmp) {
      setError('Please select a valid employee.');
      return;
    }

    addManualAttendance({
      employeeId: targetEmp.id,
      employeeName: targetEmp.name,
      department: targetEmp.department,
      date,
      checkInTime,
      checkOutTime,
      duration: '8h 30m',
      method,
      locationStatus,
      distanceMeters: 25,
      selfieCaptured,
      selfieUrl: selfieCaptured ? targetEmp.avatar : null,
      attendanceStatus,
      leaveStatus: 'N/A'
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CalendarPlus color="var(--primary)" size={22} />
            <h3 style={{ fontSize: '1.15rem' }}>Add Manual Attendance Record</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', color: '#f87171', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Select Employee */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Select Employee *
            </label>
            <select
              className="glass-input"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id} style={{ background: '#111827' }}>
                  {emp.name} ({emp.id}) • {emp.department}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Check-In / Out */}
          <div className="grid-3" style={{ marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Date
              </label>
              <input
                type="date"
                className="glass-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Check-In Time
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="09:00 AM"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Check-Out Time
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="05:30 PM"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
            </div>
          </div>

          {/* Statuses */}
          <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Attendance Status
              </label>
              <select
                className="glass-input"
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e.target.value)}
              >
                <option value="Present" style={{ background: '#111827' }}>Present</option>
                <option value="Late" style={{ background: '#111827' }}>Late</option>
                <option value="On Leave" style={{ background: '#111827' }}>On Leave</option>
                <option value="Absent" style={{ background: '#111827' }}>Absent</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Location Status
              </label>
              <select
                className="glass-input"
                value={locationStatus}
                onChange={(e) => setLocationStatus(e.target.value)}
              >
                <option value="Verified (HQ Perimeter)" style={{ background: '#111827' }}>Verified (Inside HQ)</option>
                <option value="Out of Radius (450m)" style={{ background: '#111827' }}>Out of Radius</option>
                <option value="Unverified Location" style={{ background: '#111827' }}>Unverified Location</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <input
              type="checkbox"
              id="selfieCheck"
              checked={selfieCaptured}
              onChange={(e) => setSelfieCaptured(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
            />
            <label htmlFor="selfieCheck" style={{ fontSize: '0.9rem', color: '#fff', cursor: 'pointer' }}>
              Mark Selfie Verified (Attach Identity Snapshot)
            </label>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <CalendarPlus size={16} /> Save Attendance Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
