import React from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Users, UserCheck, Clock, CalendarX, AlertTriangle } from 'lucide-react';

export function DashboardOverview() {
  const { employees, attendanceLogs, leaves } = useAttendance();

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLogs = attendanceLogs.filter(l => l.date === todayStr);

  const totalStaff = employees.length;
  const presentToday = todayLogs.filter(l => l.attendanceStatus === 'Present').length;
  const lateToday = todayLogs.filter(l => l.attendanceStatus === 'Late').length;
  const onLeaveToday = todayLogs.filter(l => l.attendanceStatus === 'On Leave' || l.leaveStatus === 'Approved').length;
  const geofenceAlerts = todayLogs.filter(l => l.locationStatus?.includes('Out of Radius')).length;

  return (
    <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
      {/* Total Staff */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Employees</span>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.4rem', borderRadius: '10px', color: 'var(--primary)' }}>
            <Users size={20} />
          </div>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff' }}>{totalStaff}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Active staff roster</div>
      </div>

      {/* Present Today */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Present Today</span>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.4rem', borderRadius: '10px', color: '#10b981' }}>
            <UserCheck size={20} />
          </div>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#34d399' }}>{presentToday}</div>
        <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.2rem' }}>
          {totalStaff ? Math.round((presentToday / totalStaff) * 100) : 0}% Attendance Rate
        </div>
      </div>

      {/* Late Arrivals */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Late Arrivals</span>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.4rem', borderRadius: '10px', color: '#f59e0b' }}>
            <Clock size={20} />
          </div>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fbbf24' }}>{lateToday}</div>
        <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '0.2rem' }}>Check-in post 09:30 AM</div>
      </div>

      {/* Geofence Alerts / Selfie Fallbacks */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Geofence Fallbacks</span>
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.4rem', borderRadius: '10px', color: '#ef4444' }}>
            <AlertTriangle size={20} />
          </div>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f87171' }}>{geofenceAlerts}</div>
        <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.2rem' }}>Outside HQ radius today</div>
      </div>
    </div>
  );
}
