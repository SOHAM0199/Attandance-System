import React, { useState, useEffect } from 'react';
import { KeyRound, X, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

export function AdminResetPasswordModal({ isOpen, onClose, employee }) {
  const { adminResetEmployeePassword } = useAttendance();

  const [newPassword, setNewPassword] = useState('Emp@123');
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  useEffect(() => {
    if (isOpen && employee) {
      setNewPassword('Emp@123');
      setFeedback({ type: '', msg: '' });
    }
  }, [isOpen, employee]);

  if (!isOpen || !employee) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback({ type: '', msg: '' });

    if (!newPassword.trim()) {
      setFeedback({ type: 'error', msg: 'Please enter a valid new password.' });
      return;
    }

    const result = adminResetEmployeePassword({ 
      employeeId: employee.id, 
      newPassword: newPassword.trim() 
    });

    if (result.success) {
      setFeedback({ type: 'success', msg: result.message });
      setTimeout(() => {
        onClose();
        setFeedback({ type: '', msg: '' });
      }, 900);
    } else {
      setFeedback({ type: 'error', msg: result.message });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.45rem', borderRadius: '10px', color: '#ef4444' }}>
              <KeyRound size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.1rem' }}>Admin Password Reset</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Set new credentials for <strong>{employee.name}</strong> ({employee.id})
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '0.75rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem', color: '#fca5a5', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} />
              <div>
                Only Administrators can reset forgotten passwords. This will require the staff member to log in with this new password.
              </div>
            </div>

            {feedback.msg && (
              <div style={{ 
                background: feedback.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)', 
                border: `1px solid ${feedback.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`, 
                padding: '0.65rem 0.85rem', 
                borderRadius: '10px', 
                fontSize: '0.82rem', 
                color: feedback.type === 'success' ? '#34d399' : '#f87171', 
                marginBottom: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}>
                {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {feedback.msg}
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '500' }}>
                Enter New Password for {employee.name} *
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. Emp@123"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ fontFamily: 'monospace' }}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger">
              <KeyRound size={16} /> Set New Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
