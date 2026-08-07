import React, { useState, useEffect } from 'react';
import { UserPlus, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

export function AddEmployeeModal({ isOpen, onClose, onOpenExcelImport }) {
  const { addEmployee, employees } = useAttendance();

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [email, setEmail] = useState('');
  const [casualLeave, setCasualLeave] = useState(12);
  const [sickLeave, setSickLeave] = useState(8);
  const [earnedLeave, setEarnedLeave] = useState(15);
  const [initialPassword, setInitialPassword] = useState('Emp@101');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const nextId = `EMP-${101 + employees.length}`;
      setId(nextId);
      setName('');
      setRole('');
      setEmail('');
      setInitialPassword('Emp@101');
      setError('');
    }
  }, [isOpen, employees.length]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!id.trim() || !name.trim() || !role.trim()) {
      setError('Please fill in Employee ID, Name, and Role.');
      return;
    }

    if (employees.some(emp => emp.id.toLowerCase() === id.trim().toLowerCase())) {
      setError(`Employee ID "${id}" already exists. Please use a unique ID.`);
      return;
    }

    const defaultAvatars = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
    ];
    const avatar = defaultAvatars[employees.length % defaultAvatars.length];

    addEmployee({
      id: id.trim().toUpperCase(),
      name: name.trim(),
      role: role.trim(),
      department: department.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      password: initialPassword.trim() || 'Emp@101',
      isFirstLogin: true,
      avatar,
      leaveBalance: {
        casual: Number(casualLeave),
        sick: Number(sickLeave),
        earned: Number(earnedLeave)
      }
    });

    setName('');
    setRole('');
    setEmail('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.45rem', borderRadius: '10px', color: 'var(--primary)' }}>
              <UserPlus size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.1rem' }}>Register New Employee</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Add staff details and set leave quota allocations.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Form Container with flex architecture */}
        <form className="modal-form" onSubmit={handleSubmit}>
          {/* Scrollable Modal Body */}
          <div className="modal-body">
            {/* Quick Excel Import Shortcut Banner */}
            {onOpenExcelImport && (
              <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '0.6rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Need to register multiple employees?</span>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  style={{ fontSize: '0.78rem', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', gap: '0.35rem', padding: '0.3rem 0.65rem' }}
                  onClick={() => {
                    onClose();
                    onOpenExcelImport();
                  }}
                >
                  <FileSpreadsheet size={14} /> Import from Excel
                </button>
              </div>
            )}

            {error && (
              <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '0.55rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', color: '#f87171', marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="grid-2" style={{ marginBottom: '0.85rem' }}>
              {/* Employee ID */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: '500' }}>
                  Employee ID *
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. EMP-101"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: '500' }}>
                  Department
                </label>
                <select
                  className="glass-input"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}
                >
                  <option value="Engineering" style={{ background: '#111827' }}>Engineering</option>
                  <option value="Design" style={{ background: '#111827' }}>Design</option>
                  <option value="Human Resources" style={{ background: '#111827' }}>Human Resources</option>
                  <option value="Sales & Marketing" style={{ background: '#111827' }}>Sales & Marketing</option>
                  <option value="Operations" style={{ background: '#111827' }}>Operations</option>
                  <option value="Finance" style={{ background: '#111827' }}>Finance</option>
                </select>
              </div>
            </div>

            {/* Full Name */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: '500' }}>
                Full Name *
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}
                required
              />
            </div>

            {/* Job Role & Initial Password */}
            <div className="grid-2" style={{ marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: '500' }}>
                  Role / Position *
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. Senior Developer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: '500' }}>
                  Initial Login Password *
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Initial Password"
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem', fontFamily: 'monospace' }}
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: '500' }}>
                Email Address
              </label>
              <input
                type="email"
                className="glass-input"
                placeholder="john.doe@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}
              />
            </div>

            {/* Leave Quota Card */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Initial Leave Quota Balances (Days)
              </span>
              <div className="grid-3">
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Casual Leave</label>
                  <input
                    type="number"
                    className="glass-input"
                    value={casualLeave}
                    onChange={(e) => setCasualLeave(e.target.value)}
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sick Leave</label>
                  <input
                    type="number"
                    className="glass-input"
                    value={sickLeave}
                    onChange={(e) => setSickLeave(e.target.value)}
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Earned Leave</label>
                  <input
                    type="number"
                    className="glass-input"
                    value={earnedLeave}
                    onChange={(e) => setEarnedLeave(e.target.value)}
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer - Always Pinned Inside Dialog */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '0.55rem 1.35rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.35rem' }}>
              <UserPlus size={16} /> Register Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
