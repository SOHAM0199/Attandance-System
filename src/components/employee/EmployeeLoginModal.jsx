import React, { useState } from 'react';
import { UserCheck, Lock, X, AlertCircle, CheckCircle, LogIn, KeyRound } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { FirstTimePasswordModal } from './FirstTimePasswordModal';

export function EmployeeLoginModal({ isOpen, onClose }) {
  const { loginEmployee, employees } = useAttendance();

  const [loginId, setLoginId] = useState(employees[0]?.id || '');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // First time modal state
  const [firstTimeTarget, setFirstTimeTarget] = useState(null);
  const [isFirstTimeModalOpen, setIsFirstTimeModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback({ type: '', msg: '' });

    if (!loginId.trim() || !password.trim()) {
      setFeedback({ type: 'error', msg: 'Please enter both Employee ID and Password.' });
      return;
    }

    const result = loginEmployee({ loginId: loginId.trim(), password: password.trim() });
    if (result.success) {
      setFeedback({ type: 'success', msg: result.message });

      if (result.isFirstLogin) {
        // Trigger one-time first login password change
        setFirstTimeTarget(result.employee);
        setTimeout(() => {
          setIsFirstTimeModalOpen(true);
        }, 400);
      } else {
        setTimeout(() => {
          onClose();
          setPassword('');
          setFeedback({ type: '', msg: '' });
        }, 500);
      }
    } else {
      setFeedback({ type: 'error', msg: result.message });
    }
  };

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '460px' }}>
          {/* Header */}
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.45rem', borderRadius: '10px', color: 'var(--primary)' }}>
                <UserCheck size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.1rem' }}>Employee Portal Login</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Enter your unique Employee ID & Password to access your portal.
                </p>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
          </div>

          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="modal-body">
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

              {/* Employee ID */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '500' }}>
                  Employee Login ID or Email *
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. EMP-101"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '500' }}>
                  Password *
                </label>
                <input
                  type="password"
                  className="glass-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Forgot Password Security Notice */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={14} color="var(--primary)" />
                Forgot password? Contact your Administrator to reset your password.
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <LogIn size={16} /> Login to Portal
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* First-Time Password Modal */}
      <FirstTimePasswordModal
        isOpen={isFirstTimeModalOpen}
        onClose={() => {
          setIsFirstTimeModalOpen(false);
          onClose();
        }}
        employee={firstTimeTarget}
      />
    </>
  );
}
