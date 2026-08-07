import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getStorageData, 
  saveStorageData, 
  DEFAULT_GEOFENCE_CONFIG, 
  INITIAL_EMPLOYEES, 
  INITIAL_ATTENDANCE_LOGS, 
  INITIAL_LEAVES 
} from '../utils/storage';
import { verifyGeofence } from '../utils/geofence';
import confetti from 'canvas-confetti';

const AttendanceContext = createContext();

export function AttendanceProvider({ children }) {
  // Load state from LocalStorage (defaults to empty arrays if clean)
  const [employees, setEmployees] = useState(() => getStorageData('ams_employees', INITIAL_EMPLOYEES));
  const [attendanceLogs, setAttendanceLogs] = useState(() => getStorageData('ams_logs', INITIAL_ATTENDANCE_LOGS));
  const [leaves, setLeaves] = useState(() => getStorageData('ams_leaves', INITIAL_LEAVES));
  const [geofenceConfig, setGeofenceConfig] = useState(() => getStorageData('ams_geofence', DEFAULT_GEOFENCE_CONFIG));
  
  // Active User & Active Role
  const [currentUser, setCurrentUser] = useState(() => employees[0] || null);
  const [activeRole, setActiveRole] = useState('employee'); // 'employee' | 'admin'

  // Admin Authentication & Access Control
  const [creatorAdmin, setCreatorAdmin] = useState(() => getStorageData('ams_creator_admin', null));
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => getStorageData('ams_admin_auth', false));
  const [adminAccessRequests, setAdminAccessRequests] = useState(() => getStorageData('ams_admin_requests', []));
  const [authorizedAdmins, setAuthorizedAdmins] = useState(() => getStorageData('ams_authorized_admins', []));

  // User live location state
  const [userLocation, setUserLocation] = useState({
    lat: DEFAULT_GEOFENCE_CONFIG.hqLat,
    lng: DEFAULT_GEOFENCE_CONFIG.hqLng,
    loading: false,
    error: null,
    fetched: false
  });

  // Sync state changes to localStorage
  useEffect(() => {
    saveStorageData('ams_employees', employees);
  }, [employees]);

  useEffect(() => {
    saveStorageData('ams_logs', attendanceLogs);
  }, [attendanceLogs]);

  useEffect(() => {
    saveStorageData('ams_leaves', leaves);
  }, [leaves]);

  useEffect(() => {
    saveStorageData('ams_geofence', geofenceConfig);
  }, [geofenceConfig]);

  useEffect(() => {
    saveStorageData('ams_creator_admin', creatorAdmin);
  }, [creatorAdmin]);

  useEffect(() => {
    saveStorageData('ams_admin_auth', isAdminAuthenticated);
  }, [isAdminAuthenticated]);

  useEffect(() => {
    saveStorageData('ams_admin_requests', adminAccessRequests);
  }, [adminAccessRequests]);

  useEffect(() => {
    saveStorageData('ams_authorized_admins', authorizedAdmins);
  }, [authorizedAdmins]);

  // Keep currentUser synced if employees list changes (do NOT auto-login)
  useEffect(() => {
    if (currentUser && !employees.some(e => e.id.toLowerCase() === currentUser.id.toLowerCase())) {
      setCurrentUser(null);
    }
  }, [employees, currentUser]);

  // Trigger real browser Geolocation API
  const fetchUserLocation = () => {
    setUserLocation(prev => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setUserLocation({
        lat: geofenceConfig.hqLat,
        lng: geofenceConfig.hqLng,
        loading: false,
        error: "Geolocation not supported by browser",
        fetched: true
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          loading: false,
          error: null,
          fetched: true
        });
      },
      (err) => {
        setUserLocation({
          lat: geofenceConfig.hqLat,
          lng: geofenceConfig.hqLng,
          loading: false,
          error: `Location permission denied. Defaulted to HQ coords.`,
          fetched: true
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Add Custom Original Employee
  const addEmployee = (newEmp) => {
    const empWithPassword = {
      password: 'Emp@101',
      isFirstLogin: true,
      ...newEmp
    };

    setEmployees(prev => [...prev, empWithPassword]);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
  };

  // Bulk Add Employees (e.g. from Excel import)
  const bulkAddEmployees = (newEmpList) => {
    if (!newEmpList || newEmpList.length === 0) return;

    setEmployees(prev => {
      const existingMap = new Set(prev.map(e => e.id.toLowerCase()));
      const uniqueNew = newEmpList.filter(e => !existingMap.has(e.id.toLowerCase())).map(e => ({
        password: e.password || 'Emp@101',
        isFirstLogin: true,
        ...e
      }));
      return [...prev, ...uniqueNew];
    });

    confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
  };

  // Employee Logout Handler
  const logoutEmployee = () => {
    setCurrentUser(null);
  };

  // Employee Login Verification
  const loginEmployee = ({ loginId, password }) => {
    const cleanId = (loginId || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const emp = employees.find(e => 
      e.id.toLowerCase() === cleanId || 
      (e.email && e.email.toLowerCase() === cleanId)
    );

    if (!emp) {
      return { success: false, message: `No employee account found for ID or Email "${loginId}".` };
    }

    const empPassword = emp.password || 'Emp@101';
    if (cleanPass !== empPassword) {
      return { success: false, message: 'Incorrect Password. If you forgot your password, please contact your Administrator to reset it.' };
    }

    setCurrentUser(emp);
    setActiveRole('employee');

    return { 
      success: true, 
      isFirstLogin: emp.isFirstLogin ?? true, 
      employee: emp,
      message: `Welcome, ${emp.name}!` 
    };
  };

  // Employee First-Time Password Change
  const changeEmployeePassword = ({ employeeId, newPassword }) => {
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long.' };
    }

    const cleanPass = newPassword.trim();
    let updatedEmp = null;

    setEmployees(prev => prev.map(emp => {
      if (emp.id.toLowerCase() === employeeId.toLowerCase()) {
        updatedEmp = {
          ...emp,
          password: cleanPass,
          isFirstLogin: false
        };
        return updatedEmp;
      }
      return emp;
    }));

    if (currentUser && currentUser.id.toLowerCase() === employeeId.toLowerCase() && updatedEmp) {
      setCurrentUser(updatedEmp);
    }

    return { success: true, message: 'Private password updated successfully! You will not be asked again.' };
  };

  // Admin Password Reset for Employee
  const adminResetEmployeePassword = ({ employeeId, newPassword }) => {
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, message: 'New password must be at least 4 characters long.' };
    }

    const cleanPass = newPassword.trim();
    setEmployees(prev => prev.map(emp => {
      if (emp.id.toLowerCase() === employeeId.toLowerCase()) {
        return {
          ...emp,
          password: cleanPass,
          isFirstLogin: true
        };
      }
      return emp;
    }));

    return { success: true, message: `Password reset successfully for Employee (${employeeId}).` };
  };

  // Delete Employee
  const deleteEmployee = (empId) => {
    setEmployees(prev => prev.filter(e => e.id !== empId));
  };

  // Add Manual Attendance Record
  const addManualAttendance = (record) => {
    const newLog = {
      id: `LOG-${Date.now()}`,
      ...record
    };
    setAttendanceLogs(prev => [newLog, ...prev]);
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
  };

  // Perform Check-In
  const checkIn = ({ method = 'GPS Location', selfieUrl = null, customCoords = null }) => {
    if (!currentUser) {
      alert("Please add an employee first!");
      return null;
    }

    const coordsToUse = customCoords || { lat: userLocation.lat, lng: userLocation.lng };
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Verify Geofence distance
    const geofenceResult = verifyGeofence(
      coordsToUse.lat,
      coordsToUse.lng,
      geofenceConfig.hqLat,
      geofenceConfig.hqLng,
      geofenceConfig.radiusMeters
    );

    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
    const attendanceStatus = isLate ? 'Late' : 'Present';

    const newLog = {
      id: `LOG-${Date.now()}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
      date: dateStr,
      checkInTime: timeStr,
      checkOutTime: '--:--',
      duration: 'In Progress',
      method: method,
      locationStatus: geofenceResult.statusText,
      distanceMeters: geofenceResult.distanceMeters,
      selfieCaptured: !!selfieUrl,
      selfieUrl: selfieUrl,
      attendanceStatus: attendanceStatus,
      leaveStatus: 'N/A'
    };

    setAttendanceLogs(prev => [newLog, ...prev]);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    return newLog;
  };

  // Perform Check-Out
  const checkOut = (logId) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setAttendanceLogs(prev => prev.map(log => {
      if (log.id === logId) {
        return {
          ...log,
          checkOutTime: timeStr,
          duration: 'Shift Completed'
        };
      }
      return log;
    }));
  };

  // Apply Leave
  const applyLeave = ({ leaveType, startDate, endDate, daysCount, reason }) => {
    if (!currentUser) return;

    const newLeave = {
      id: `LEV-${Date.now()}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
      leaveType,
      startDate,
      endDate,
      daysCount: Number(daysCount),
      reason,
      status: 'Pending',
      appliedOn: new Date().toISOString().slice(0, 10)
    };

    setLeaves(prev => [newLeave, ...prev]);
  };

  // Admin Approve / Reject Leave
  const updateLeaveStatus = (leaveId, newStatus) => {
    setLeaves(prev => prev.map(l => l.id === leaveId ? { ...l, status: newStatus } : l));

    const targetLeave = leaves.find(l => l.id === leaveId);
    if (targetLeave && newStatus === 'Approved') {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (targetLeave.startDate <= todayStr && targetLeave.endDate >= todayStr) {
        setAttendanceLogs(prev => [
          {
            id: `LOG-LEV-${Date.now()}`,
            employeeId: targetLeave.employeeId,
            employeeName: targetLeave.employeeName,
            department: targetLeave.department,
            date: todayStr,
            checkInTime: '--:--',
            checkOutTime: '--:--',
            duration: '--',
            method: 'Approved Leave',
            locationStatus: 'N/A',
            distanceMeters: 0,
            selfieCaptured: false,
            selfieUrl: null,
            attendanceStatus: 'On Leave',
            leaveStatus: 'Approved'
          },
          ...prev
        ]);
      }
    }
  };

  // Admin Update Geofence Config
  const updateGeofenceConfig = (newConfig) => {
    setGeofenceConfig(prev => ({ ...prev, ...newConfig }));
  };

  // Register Initial Creator Main Admin (One-Time Setup)
  const registerCreatorAdmin = ({ email, password }) => {
    if (creatorAdmin) {
      return { success: false, message: 'Creator Admin account has already been setup for this system.' };
    }

    if (!email || !password || !email.includes('@')) {
      return { success: false, message: 'Please provide a valid Email Address and Password.' };
    }

    const newCreator = {
      email: email.trim().toLowerCase(),
      password: password.trim(),
      registeredAt: new Date().toISOString().slice(0, 10)
    };

    setCreatorAdmin(newCreator);
    setIsAdminAuthenticated(true);
    setActiveRole('admin');
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
    return { success: true, message: `Creator Admin account registered! Welcome ${newCreator.email}.` };
  };

  // Admin Login Handler (Creator Email/Password or Approved Employee ID)
  const loginAdmin = ({ email, password, employeeId }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const cleanEmpId = (employeeId || '').trim().toLowerCase();

    // 1. Check Creator Admin Email & Password
    if (creatorAdmin && (cleanEmail || cleanPass)) {
      if (cleanEmail === creatorAdmin.email.toLowerCase() && cleanPass === creatorAdmin.password) {
        setIsAdminAuthenticated(true);
        setActiveRole('admin');
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 } });
        return { success: true, message: `Welcome back, Main Creator Admin (${creatorAdmin.email})!` };
      }
    }

    // 2. Check if Employee ID or Email is an approved Admin
    const targetIdOrEmail = cleanEmpId || cleanEmail;
    if (targetIdOrEmail) {
      const isApprovedEmp = authorizedAdmins.some(id => id.toLowerCase() === targetIdOrEmail) ||
        adminAccessRequests.some(r => (r.employeeId.toLowerCase() === targetIdOrEmail || r.employeeName.toLowerCase().includes(targetIdOrEmail)) && r.status === 'Approved');

      if (isApprovedEmp) {
        setIsAdminAuthenticated(true);
        setActiveRole('admin');
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 } });
        return { success: true, message: 'Admin access verified for authorized employee account.' };
      }
    }

    return { 
      success: false, 
      message: 'Invalid Email or Password. Only the registered Creator Admin or approved employees can access the Admin Dashboard.' 
    };
  };

  // Admin Logout Handler
  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setActiveRole('employee');
  };

  // Request Admin Access Handler
  const requestAdminAccess = (employeeId, reason = 'Requires administrative access') => {
    const targetEmp = employees.find(e => e.id.toLowerCase() === employeeId.trim().toLowerCase());
    if (!targetEmp) {
      return { success: false, message: 'Employee ID not found in system.' };
    }

    const existingReq = adminAccessRequests.find(r => r.employeeId.toLowerCase() === employeeId.trim().toLowerCase());
    if (existingReq) {
      if (existingReq.status === 'Approved') {
        return { success: false, message: 'This employee already has approved Admin access! Try logging in with your Employee ID.' };
      }
      if (existingReq.status === 'Pending') {
        return { success: false, message: 'An access request for this employee is already pending Main Admin approval.' };
      }
    }

    const newReq = {
      id: `REQ-${Date.now()}`,
      employeeId: targetEmp.id,
      employeeName: targetEmp.name,
      department: targetEmp.department,
      reason: reason.trim() || 'Access requested by employee',
      requestedOn: new Date().toISOString().slice(0, 10),
      status: 'Pending'
    };

    setAdminAccessRequests(prev => [newReq, ...prev]);
    return { success: true, message: 'Access request submitted successfully! Pending Main Admin review.' };
  };

  // Main Admin Approve / Reject Request
  const updateAdminAccessRequest = (requestId, newStatus) => {
    setAdminAccessRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        if (newStatus === 'Approved') {
          setAuthorizedAdmins(curr => Array.from(new Set([...curr, req.employeeId])));
        }
        return { ...req, status: newStatus };
      }
      return req;
    }));

    if (newStatus === 'Approved') {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    }
  };

  // Revoke Admin Access
  const revokeAdminAccess = (employeeId) => {
    setAuthorizedAdmins(prev => prev.filter(id => id.toLowerCase() !== employeeId.toLowerCase()));
    setAdminAccessRequests(prev => prev.map(req => req.employeeId.toLowerCase() === employeeId.toLowerCase() ? { ...req, status: 'Revoked' } : req));
  };

  // Clear all system data (Clean Reset)
  const clearAllData = () => {
    if (window.confirm("Are you sure you want to remove all attendance records and reset employee list?")) {
      setAttendanceLogs([]);
      setLeaves([]);
      setEmployees([]);
      setCurrentUser(null);
      setIsAdminAuthenticated(false);
      setAdminAccessRequests([]);
      setAuthorizedAdmins([]);
      localStorage.clear();
    }
  };

  const resetToSeedData = () => {
    setAttendanceLogs([]);
    setLeaves([]);
    setEmployees([]);
    setCurrentUser(null);
    setIsAdminAuthenticated(false);
    setAdminAccessRequests([]);
    setAuthorizedAdmins([]);
    localStorage.clear();
  };

  return (
    <AttendanceContext.Provider value={{
      employees,
      attendanceLogs,
      leaves,
      geofenceConfig,
      currentUser,
      setCurrentUser,
      activeRole,
      setActiveRole,
      isAdminAuthenticated,
      adminAccessRequests,
      authorizedAdmins,
      creatorAdmin,
      registerCreatorAdmin,
      loginAdmin,
      logoutAdmin,
      requestAdminAccess,
      updateAdminAccessRequest,
      revokeAdminAccess,
      userLocation,
      fetchUserLocation,
      addEmployee,
      bulkAddEmployees,
      loginEmployee,
      logoutEmployee,
      changeEmployeePassword,
      adminResetEmployeePassword,
      deleteEmployee,
      addManualAttendance,
      checkIn,
      checkOut,
      applyLeave,
      updateLeaveStatus,
      updateGeofenceConfig,
      clearAllData,
      resetToSeedData
    }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}
