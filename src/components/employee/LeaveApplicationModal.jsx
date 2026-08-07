import React, { useState } from 'react';
import { Calendar, X, FileText, Send, AlertCircle } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

export function LeaveApplicationModal({ isOpen, onClose }) {
  const { applyLeave, currentUser } = useAttendance();

  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !currentUser) return null;

  // Calculate days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.max(0, end - start);
  const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (end < start) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a brief reason for your leave request.');
      return;
    }

    applyLeave({
      leaveType,
      startDate,
      endDate,
      daysCount,
      reason
    });

    alert("Leave application submitted successfully for Admin review!");
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar color="var(--primary)" size={22} />
            <h3 style={{ fontSize: '1.15rem' }}>Apply for Leave</h3>
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

          {/* Leave Type Select */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Leave Type
            </label>
            <select
              className="glass-input"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
            >
              <option value="Casual Leave" style={{ background: '#111827' }}>Casual Leave (Available: {currentUser.leaveBalance?.casual || 10} days)</option>
              <option value="Sick Leave" style={{ background: '#111827' }}>Sick Leave (Available: {currentUser.leaveBalance?.sick || 7} days)</option>
              <option value="Earned Leave" style={{ background: '#111827' }}>Earned Leave (Available: {currentUser.leaveBalance?.earned || 12} days)</option>
              <option value="Unpaid Leave" style={{ background: '#111827' }}>Unpaid / Loss of Pay</option>
            </select>
          </div>

          {/* Date Pickers */}
          <div className="grid-2" style={{ marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Start Date
              </label>
              <input
                type="date"
                className="glass-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                End Date
              </label>
              <input
                type="date"
                className="glass-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Duration Summary Pill */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.6rem 1rem', borderRadius: '10px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Leave Duration:</span>
            <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.95rem' }}>{daysCount} Day(s)</span>
          </div>

          {/* Reason Textarea */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Reason for Leave
            </label>
            <textarea
              className="glass-input"
              rows={3}
              placeholder="Provide context or description for manager approval..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Send size={16} /> Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
