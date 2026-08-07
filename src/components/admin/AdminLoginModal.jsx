import React, { useState } from 'react';
import { Lock, ShieldCheck, UserCheck, KeyRound, AlertCircle, CheckCircle, Send, X, UserPlus } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

export function AdminLoginModal({ isOpen, onClose }) {
  const { 
    loginAdmin, 
    registerCreatorAdmin, 
    creatorAdmin, 
    requestAdminAccess, 
    employees, 
    currentUser 
  } = useAttendance();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'request'

  // Register Form State
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Access Request Form State
  const [selectedEmpId, setSelectedEmpId] = useState(currentUser?.id || employees[0]?.id || '');
  const [reason, setReason] = useState('');

  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  if (!isOpen) return null;

  // Handle Initial Creator Registration
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setFeedback({ type: '', msg: '' });

    if (!regEmail.trim() || !regPassword.trim()) {
      setFeedback({ type: 'error', msg: 'Please enter a valid Email Address and Password.' });
      return;
    }

    const result = registerCreatorAdmin({ email: regEmail, password: regPassword });
    if (result.success) {
      setFeedback({ type: 'success', msg: result.message });
      setTimeout(() => {
        onClose();
        setRegEmail('');
        setRegPassword('');
        setFeedback({ type: '', msg: '' });
      }, 750);
    } else {
      setFeedback({ type: 'error', msg: result.message });
    }
  };

  // Direct Admin Login (No OTP)
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setFeedback({ type: '', msg: '' });

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setFeedback({ type: 'error', msg: 'Please enter both Email Address and Password.' });
      return;
    }

    const result = loginAdmin({ email: loginEmail, password: loginPassword });
    if (result.success) {
      setFeedback({ type: 'success', msg: result.message });
      setTimeout(() => {
        onClose();
        setLoginEmail('');
        setLoginPassword('');
        setFeedback({ type: '', msg: '' });
      }, 500);
    } else {
      setFeedback({ type: 'error', msg: result.message });
    }
  };

  // Handle Access Request
  const handleRequestSubmit = (e) => {
    e.preventDefault();
    setFeedback({ type: '', msg: '' });

    if (!selectedEmpId) {
      setFeedback({ type: 'error', msg: 'Please select an employee profile to request access.' });
      return;
    }

    const result = requestAdminAccess(selectedEmpId, reason);
    if (result.success) {
      setFeedback({ type: 'success', msg: result.message });
      setReason('');
    } else {
      setFeedback({ type: 'error', msg: result.message });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.45rem', borderRadius: '12px', color: 'var(--primary)' }}>
              <Lock size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.1rem' }}>
                {!creatorAdmin ? 'Setup Creator Admin Account' : 'Admin Dashboard Authentication'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {!creatorAdmin 
                  ? 'Initial one-time Creator registration' 
                  : 'Log in with your Main Admin credentials'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Tab Switcher (Only if Creator already registered) */}
          {creatorAdmin && (
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
              <button
                type="button"
                className="btn"
                style={{
                  flex: 1,
                  fontSize: '0.85rem',
                  padding: '0.5rem',
                  background: activeTab === 'login' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'login' ? '#fff' : 'var(--text-muted)',
                  border: 'none'
                }}
                onClick={() => {
                  setActiveTab('login');
                  setFeedback({ type: '', msg: '' });
                }}
              >
                <KeyRound size={15} /> Main Admin Login
              </button>

              <button
                type="button"
                className="btn"
                style={{
                  flex: 1,
                  fontSize: '0.85rem',
                  padding: '0.5rem',
                  background: activeTab === 'request' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'request' ? '#fff' : 'var(--text-muted)',
                  border: 'none'
                }}
                onClick={() => {
                  setActiveTab('request');
                  setFeedback({ type: '', msg: '' });
                }}
              >
                <Send size={15} /> Request Access
              </button>
            </div>
          )}

          {/* Feedback Alert */}
          {feedback.msg && (
            <div style={{ 
              background: feedback.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)', 
              border: `1px solid ${feedback.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`, 
              padding: '0.75rem 0.9rem', 
              borderRadius: '10px', 
              fontSize: '0.82rem', 
              color: feedback.type === 'success' ? '#34d399' : '#f87171', 
              marginBottom: '1rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}>
              {feedback.type === 'success' ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
              {feedback.msg}
            </div>
          )}

          {/* MODE 1: Initial Creator Setup */}
          {!creatorAdmin && (
            <form onSubmit={handleRegisterSubmit} style={{ margin: 0 }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '0.85rem 1rem', borderRadius: '12px', fontSize: '0.82rem', color: '#c7d2fe', marginBottom: '1.25rem', lineHeight: '1.45' }}>
                <strong>One-Time Creator Setup:</strong> You are registering as the primary <strong>Main Creator Admin</strong>. Once registered, no other main admin account can ever be created, and your email will hold permanent authority.
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Creator Email Address *
                </label>
                <input
                  type="email"
                  className="glass-input"
                  placeholder="e.g. admin@company.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Create Admin Password *
                </label>
                <input
                  type="password"
                  className="glass-input"
                  placeholder="Enter strong password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <UserPlus size={16} /> Register Creator Account
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: Admin Direct Login */}
          {creatorAdmin && activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ margin: 0 }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Main Admin / Creator Email *
                </label>
                <input
                  type="email"
                  className="glass-input"
                  placeholder={creatorAdmin.email}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Admin Password *
                </label>
                <input
                  type="password"
                  className="glass-input"
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <ShieldCheck size={16} /> Login to Admin Dashboard
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: Request Access Form */}
          {creatorAdmin && activeTab === 'request' && (
            <form onSubmit={handleRequestSubmit} style={{ margin: 0 }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', padding: '0.75rem 0.85rem', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Main Creator Admin Email: <strong style={{ color: '#fff' }}>{creatorAdmin.email}</strong>. Submit your request below for access approval.
              </div>

              {/* Select Employee */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Select Employee Profile *
                </label>
                <select
                  className="glass-input"
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  required
                >
                  {employees.length > 0 ? (
                    employees.map(emp => (
                      <option key={emp.id} value={emp.id} style={{ background: '#111827' }}>
                        {emp.name} ({emp.id}) • {emp.department}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled style={{ background: '#111827' }}>
                      No Employees Registered. Please register employees first.
                    </option>
                  )}
                </select>
              </div>

              {/* Reason */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Reason for Admin Access Request
                </label>
                <textarea
                  className="glass-input"
                  rows={3}
                  placeholder="e.g. Requesting admin permissions to manage department schedules..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Submit Request */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={employees.length === 0}>
                  <Send size={16} /> Submit Access Request
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
