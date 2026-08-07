import React from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { StatusBadge } from '../common/StatusBadge';
import { Check, X, Calendar, FileText } from 'lucide-react';

export function LeaveApprovalTable() {
  const { leaves, updateLeaveStatus } = useAttendance();

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <Calendar color="var(--primary)" size={22} />
        <div>
          <h3 style={{ fontSize: '1.15rem' }}>Leave Application Approvals</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Review employee time-off requests, balances, and grant approval or rejection.
          </p>
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Date Range</th>
              <th>Duration</th>
              <th>Reason</th>
              <th>Applied On</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length > 0 ? (
              leaves.map(item => (
                <tr key={item.id}>
                  {/* Employee */}
                  <td>
                    <div style={{ fontWeight: '600', color: '#fff' }}>{item.employeeName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.employeeId} • {item.department}</div>
                  </td>

                  {/* Leave Type */}
                  <td style={{ fontWeight: '500', color: 'var(--primary)' }}>
                    {item.leaveType}
                  </td>

                  {/* Date Range */}
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {item.startDate} to {item.endDate}
                  </td>

                  {/* Duration */}
                  <td style={{ fontWeight: '700', color: '#fff' }}>
                    {item.daysCount} Day(s)
                  </td>

                  {/* Reason */}
                  <td style={{ maxWidth: '240px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {item.reason}
                  </td>

                  {/* Applied On */}
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {item.appliedOn}
                  </td>

                  {/* Status */}
                  <td>
                    <StatusBadge type="leave" value={item.status} />
                  </td>

                  {/* Actions */}
                  <td>
                    {item.status === 'Pending' ? (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => updateLeaveStatus(item.id, 'Approved')}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => updateLeaveStatus(item.id, 'Rejected')}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Resolved</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No pending or historical leave applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
