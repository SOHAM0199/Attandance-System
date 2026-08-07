import React, { useState } from 'react';
import { useAttendance } from './context/AttendanceContext';
import { Header } from './components/common/Header';

// Employee Components
import { CheckInCard } from './components/employee/CheckInCard';
import { QRScannerModal } from './components/employee/QRScannerModal';
import { SelfieCaptureModal } from './components/employee/SelfieCaptureModal';
import { LeaveApplicationModal } from './components/employee/LeaveApplicationModal';
import { EmployeeLoginModal } from './components/employee/EmployeeLoginModal';

// Admin Components
import { DashboardOverview } from './components/admin/DashboardOverview';
import { AttendanceTable } from './components/admin/AttendanceTable';
import { GeofenceSettings } from './components/admin/GeofenceSettings';
import { LeaveApprovalTable } from './components/admin/LeaveApprovalTable';
import { QrGeneratorModal } from './components/admin/QrGeneratorModal';

import { AddEmployeeModal } from './components/admin/AddEmployeeModal';
import { ExcelImportModal } from './components/admin/ExcelImportModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminAccessRequests } from './components/admin/AdminAccessRequests';

import { QrCode, FileSpreadsheet, Shield, User, Globe, Calendar, Lock } from 'lucide-react';

export default function App() {
  const { activeRole, currentUser, attendanceLogs, checkIn, isAdminAuthenticated } = useAttendance();

  // Modals state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isKioskQrModalOpen, setIsKioskQrModalOpen] = useState(false);
  const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isEmpLoginModalOpen, setIsEmpLoginModalOpen] = useState(false);

  const handleQrScanSuccess = (code) => {
    checkIn({ method: `QR Code (${code.slice(0, 12)})` });
    setIsQrModalOpen(false);
  };

  const handleSelfieCapture = (photoUrl) => {
    checkIn({ method: 'Selfie Identity Fallback', selfieUrl: photoUrl });
  };

  // Filter personal attendance logs for employee view safely
  const userLogs = currentUser ? attendanceLogs.filter(l => l.employeeId === currentUser.id) : [];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Navigation */}
      <Header 
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)} 
        onOpenEmployeeLogin={() => setIsEmpLoginModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="container" style={{ flex: 1 }}>
        {activeRole === 'employee' ? (
          <div>
            {/* Employee Check-in Card & Geofence Radar */}
            <CheckInCard 
              onOpenQrModal={() => setIsQrModalOpen(true)}
              onOpenSelfieModal={() => setIsSelfieModalOpen(true)}
              onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
              onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
              onOpenEmployeeLogin={() => setIsEmpLoginModalOpen(true)}
            />

            {/* Personal Attendance Records */}
            {currentUser && (
              <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.15rem' }}>My Personal Attendance History</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Logged-in as {currentUser.name} ({currentUser.id})</span>
                </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Method</th>
                      <th>Geofence Verification</th>
                      <th>Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userLogs.length > 0 ? (
                      userLogs.map(log => (
                        <tr key={log.id}>
                          <td style={{ fontFamily: 'monospace' }}>{log.date}</td>
                          <td style={{ fontWeight: '600', color: '#fff' }}>{log.checkInTime}</td>
                          <td>{log.checkOutTime}</td>
                          <td style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>{log.method}</td>
                          <td>{log.locationStatus}</td>
                          <td>{log.attendanceStatus}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No attendance records logged yet for this employee.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        ) : (
          <div>
            {/* If Admin Not Authenticated, show locked barrier */}
            {!isAdminAuthenticated ? (
              <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', margin: '2rem 0' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', width: '68px', height: '68px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#f87171' }}>
                  <Lock size={34} />
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Administrator Dashboard Locked</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                  Creator Admin Email & Password or an approved Admin account is required to view employee rosters, approve leave requests, and modify geofence boundaries.
                </p>
                <button className="btn btn-primary" onClick={() => setIsAdminLoginModalOpen(true)}>
                  <Lock size={16} /> Authenticate / Request Access
                </button>
              </div>
            ) : (
              <div>
                {/* Admin Header Title & Office Kiosk QR Trigger */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Administrator Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Manage attendance records, geofence radius boundaries, leave approvals, and kiosk QR codes.
                    </p>
                  </div>

                  <button className="btn btn-primary" onClick={() => setIsKioskQrModalOpen(true)}>
                    <QrCode size={18} /> Generate Office Kiosk QR
                  </button>
                </div>

                {/* Main Admin Access Request & Approval Panel */}
                <AdminAccessRequests />

                {/* Dashboard Overview Cards */}
                <DashboardOverview />

                {/* Attendance Master Directory Table */}
                <AttendanceTable />

                {/* Geofence Location Settings */}
                <GeofenceSettings />

                {/* Leave Approvals Table */}
                <LeaveApprovalTable />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <QRScannerModal 
        isOpen={isQrModalOpen} 
        onClose={() => setIsQrModalOpen(false)}
        onScanSuccess={handleQrScanSuccess}
      />

      <SelfieCaptureModal 
        isOpen={isSelfieModalOpen} 
        onClose={() => setIsSelfieModalOpen(false)}
        onCapture={handleSelfieCapture}
      />

      <LeaveApplicationModal 
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
      />

      <QrGeneratorModal 
        isOpen={isKioskQrModalOpen}
        onClose={() => setIsKioskQrModalOpen(false)}
      />

      <AddEmployeeModal 
        isOpen={isAddEmpModalOpen}
        onClose={() => setIsAddEmpModalOpen(false)}
        onOpenExcelImport={() => setIsExcelImportModalOpen(true)}
      />

      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
      />

      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
      />

      <EmployeeLoginModal
        isOpen={isEmpLoginModalOpen}
        onClose={() => setIsEmpLoginModalOpen(false)}
      />

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', background: 'rgba(11,15,25,0.9)' }}>
        SmartPulse Attendance Management System • Built with React, Vite & Geofencing APIs
      </footer>
    </div>
  );
}
