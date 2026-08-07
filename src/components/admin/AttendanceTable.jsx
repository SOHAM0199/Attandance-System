import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { StatusBadge } from '../common/StatusBadge';
import { exportAttendanceToExcel } from '../../utils/excelExporter';
import { AddEmployeeModal } from './AddEmployeeModal';
import { AddAttendanceModal } from './AddAttendanceModal';
import { ExcelImportModal } from './ExcelImportModal';
import { AdminResetPasswordModal } from './AdminResetPasswordModal';
import { Search, Download, UserPlus, CalendarPlus, FileSpreadsheet, Trash2, Image as ImageIcon, X, KeyRound } from 'lucide-react';

export function AttendanceTable() {
  const { attendanceLogs, employees, clearAllData } = useAttendance();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [gpsFilter, setGpsFilter] = useState('ALL');
  const [selectedSelfie, setSelectedSelfie] = useState(null);

  // Modals state
  const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);
  const [isAddAttModalOpen, setIsAddAttModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  // Reset password modal state
  const [resetTargetEmp, setResetTargetEmp] = useState(null);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);

  // Compute live GPS stats for Admin radar
  const insideGpsCount = attendanceLogs.filter(log => 
    log.locationStatus?.includes('Verified') || log.locationStatus?.includes('Inside')
  ).length;

  const outsideGpsCount = attendanceLogs.filter(log => 
    log.locationStatus && !(log.locationStatus.includes('Verified') || log.locationStatus.includes('Inside'))
  ).length;

  // Filter logs
  const filteredLogs = attendanceLogs.filter(log => {
    const matchesSearch = 
      log.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' || log.attendanceStatus === statusFilter;

    const isInside = log.locationStatus?.includes('Verified') || log.locationStatus?.includes('Inside');
    const matchesGps = 
      gpsFilter === 'ALL' || 
      (gpsFilter === 'INSIDE' && isInside) || 
      (gpsFilter === 'OUTSIDE' && !isInside);

    return matchesSearch && matchesStatus && matchesGps;
  });

  const handleExport = () => {
    exportAttendanceToExcel(filteredLogs, employees);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      {/* Table Header Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Attendance Master Directory</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Real-time tracking of employee check-in timestamps, GPS geofence verifications, and selfies.
          </p>
        </div>

        {/* Action Buttons: Add Employee, Import Excel, Add Attendance, Search, Export */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Add Employee Button */}
          <button className="btn btn-primary" onClick={() => setIsAddEmpModalOpen(true)}>
            <UserPlus size={16} /> Add Employee
          </button>

          {/* Import Excel Button */}
          <button className="btn btn-secondary" onClick={() => setIsExcelImportModalOpen(true)} style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }} title="Bulk import employees from Excel / CSV file">
            <FileSpreadsheet size={16} /> Import Excel
          </button>

          {/* Add Attendance Button */}
          <button className="btn btn-secondary" onClick={() => setIsAddAttModalOpen(true)}>
            <CalendarPlus size={16} /> Log Attendance
          </button>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="glass-input" 
              placeholder="Search Name/ID..." 
              style={{ paddingLeft: '2.2rem', padding: '0.5rem 0.75rem 0.5rem 2.2rem', fontSize: '0.85rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select 
            className="glass-input" 
            style={{ width: 'auto', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL" style={{ background: '#111827' }}>All Statuses</option>
            <option value="Present" style={{ background: '#111827' }}>Present</option>
            <option value="Late" style={{ background: '#111827' }}>Late</option>
            <option value="On Leave" style={{ background: '#111827' }}>On Leave</option>
            <option value="Absent" style={{ background: '#111827' }}>Absent</option>
          </select>

          {/* GPS Location Filter */}
          <select 
            className="glass-input" 
            style={{ width: 'auto', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            value={gpsFilter}
            onChange={(e) => setGpsFilter(e.target.value)}
          >
            <option value="ALL" style={{ background: '#111827' }}>All GPS Locations</option>
            <option value="INSIDE" style={{ background: '#111827' }}>🟢 Inside GPS Radius</option>
            <option value="OUTSIDE" style={{ background: '#111827' }}>🔴 Outside GPS Radius</option>
          </select>

          {/* Export to Excel */}
          <button className="btn btn-success" onClick={handleExport} title="Download Excel (.xlsx) Report">
            <Download size={16} /> Excel Export
          </button>

          {/* Clear Data Button */}
          <button className="btn btn-secondary" onClick={clearAllData} title="Clear All Records">
            <Trash2 size={16} color="#ef4444" />
          </button>
        </div>
      </div>

      {/* Admin GPS Geofence Compliance Radar Banner */}
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.85rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.35rem', borderRadius: '8px', color: 'var(--primary)' }}>
            <Search size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.92rem' }}>
              GPS Geofence Compliance Radar
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Direct Admin monitoring of employee GPS radius positions at check-in.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.4rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            🟢 <strong>Inside GPS Radius:</strong> {insideGpsCount} Employees
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.4rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            🔴 <strong>Outside GPS Radius:</strong> {outsideGpsCount} Employees
          </div>
        </div>
      </div>

      {/* Staff Directory & Admin Password Reset Control Bar */}
      {employees.length > 0 && (
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <KeyRound size={16} color="var(--primary)" /> Staff Directory & Admin Password Control ({employees.length})
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
              If a staff member forgets their password, Admin can reset it here.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {employees.map(emp => (
              <div 
                key={emp.id} 
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', padding: '0.35rem 0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.65rem' }}
              >
                <div style={{ fontSize: '0.82rem' }}>
                  <strong style={{ color: '#fff' }}>{emp.name}</strong> <span style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>({emp.id})</span>
                </div>
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  onClick={() => {
                    setResetTargetEmp(emp);
                    setIsResetPassModalOpen(true);
                  }}
                  title="Reset forgotten password for employee"
                >
                  <KeyRound size={13} /> Reset Pass
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabular Attendance Data */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee Name / ID</th>
              <th>Date</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Location Verification</th>
              <th>Selfie Verification</th>
              <th>Attendance Status</th>
              <th>Leave Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <tr key={log.id}>
                  {/* Name / Emp ID */}
                  <td>
                    <div style={{ fontWeight: '600', color: '#fff' }}>{log.employeeName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>{log.employeeId} • {log.department}</div>
                  </td>

                  {/* Date */}
                  <td style={{ fontFamily: 'monospace', fontWeight: '500' }}>
                    {log.date}
                  </td>

                  {/* Check-In */}
                  <td>
                    <div style={{ fontWeight: '600', color: '#fff' }}>{log.checkInTime}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.method}</div>
                  </td>

                  {/* Check-Out */}
                  <td>
                    <div style={{ fontWeight: '600', color: log.checkOutTime !== '--:--' ? '#fff' : 'var(--text-dim)' }}>
                      {log.checkOutTime}
                    </div>
                    {log.duration !== 'In Progress' && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.duration}</div>
                    )}
                  </td>

                  {/* Location Verification Status */}
                  <td>
                    <StatusBadge type="location" value={log.locationStatus} />
                  </td>

                  {/* Selfie Verification Status */}
                  <td>
                    {log.selfieCaptured ? (
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', gap: '0.35rem', borderColor: 'var(--info-border)', color: '#60a5fa' }}
                        onClick={() => setSelectedSelfie(log.selfieUrl)}
                      >
                        <ImageIcon size={13} /> View Selfie
                      </button>
                    ) : (
                      <StatusBadge type="selfie" value={false} />
                    )}
                  </td>

                  {/* Attendance Status */}
                  <td>
                    <StatusBadge type="attendance" value={log.attendanceStatus} />
                  </td>

                  {/* Leave Status */}
                  <td>
                    <StatusBadge type="leave" value={log.leaveStatus} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#fff', marginBottom: '0.4rem' }}>
                    No attendance records found
                  </div>
                  <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    Add employees manually or upload an Excel file to get started.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setIsAddEmpModalOpen(true)}>
                      <UserPlus size={15} /> Add Employee
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setIsExcelImportModalOpen(true)} style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}>
                      <FileSpreadsheet size={15} /> Import Excel
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Selfie Preview Modal */}
      {selectedSelfie && (
        <div className="modal-overlay" onClick={() => setSelectedSelfie(null)}>
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem' }}>Selfie Identity Verification Snapshot</h3>
              <button className="modal-close-btn" onClick={() => setSelectedSelfie(null)}><X size={20} /></button>
            </div>
            <img 
              src={selectedSelfie} 
              alt="Selfie Snapshot" 
              style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '14px', border: '1px solid var(--border-color)', marginTop: '0.5rem' }} 
            />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              Verified Front-Facing Selfie Snapshot with GPS Timestamp
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddEmployeeModal 
        isOpen={isAddEmpModalOpen} 
        onClose={() => setIsAddEmpModalOpen(false)}
        onOpenExcelImport={() => setIsExcelImportModalOpen(true)}
      />

      <AddAttendanceModal 
        isOpen={isAddAttModalOpen} 
        onClose={() => setIsAddAttModalOpen(false)} 
      />

      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
      />

      <AdminResetPasswordModal
        isOpen={isResetPassModalOpen}
        onClose={() => {
          setIsResetPassModalOpen(false);
          setResetTargetEmp(null);
        }}
        employee={resetTargetEmp}
      />
    </div>
  );
}
