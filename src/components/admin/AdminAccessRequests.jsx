import React from 'react';
import { ShieldCheck, UserCheck, Check, X, ShieldAlert, LogOut, Clock } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

export function AdminAccessRequests() {
  const { 
    creatorAdmin,
    adminAccessRequests, 
    updateAdminAccessRequest, 
    authorizedAdmins, 
    revokeAdminAccess, 
    logoutAdmin,
    employees 
  } = useAttendance();

  const pendingRequests = adminAccessRequests.filter(r => r.status === 'Pending');

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.4rem', borderRadius: '10px', color: '#10b981' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.1rem' }}>Admin Access & Role Permissions</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Main Creator Admin control panel for approving employee admin dashboard access requests.
            </p>
          </div>
        </div>

        <button 
          className="btn btn-secondary btn-sm" 
          onClick={logoutAdmin}
          style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', gap: '0.4rem' }}
        >
          <LogOut size={15} /> Logout Admin Session
        </button>
      </div>

      {/* Creator Admin Banner */}
      {creatorAdmin && (
        <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.84rem' }}>
            👑 <strong style={{ color: '#fff' }}>Primary Creator Admin:</strong> <span style={{ color: '#818cf8', fontWeight: '600' }}>{creatorAdmin.email}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Registered On: {creatorAdmin.registeredAt} • Single Main Admin Authority
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Left Column: Pending Access Requests */}
        <div>
          <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="var(--primary)" />
            Pending Admin Access Requests ({pendingRequests.length})
          </div>

          {pendingRequests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingRequests.map(req => (
                <div 
                  key={req.id} 
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.9rem', borderRadius: '12px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div>
                      <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{req.employeeName}</strong>
                      <span className="badge badge-info" style={{ marginLeft: '0.5rem', fontSize: '0.72rem' }}>{req.employeeId}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{req.requestedOn}</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Department: <strong style={{ color: '#e5e7eb' }}>{req.department}</strong> • Reason: "{req.reason}"
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
                      onClick={() => updateAdminAccessRequest(req.id, 'Rejected')}
                    >
                      <X size={14} /> Reject
                    </button>
                    <button 
                      className="btn btn-success btn-sm" 
                      style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                      onClick={() => updateAdminAccessRequest(req.id, 'Approved')}
                    >
                      <Check size={14} /> Approve Admin Access
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No pending access requests from employees.
            </div>
          )}
        </div>

        {/* Right Column: Authorized Admin Roster */}
        <div>
          <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={16} color="#10b981" />
            Approved Admin Authorized Staff ({authorizedAdmins.length})
          </div>

          {authorizedAdmins.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {authorizedAdmins.map(empId => {
                const emp = employees.find(e => e.id.toLowerCase() === empId.toLowerCase());
                return (
                  <div 
                    key={empId} 
                    style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem 0.9rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.88rem' }}>
                        {emp ? emp.name : `Employee (${empId})`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#34d399' }}>
                        {empId} • {emp ? emp.department : 'Admin Privileges Granted'}
                      </div>
                    </div>

                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.2rem 0.55rem' }}
                      onClick={() => revokeAdminAccess(empId)}
                      title="Revoke Admin Dashboard Access"
                    >
                      <ShieldAlert size={14} /> Revoke Access
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Only Main Admin (Passcode) currently has access. No secondary employees approved yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
