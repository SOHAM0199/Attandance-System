import React, { useState, useEffect } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { ShieldCheck, UserCheck, Clock, RefreshCw, LayoutDashboard, User, Lock, LogOut } from 'lucide-react';

export function Header({ onOpenAdminLogin, onOpenEmployeeLogin }) {
  const { 
    currentUser, 
    setCurrentUser, 
    employees, 
    activeRole, 
    setActiveRole, 
    isAdminAuthenticated,
    logoutAdmin,
    resetToSeedData 
  } = useAttendance();

  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAdminTabClick = () => {
    if (isAdminAuthenticated) {
      setActiveRole('admin');
    } else {
      if (onOpenAdminLogin) {
        onOpenAdminLogin();
      }
    }
  };

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Brand Logo */}
        <div className="logo-group">
          <div className="logo-icon">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="logo-text">SmartPulse</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              Geofenced Attendance System
            </div>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="role-switch-container">
          <button
            className={`role-tab ${activeRole === 'employee' ? 'active' : ''}`}
            onClick={() => setActiveRole('employee')}
          >
            <User size={16} />
            Employee Portal
          </button>
          <button
            className={`role-tab ${activeRole === 'admin' ? 'active' : ''}`}
            onClick={handleAdminTabClick}
            title={!isAdminAuthenticated ? "Login required to access Admin Dashboard" : "Admin Dashboard Active"}
          >
            {isAdminAuthenticated ? <LayoutDashboard size={16} /> : <Lock size={15} color="#fbbf24" />}
            Admin Dashboard
          </button>
        </div>

        {/* Right Section: Time Ticker & Active Employee Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Clock Ticker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.4rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <Clock size={16} color="var(--primary)" />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', fontFamily: 'monospace' }}>{timeStr}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{dateStr}</div>
            </div>
          </div>

          {/* Employee Login Button */}
          {activeRole === 'employee' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={onOpenEmployeeLogin}
                style={{ fontSize: '0.78rem', color: '#c7d2fe', borderColor: 'rgba(99, 102, 241, 0.4)', gap: '0.35rem' }}
              >
                <UserCheck size={14} /> {currentUser ? `Employee Login (${currentUser.id})` : 'Employee Login'}
              </button>
            </div>
          )}

          {/* Admin Logout Button */}
          {isAdminAuthenticated && (
            <button 
              className="btn btn-secondary btn-sm" 
              style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', gap: '0.35rem', fontSize: '0.78rem' }}
              onClick={logoutAdmin}
              title="Logout Admin Session"
            >
              <LogOut size={14} /> Logout Admin
            </button>
          )}

          {/* Reset Demo Data Button */}
          <button 
            className="btn btn-secondary btn-sm" 
            title="Reset to default seed data"
            onClick={resetToSeedData}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
