import React, { useState } from 'react';
import { KeyRound, Lock, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

export function FirstTimePasswordModal({ isOpen, onClose, employee }) {
  const { changeEmployeePassword } = useAttendance();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  if (!isOpen || !employee) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback({ type: '', msg: '' });

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setFeedback({ type: 'error', msg: 'Please fill in both password fields.' });
      return;
    }

    if (newPassword.trim().length < 4) {
      setFeedback({ type: 'error', msg: 'Password must be at least 4 characters long.' });
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setFeedback({ type: 'error', msg: 'Passwords do not match. Please verify.' });
      return;
    }

    const result = changeEmployeePassword({
      employeeId: employee.id,
      newPassword: newPassword.trim()
    });

    if (result.success) {
      setFeedback({ type: 'success', msg: result.message });
      setTimeout(() => {
        onClose();
        setNewPassword('');
        setConfirmPassword('');
        setFeedback({ type: '', msg: '' });
      }, 900);
    } else {
      setFeedback({ type: 'error', msg: result.message });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.45rem', borderRadius: '10px', color: 'var(--primary)' }}>
              <Lock size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.1rem' }}>First-Time Login Setup</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Set your private password for <strong>{employee.name}</strong> ({employee.id})
              </p>
            </div>
          </div>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '0.85rem 1rem', borderRadius: '12px', fontSize: '0.82rem', color: '#c7d2fe', marginBottom: '1.25rem', lineHeight: '1.45' }}>
              <strong>🔒 One-Time Security Setup:</strong> This is your first login. Please choose a new private password. Once updated, this setup will <strong>never ask again</strong>.
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

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '500' }}>
                New Private Password *
              </label>
              <input
                type="password"
                className="glass-input"
                placeholder="Choose a strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '500' }}>
                Confirm New Password *
              </label>
              <input
                type="password"
                className="glass-input"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <ShieldCheck size={16} /> Save Private Password & Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
