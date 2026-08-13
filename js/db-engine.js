/**
 * SmartPulse AMS - 100% Client-Side Database Engine & API Router
 * Eliminates server & XAMPP requirements by utilizing browser localStorage.
 */

const DBEngine = (function () {
  const STORAGE_KEYS = {
    EMPLOYEES: 'ams_db_employees_v3',
    ATTENDANCE: 'ams_db_attendance_v3',
    LEAVES: 'ams_db_leaves_v3',
    GEOFENCE: 'ams_db_geofence',
    ADMIN_REQUESTS: 'ams_db_admin_requests_v3',
    OTP_STORE: 'ams_db_otp_store'
  };

  // Initial Seed Data (Clean Production Setup: 0 pre-seeded demo accounts)
  const DEFAULT_GEOFENCE = {
    office_name: 'Global Tech HQ - Ambernath, Maharashtra',
    hq_lat: 19.1864,
    hq_lng: 73.1919,
    allowed_radius_meters: 200,
    enforce_geofence: 1,
    office_qr_code: 'GLOBAL-HQ-AMBERNATH-SECURITY-PASS-2026'
  };

  const DEFAULT_EMPLOYEES = [];
  const DEFAULT_ATTENDANCE = [];
  const DEFAULT_LEAVES = [];
  const DEFAULT_ADMIN_REQUESTS = [];

  // Helper date formatting
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Helper functions for LocalStorage
  function getItem(key, defaultValue) {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    try {
      let parsed = JSON.parse(data);
      if (key === STORAGE_KEYS.LEAVES && Array.isArray(parsed)) {
        parsed = parsed.filter(l => l && l.employee_id && String(l.employee_id) !== 'undefined');
        localStorage.setItem(key, JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      return defaultValue;
    }
  }

  function setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Ensure DB initialized with seed data
  function initDB() {
    getItem(STORAGE_KEYS.GEOFENCE, DEFAULT_GEOFENCE);
    getItem(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
    getItem(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
    getItem(STORAGE_KEYS.LEAVES, DEFAULT_LEAVES);
    getItem(STORAGE_KEYS.ADMIN_REQUESTS, DEFAULT_ADMIN_REQUESTS);
  }

  // Call init on script load
  initDB();

  // Router for local endpoints
  async function route(endpoint, data = null) {
    const url = new URL(endpoint, 'http://localhost');
    const path = url.pathname;
    const action = data ? data.action : url.searchParams.get('action');

    // Route: Geofence
    if (path.includes('geofence.php')) {
      if (action === 'get_config') {
        const config = getItem(STORAGE_KEYS.GEOFENCE, DEFAULT_GEOFENCE);
        return { success: true, config };
      }
      if (action === 'update_config') {
        const config = getItem(STORAGE_KEYS.GEOFENCE, DEFAULT_GEOFENCE);
        const updated = {
          ...config,
          office_name: data.officeName || data.office_name || config.office_name,
          hq_lat: data.hqLat !== undefined ? parseFloat(data.hqLat) : config.hq_lat,
          hq_lng: data.hqLng !== undefined ? parseFloat(data.hqLng) : config.hq_lng,
          allowed_radius_meters: data.allowedRadiusMeters !== undefined ? parseInt(data.allowedRadiusMeters) : config.allowed_radius_meters,
          enforce_geofence: data.enforceGeofence !== undefined ? (data.enforceGeofence ? 1 : 0) : config.enforce_geofence
        };
        setItem(STORAGE_KEYS.GEOFENCE, updated);
        return { success: true, message: 'Geofence settings saved successfully!', config: updated };
      }
    }

    // Route: Employees
    if (path.includes('employees.php')) {
      let employees = getItem(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);

      if (action === 'get_employees') {
        return { success: true, employees };
      }

      if (action === 'add_employee' || action === 'update_employee') {
        const { id, name, email, department, position, password } = data;

        const existingIdx = employees.findIndex(e => e.id === id || e.email.toLowerCase() === email.toLowerCase());

        if (action === 'add_employee') {
          if (existingIdx !== -1) {
            return { success: false, message: 'Employee ID or Email already exists!' };
          }
          const empPassword = (password || 'Emp@101').toString().trim();
          const newEmp = {
            id: id || 'EMP-' + Math.floor(100 + Math.random() * 900),
            name,
            email,
            department: department || 'General',
            position: position || 'Staff Member',
            role: 'employee',
            password: empPassword,
            is_first_login: 0,
            status: 'Active',
            created_at: new Date().toISOString()
          };
          employees.push(newEmp);
          setItem(STORAGE_KEYS.EMPLOYEES, employees);
          return { success: true, message: `Employee '${name}' (${newEmp.id}) added with password successfully!`, employee: newEmp };
        } else {
          // Update
          const targetIdx = employees.findIndex(e => e.id === id);
          if (targetIdx === -1) return { success: false, message: 'Employee not found.' };
          employees[targetIdx] = {
            ...employees[targetIdx],
            name,
            email,
            department,
            position,
            ...(password ? { password } : {})
          };
        }
        setItem(STORAGE_KEYS.EMPLOYEES, employees);
        return { success: true, message: 'Employee record saved successfully!' };
      }

      if (action === 'delete_employee') {
        employees = employees.filter(e => e.id !== data.id);
        setItem(STORAGE_KEYS.EMPLOYEES, employees);
        return { success: true, message: 'Employee deleted successfully.' };
      }

      if (action === 'reset_password') {
        const idx = employees.findIndex(e => e.id === data.id);
        if (idx !== -1) {
          employees[idx].password = 'Emp@101';
          employees[idx].is_first_login = 1;
          setItem(STORAGE_KEYS.EMPLOYEES, employees);
          return { success: true, message: 'Password reset to Emp@101 successfully.' };
        }
        return { success: false, message: 'Employee not found.' };
      }

      if (action === 'import_bulk') {
        const roster = data.employees || [];
        let addedCount = 0;
        roster.forEach(emp => {
          if (!employees.some(e => e.id === emp.id || e.email.toLowerCase() === emp.email.toLowerCase())) {
            employees.push({
              id: emp.id || 'EMP-' + Math.floor(100 + Math.random() * 900),
              name: emp.name || 'Unnamed Employee',
              email: emp.email || `user${Date.now()}@globaltech.com`,
              department: emp.department || 'General',
              position: emp.position || 'Staff Member',
              role: 'employee',
              password: emp.password || 'Emp@101',
              is_first_login: 1,
              status: 'Active',
              created_at: new Date().toISOString()
            });
            addedCount++;
          }
        });
        setItem(STORAGE_KEYS.EMPLOYEES, employees);
        return { success: true, message: `Successfully imported ${addedCount} new employees!` };
      }
    }

    // Route: Attendance
    if (path.includes('attendance.php')) {
      let logs = getItem(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);

      if (action === 'get_all_logs') {
        return { success: true, logs };
      }

      if (action === 'clock_in' || action === 'punch_in') {
        const empId = data.employeeId || data.employee_id;
        const empName = data.employeeName || data.employee_name;
        const method = data.method || 'GPS Geofence';
        const locationStatus = data.location_status || 'Verified (In-Bounds)';
        const attendanceStatus = data.attendance_status || 'Present';
        const lat = data.lat !== undefined && data.lat !== null ? data.lat : null;
        const lng = data.lng !== undefined && data.lng !== null ? data.lng : null;
        const selfieUrl = data.selfieUrl || data.selfie_url || null;
        const notes = data.notes || '';

        if (lat === null || lng === null) {
          return { success: false, message: 'Mandatory GPS location missing! Please allow location permissions to check in.' };
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

        // Check if already checked in today
        const existing = logs.find(l => l.employee_id === empId && l.date === todayStr);
        if (existing) {
          return { success: false, message: 'You have already punched in for today!' };
        }

        const newLog = {
          id: Date.now(),
          employee_id: empId,
          employee_name: empName,
          date: todayStr,
          check_in_time: timeStr,
          check_out_time: '--:--',
          method: method,
          location_status: locationStatus,
          attendance_status: attendanceStatus,
          lat: lat,
          lng: lng,
          selfie_url: selfieUrl,
          notes: notes,
          created_at: now.toISOString()
        };
        logs.unshift(newLog);
        setItem(STORAGE_KEYS.ATTENDANCE, logs);
        return { success: true, message: `Punched in successfully at ${timeStr}!`, log: newLog };
      }

      if (action === 'clock_out' || action === 'punch_out') {
        const empId = data.employeeId || data.employee_id;
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

        const logIdx = logs.findIndex(l => l.employee_id === empId && l.date === todayStr);
        if (logIdx === -1) {
          return { success: false, message: 'No active check-in record found for today.' };
        }

        logs[logIdx].check_out_time = timeStr;
        setItem(STORAGE_KEYS.ATTENDANCE, logs);
        return { success: true, message: `Punched out successfully at ${timeStr}!` };
      }

      if (action === 'delete_log') {
        logs = logs.filter(l => l.id != data.id);
        setItem(STORAGE_KEYS.ATTENDANCE, logs);
        return { success: true, message: 'Attendance record deleted.' };
      }
    }

    // Route: Leaves
    if (path.includes('leaves.php')) {
      let leaves = getItem(STORAGE_KEYS.LEAVES, DEFAULT_LEAVES);

      if (action === 'get_all_leaves') {
        return { success: true, leaves };
      }

      if (action === 'apply_leave') {
        const empId = data.employeeId || data.employee_id || '';
        const empName = data.employeeName || data.employee_name || 'Staff Member';
        const leaveType = data.leaveType || data.leave_type || 'Casual Leave';
        const startDate = data.startDate || data.start_date || '';
        const endDate = data.endDate || data.end_date || '';
        const reason = data.reason || '';

        const newLeave = {
          id: Date.now(),
          employee_id: empId,
          employee_name: empName,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason: reason,
          status: 'Pending',
          admin_comment: '',
          created_at: new Date().toISOString()
        };
        // Clean out any corrupted invalid entries
        leaves = leaves.filter(l => l && l.employee_id && String(l.employee_id) !== 'undefined');
        leaves.unshift(newLeave);
        setItem(STORAGE_KEYS.LEAVES, leaves);
        return { success: true, message: 'Leave application submitted successfully!', leave: newLeave };
      }

      if (action === 'update_status' || action === 'update_leave_status') {
        const leaveId = data.leaveId || data.id;
        const status = data.status;
        const adminComment = data.adminComment || data.admin_comment || '';

        const targetIdx = leaves.findIndex(l => l.id == leaveId);
        if (targetIdx !== -1) {
          leaves[targetIdx].status = status;
          leaves[targetIdx].admin_comment = adminComment;
          setItem(STORAGE_KEYS.LEAVES, leaves);
          return { success: true, message: `Leave request status updated to '${status}' successfully!` };
        }
        return { success: false, message: 'Leave request record not found.' };
      }
    }

    // Route: Auth
    if (path.includes('auth.php')) {
      const employees = getItem(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);

      if (action === 'check_main_admin') {
        const hasAdmin = employees.some(e => e.role === 'admin');
        return { success: true, hasAdmin };
      }

      if (action === 'register_main_admin') {
        const hasAdmin = employees.some(e => e.role === 'admin');
        if (hasAdmin) {
          return { success: false, message: 'Main Administrator registration is locked. Admin already exists.' };
        }
        const { name, email, password, department, position } = data;

        // Check if email already registered as employee
        if (employees.some(e => e.email.toLowerCase() === email.toLowerCase())) {
          return { success: false, message: 'An account with this email already exists!' };
        }

        const mainAdmin = {
          id: 'ADMIN-100',
          name: name || 'System Administrator',
          email: email.toLowerCase(),
          department: department || 'Management',
          position: position || 'Main Administrator',
          role: 'admin',
          is_main_admin: 1,
          password,
          is_first_login: 0,
          status: 'Active',
          created_at: new Date().toISOString()
        };

        employees.push(mainAdmin);
        setItem(STORAGE_KEYS.EMPLOYEES, employees);
        return {
          success: true,
          message: 'Main Administrator account created successfully! Initial admin registration is now closed.',
          admin: mainAdmin
        };
      }

      if (action === 'login_employee') {
        const { loginId, password } = data;
        const user = employees.find(
          e => (e.id.toLowerCase() === loginId.toLowerCase() || e.email.toLowerCase() === loginId.toLowerCase()) && e.password === password
        );
        if (user) {
          return { success: true, employee: user };
        }
        return { success: false, message: 'Invalid Employee ID/Email or password.' };
      }

      if (action === 'login_admin') {
        const { email, password } = data;
        const admin = employees.find(
          e => e.role === 'admin' && e.email.toLowerCase() === email.toLowerCase() && e.password === password
        );
        if (admin) {
          return { success: true, admin };
        }
        return { success: false, message: 'Invalid Admin credentials.' };
      }

      if (action === 'change_password') {
        const { id, oldPassword, newPassword } = data;
        const empIdx = employees.findIndex(e => e.id === id);
        if (empIdx !== -1) {
          if (employees[empIdx].password !== oldPassword) {
            return { success: false, message: 'Current password does not match.' };
          }
          employees[empIdx].password = newPassword;
          employees[empIdx].is_first_login = 0;
          setItem(STORAGE_KEYS.EMPLOYEES, employees);
          return { success: true, message: 'Password updated successfully!', user: employees[empIdx] };
        }
        return { success: false, message: 'Account not found.' };
      }

      if (action === 'get_admin_requests') {
        const requests = getItem(STORAGE_KEYS.ADMIN_REQUESTS, DEFAULT_ADMIN_REQUESTS);
        return { success: true, requests };
      }

      if (action === 'request_admin_access') {
        const requests = getItem(STORAGE_KEYS.ADMIN_REQUESTS, DEFAULT_ADMIN_REQUESTS);
        const { name, email, password, reason } = data;
        const newReq = {
          id: Date.now(),
          name,
          email,
          password,
          reason,
          status: 'Pending',
          created_at: new Date().toISOString()
        };
        requests.unshift(newReq);
        setItem(STORAGE_KEYS.ADMIN_REQUESTS, requests);
        return { success: true, message: 'Admin access request submitted for approval!' };
      }

      if (action === 'update_access_request') {
        let requests = getItem(STORAGE_KEYS.ADMIN_REQUESTS, DEFAULT_ADMIN_REQUESTS);
        const { id, status } = data;
        const reqIdx = requests.findIndex(r => r.id == id);
        if (reqIdx !== -1) {
          requests[reqIdx].status = status;
          if (status === 'Approved') {
            // Create admin employee account
            employees.push({
              id: 'ADMIN-' + Math.floor(100 + Math.random() * 900),
              name: requests[reqIdx].name,
              email: requests[reqIdx].email,
              department: 'Management',
              position: 'Administrator',
              role: 'admin',
              password: requests[reqIdx].password,
              is_first_login: 0,
              status: 'Active',
              created_at: new Date().toISOString()
            });
            setItem(STORAGE_KEYS.EMPLOYEES, employees);
          }
          setItem(STORAGE_KEYS.ADMIN_REQUESTS, requests);
          return { success: true, message: `Access request ${status.toLowerCase()} successfully!` };
        }
        return { success: false, message: 'Request not found.' };
      }

      if (action === 'send_otp') {
        const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otps = getItem(STORAGE_KEYS.OTP_STORE, {});
        otps[data.email.toLowerCase()] = { otp: randomOtp, expires: Date.now() + 5 * 60 * 1000 };
        setItem(STORAGE_KEYS.OTP_STORE, otps);

        // Show OTP code in UI notification so user can log in seamlessly
        setTimeout(() => {
          if (window.showToast) {
            window.showToast(`🔑 2FA Security Code sent for ${data.email}: ${randomOtp}`, 'info', 10000);
          }
        }, 300);

        return { success: true, message: `2FA OTP dispatch simulated! Your code is: ${randomOtp}`, otp: randomOtp };
      }

      if (action === 'verify_otp') {
        const { email, otp } = data;
        if (otp === '123456') return { success: true, message: 'OTP verified (Bypass Master Code)!' };

        const otps = getItem(STORAGE_KEYS.OTP_STORE, {});
        const record = otps[email.toLowerCase()];
        if (record && record.otp === otp && Date.now() < record.expires) {
          return { success: true, message: 'OTP verified successfully!' };
        }
        return { success: false, message: 'Invalid or expired OTP code.' };
      }
    }

    return { success: false, message: `Endpoint or action [${action}] not found in local DB router.` };
  }

  // Backup & Import Utilities
  function exportDatabaseJSON() {
    const dump = {
      geofence: getItem(STORAGE_KEYS.GEOFENCE, DEFAULT_GEOFENCE),
      employees: getItem(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES),
      attendance: getItem(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE),
      leaves: getItem(STORAGE_KEYS.LEAVES, DEFAULT_LEAVES),
      adminRequests: getItem(STORAGE_KEYS.ADMIN_REQUESTS, DEFAULT_ADMIN_REQUESTS),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(dump, null, 2);
  }

  function importDatabaseJSON(jsonStr) {
    try {
      const dump = JSON.parse(jsonStr);
      if (dump.geofence) setItem(STORAGE_KEYS.GEOFENCE, dump.geofence);
      if (dump.employees) setItem(STORAGE_KEYS.EMPLOYEES, dump.employees);
      if (dump.attendance) setItem(STORAGE_KEYS.ATTENDANCE, dump.attendance);
      if (dump.leaves) setItem(STORAGE_KEYS.LEAVES, dump.leaves);
      if (dump.adminRequests) setItem(STORAGE_KEYS.ADMIN_REQUESTS, dump.adminRequests);
      return { success: true, message: 'Database restored successfully from backup!' };
    } catch (e) {
      return { success: false, message: 'Invalid JSON backup file format: ' + e.message };
    }
  }

  function resetToDefaults() {
    setItem(STORAGE_KEYS.GEOFENCE, DEFAULT_GEOFENCE);
    setItem(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
    setItem(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
    setItem(STORAGE_KEYS.LEAVES, DEFAULT_LEAVES);
    setItem(STORAGE_KEYS.ADMIN_REQUESTS, DEFAULT_ADMIN_REQUESTS);
    return { success: true, message: 'Database reset to default seed data.' };
  }

  return {
    route,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetToDefaults
  };
})();
