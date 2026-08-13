/**
 * SmartPulse AMS - Core Frontend Application Controller (Pure JS)
 */

// Application State
let appState = {
  activeRole: 'employee',
  currentUser: null,
  isAdminAuthenticated: false,
  adminData: null,
  geofenceConfig: {
    office_name: 'Global Tech HQ - Ambernath, Maharashtra',
    hq_lat: 19.1864,
    hq_lng: 73.1919,
    allowed_radius_meters: 200,
    enforce_geofence: 1,
    office_qr_code: 'GLOBAL-HQ-AMBERNATH-SECURITY-PASS-2026'
  },
  userLocation: { lat: null, lng: null, loading: true, error: null, fetched: false, granted: false },
  employees: [],
  attendanceLogs: [],
  leaves: [],
  adminRequests: [],
  pendingAdminEmail: ''
};

// Global Stream Handles
let selfieStream = null;
let html5QrScanner = null;

// Initialize App on DOM Load
document.addEventListener('DOMContentLoaded', async () => {
  initLiveClock();
  restoreSavedSession();
  await loadInitialData();
  fetchLiveUserLocation();

  // Prompt Login Modal immediately if not authenticated
  promptInitialAuthentication();
});

function promptInitialAuthentication() {
  const hasAdmin = checkAdminStatus();

  if (!hasAdmin) {
    switchRole('admin');
    openAdminLoginModal();
    return;
  }

  if (appState.activeRole === 'employee' && !appState.currentUser) {
    openLoginModal();
  } else if (appState.activeRole === 'admin' && !appState.isAdminAuthenticated) {
    openAdminLoginModal();
  }
}

// Helper for API Calls (Prioritizes Central Server PHP/SQLite API; falls back to client DBEngine if offline)
async function apiFetch(endpoint, data = null) {
  try {
    const options = {
      method: data ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);
    const response = await fetch(endpoint, options);
    if (response.ok) {
      const json = await response.json();
      if (json && typeof json === 'object') return json;
    }
  } catch (err) {
    // Network or server fetch error (e.g. offline file:// protocol) - proceed to DBEngine fallback
  }

  if (typeof DBEngine !== 'undefined') {
    return await DBEngine.route(endpoint, data);
  }

  return { success: false, message: 'Connection error to central database server.' };
}

// Load Initial Data from PHP SQLite APIs
async function loadInitialData() {
  // Geofence Config
  const geoRes = await apiFetch('api/geofence.php?action=get_config');
  if (geoRes.success && geoRes.config) {
    appState.geofenceConfig = geoRes.config;
    updateGeofenceUI();
  }

  // Employees List
  const empRes = await apiFetch('api/employees.php?action=get_employees');
  if (empRes.success) {
    appState.employees = empRes.employees || [];
  }

  // Attendance Logs
  const attRes = await apiFetch('api/attendance.php?action=get_all_logs');
  if (attRes.success) {
    appState.attendanceLogs = attRes.logs || [];
  }

  // Leaves List
  const leaveRes = await apiFetch('api/leaves.php?action=get_all_leaves');
  if (leaveRes.success) {
    appState.leaves = leaveRes.leaves || [];
  }

  // Admin Access Requests
  const reqRes = await apiFetch('api/auth.php?action=get_admin_requests');
  if (reqRes.success) {
    appState.adminRequests = reqRes.requests || [];
  }

  refreshUI();
}

// Restore saved session from LocalStorage
function restoreSavedSession() {
  const savedUser = localStorage.getItem('ams_user');
  if (savedUser) {
    try {
      appState.currentUser = JSON.parse(savedUser);
    } catch (e) { appState.currentUser = null; }
  }

  const savedAdminAuth = localStorage.getItem('ams_admin_auth');
  if (savedAdminAuth === 'true') {
    appState.isAdminAuthenticated = true;
    const savedAdminData = localStorage.getItem('ams_admin_data');
    if (savedAdminData) {
      try { appState.adminData = JSON.parse(savedAdminData); } catch (e) { }
    }
  }
}

// Save session
function saveSession() {
  if (appState.currentUser) {
    localStorage.setItem('ams_user', JSON.stringify(appState.currentUser));
  } else {
    localStorage.removeItem('ams_user');
  }
  localStorage.setItem('ams_admin_auth', appState.isAdminAuthenticated ? 'true' : 'false');
  if (appState.adminData) {
    localStorage.setItem('ams_admin_data', JSON.stringify(appState.adminData));
  } else {
    localStorage.removeItem('ams_admin_data');
  }
}

// Refresh UI Components
function refreshUI() {
  checkAdminStatus();
  renderEmployeeDashboard();
  updateUserHeaderStatus();
  renderUserAttendanceHistory();
  renderUserLeaveApplications();
  renderAdminDashboard();
}

function renderEmployeeDashboard() {
  const lockBarrier = document.getElementById('employee-lock-barrier');
  const dashboardContent = document.getElementById('employee-dashboard-content');
  if (!lockBarrier || !dashboardContent) return;

  if (!appState.currentUser) {
    lockBarrier.style.display = 'block';
    dashboardContent.style.display = 'none';
  } else {
    lockBarrier.style.display = 'none';
    dashboardContent.style.display = 'block';
  }
}

// Live Clock & Date Handler
function initLiveClock() {
  function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const timeElem = document.getElementById('live-time-display');
    const dateElem = document.getElementById('live-date-display');
    if (timeElem) timeElem.textContent = timeStr;
    if (dateElem) dateElem.textContent = dateStr;
  }
  updateClock();
  setInterval(updateClock, 1000);
}

// Role Switcher
function switchRole(role) {
  appState.activeRole = role;
  document.getElementById('btn-role-employee').classList.toggle('active', role === 'employee');
  document.getElementById('btn-role-admin').classList.toggle('active', role === 'admin');

  document.getElementById('employee-view').style.display = (role === 'employee') ? 'block' : 'none';
  document.getElementById('admin-view').style.display = (role === 'admin') ? 'block' : 'none';

  updateUserHeaderStatus();

  if (role === 'admin') {
    renderAdminDashboard();
    if (!appState.isAdminAuthenticated) {
      openAdminLoginModal();
    }
  } else if (role === 'employee') {
    renderEmployeeDashboard();
    if (!appState.currentUser) {
      openLoginModal();
    }
  }
}

// Update Header User Status
function updateUserHeaderStatus() {
  const nameElem = document.getElementById('header-username');
  const actionBtn = document.getElementById('btn-auth-action');
  const cardName = document.getElementById('emp-card-name');
  const cardMeta = document.getElementById('emp-card-meta');

  if (appState.activeRole === 'admin') {
    if (appState.isAdminAuthenticated) {
      if (nameElem) nameElem.textContent = appState.adminData ? appState.adminData.name : 'Administrator';
      if (actionBtn) {
        actionBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Admin Logout';
        actionBtn.onclick = handleAdminLogout;
      }
    } else {
      if (nameElem) nameElem.textContent = 'Admin Locked';
      if (actionBtn) {
        actionBtn.innerHTML = '<i class="fa-solid fa-key"></i> Admin Login';
        actionBtn.onclick = openAdminLoginModal;
      }
    }
  } else {
    // Employee Role
    if (appState.currentUser) {
      if (nameElem) nameElem.textContent = appState.currentUser.name;
      if (actionBtn) {
        actionBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Logout';
        actionBtn.onclick = handleLogout;
      }
      if (cardName) cardName.textContent = `${appState.currentUser.name} (${appState.currentUser.id})`;
      if (cardMeta) cardMeta.textContent = `${appState.currentUser.department || 'Employee'} • ${appState.currentUser.position || 'Staff'}`;
    } else {
      if (nameElem) nameElem.textContent = 'Not Logged In';
      if (actionBtn) {
        actionBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
        actionBtn.onclick = openLoginModal;
      }
      if (cardName) cardName.textContent = 'Guest User';
      if (cardMeta) cardMeta.textContent = 'Please log in to register attendance records';
    }
  }

  // Update Punch In/Out button state based on today's logs
  updatePunchButtonState();
}

// Check if user has active check-in today
function updatePunchButtonState() {
  const punchInBtn = document.getElementById('btn-punch-in');
  const punchOutBtn = document.getElementById('btn-punch-out');
  if (!punchInBtn || !punchOutBtn) return;

  if (!appState.currentUser) {
    punchInBtn.style.display = 'inline-flex';
    punchOutBtn.style.display = 'none';
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const userLogs = appState.attendanceLogs.filter(l =>
    l.employee_id.toLowerCase() === appState.currentUser.id.toLowerCase() && l.date === todayStr
  );

  const activeLog = userLogs.find(l => l.check_out_time === '--:--');

  if (activeLog) {
    punchInBtn.style.display = 'none';
    punchOutBtn.style.display = 'inline-flex';
  } else {
    punchInBtn.style.display = 'inline-flex';
    punchOutBtn.style.display = 'none';
  }
}

// Geolocation Radar Check
function fetchLiveUserLocation(forceRetry = false) {
  const radarElem = document.getElementById('geofence-radar-status');
  if (!radarElem) return;

  if (!navigator.geolocation) {
    appState.userLocation = { lat: null, lng: null, loading: false, error: 'Browser not supported', fetched: true, granted: false };
    radarElem.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: #f87171;"></i> Geolocation API not supported by browser';
    return;
  }

  appState.userLocation.loading = true;
  radarElem.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Locating HQ Geofence Coordinates...';

  let hasResponded = false;

  function onSuccess(pos) {
    if (hasResponded) return;
    hasResponded = true;

    appState.userLocation = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      loading: false,
      error: null,
      fetched: true,
      granted: true
    };

    const distance = calculateHaversineDistance(
      appState.geofenceConfig.hq_lat,
      appState.geofenceConfig.hq_lng,
      pos.coords.latitude,
      pos.coords.longitude
    );

    const isInside = distance <= appState.geofenceConfig.allowed_radius_meters;
    const statusText = isInside ? 'GPS Verified In-Bounds' : 'Flagged Out-of-Bounds';
    const color = isInside ? '#34d399' : '#f87171';
    
    let adminCalibrateBtn = '';
    if (!isInside && appState.isAdminAuthenticated) {
      adminCalibrateBtn = `<button class="btn btn-secondary btn-sm" onclick="quickSetHQToCurrentLocation()" style="margin-left: 0.5rem; padding: 0.15rem 0.5rem; font-size: 0.75rem;"><i class="fa-solid fa-location-crosshairs"></i> Set as HQ</button>`;
    }

    radarElem.innerHTML = `<i class="fa-solid fa-location-dot" style="color: ${color};"></i> ${statusText} (${Math.round(distance)}m from ${appState.geofenceConfig.office_name || 'HQ'})${adminCalibrateBtn}`;
  }

  function onError(err) {
    if (hasResponded) return;

    // Fallback attempt with low accuracy if high accuracy timed out or failed
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (finalErr) => {
        if (hasResponded) return;
        hasResponded = true;

        appState.userLocation = {
          lat: null,
          lng: null,
          loading: false,
          error: finalErr.message || 'Location access denied',
          fetched: true,
          granted: false
        };

        radarElem.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; flex-wrap: wrap;">
            <span style="color: #f87171; font-weight: 600;">
              <i class="fa-solid fa-location-crosshairs-slash"></i> Mandatory GPS Access Denied
            </span>
            <button class="btn btn-primary btn-sm" onclick="fetchLiveUserLocation(true)" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">
              <i class="fa-solid fa-location-arrow"></i> Allow Location Access
            </button>
          </div>
        `;
        if (forceRetry) {
          showToast('Location Permission Required: Click "Allow" in your browser prompt (top-left near address bar) or site settings.', 'warning', 7000);
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 });
}

function checkMandatoryLocationAccess() {
  if (appState.userLocation.granted && appState.userLocation.lat !== null && appState.userLocation.lng !== null) {
    return true;
  }

  if (appState.userLocation.loading) {
    showToast('Locating your GPS coordinates... Please wait a moment.', 'info', 3000);
    fetchLiveUserLocation(true);
    return false;
  }

  showToast('Mandatory Location Access Required: Please allow location permissions in your browser to check in.', 'error', 5000);
  fetchLiveUserLocation(true);
  return false;
}

// Haversine Distance Helper
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = sin(dLat / 2) * sin(dLat / 2) +
    cos(lat1 * Math.PI / 180) * cos(lat2 * Math.PI / 180) *
    sin(dLon / 2) * sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function sin(x) { return Math.sin(x); }
function cos(x) { return Math.cos(x); }

// Render Employee Attendance Records
function renderUserAttendanceHistory() {
  const tbody = document.getElementById('user-attendance-tbody');
  const countBadge = document.getElementById('emp-log-count');
  if (!tbody) return;

  if (!appState.currentUser) {
    tbody.innerHTML = `
      <tr>
        <td colSpan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Please log in to view your personal attendance history.
        </td>
      </tr>
    `;
    if (countBadge) countBadge.textContent = '0 Records';
    return;
  }

  const userLogs = appState.attendanceLogs.filter(l => l.employee_id.toLowerCase() === appState.currentUser.id.toLowerCase());
  if (countBadge) countBadge.textContent = `${userLogs.length} Records`;

  if (userLogs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colSpan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No attendance records registered yet. Use the Punch In button above!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = userLogs.map(log => {
    const selfieUrl = log.selfie_url || log.selfieUrl || '';
    const selfieHtml = selfieUrl ? `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <img src="${selfieUrl}" class="selfie-thumb" onclick="openSelfieViewModal('${log.id}')" title="Click to view selfie photo" alt="Selfie" />
        <button class="btn btn-secondary btn-sm" onclick="openSelfieViewModal('${log.id}')" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">
          <i class="fa-solid fa-camera"></i> View
        </button>
      </div>
    ` : `<span style="color: var(--text-dim); font-size: 0.8rem;"><i class="fa-solid fa-camera-slash" style="opacity: 0.5;"></i> No Photo</span>`;

    return `
      <tr>
        <td style="font-family: monospace; font-weight: 600;">${log.date}</td>
        <td style="color: #fff; font-weight: 600;">${log.check_in_time}</td>
        <td>${log.check_out_time}</td>
        <td style="color: var(--primary); font-weight: 500;">${log.method}</td>
        <td>${selfieHtml}</td>
        <td><span class="badge ${log.location_status.includes('In-Bounds') ? 'badge-success' : 'badge-warning'}">${log.location_status}</span></td>
        <td><span class="badge ${log.attendance_status === 'Present' ? 'badge-success' : 'badge-danger'}">${log.attendance_status}</span></td>
      </tr>
    `;
  }).join('');
}

// Render Employee Leave Applications & Sanctioned Status
function renderUserLeaveApplications() {
  const tbody = document.getElementById('user-leaves-tbody');
  const bannerElem = document.getElementById('emp-sanctioned-leave-banner');

  if (!appState.currentUser) {
    if (tbody) tbody.innerHTML = `<tr><td colSpan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Please log in to view your leave applications.</td></tr>`;
    if (bannerElem) bannerElem.style.display = 'none';
    return;
  }

  const userLeaves = (appState.leaves || []).filter(l => 
    l && l.employee_id && l.employee_id.toLowerCase() === appState.currentUser.id.toLowerCase()
  );

  const sanctionedLeaves = userLeaves.filter(l => l.status === 'Approved');

  if (bannerElem) {
    if (sanctionedLeaves.length > 0) {
      const latestApproved = sanctionedLeaves[0];
      bannerElem.style.display = 'block';
      bannerElem.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.05)); border: 1px solid rgba(52, 211, 153, 0.4); border-radius: var(--radius-lg); padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: #34d399; display: flex; align-items: center; justify-content: center; color: #0f172a; font-size: 1.4rem; font-weight: bold;">
              <i class="fa-solid fa-circle-check"></i>
            </div>
            <div>
              <div style="font-weight: 700; color: #34d399; font-size: 1.05rem;">
                🎉 Holiday / Leave Sanctioned by HR!
              </div>
              <div style="color: var(--text-main); font-size: 0.9rem; margin-top: 0.2rem;">
                Your <strong>${latestApproved.leave_type}</strong> from <span style="font-family: monospace; color: #34d399; font-weight: 600;">${latestApproved.start_date}</span> to <span style="font-family: monospace; color: #34d399; font-weight: 600;">${latestApproved.end_date}</span> has been officially <strong>APPROVED & SANCTIONED</strong>.
              </div>
            </div>
          </div>
          <span class="badge badge-success" style="padding: 0.5rem 1rem; font-size: 0.85rem;"><i class="fa-solid fa-shield-check"></i> Sanctioned</span>
        </div>
      `;
    } else {
      bannerElem.style.display = 'none';
    }
  }

  if (!tbody) return;

  if (userLeaves.length === 0) {
    tbody.innerHTML = `<tr><td colSpan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">You have not applied for any leave requests yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = userLeaves.map(l => {
    let statusBadge = `<span class="badge badge-warning"><i class="fa-solid fa-hourglass-half"></i> Pending HR Review</span>`;
    if (l.status === 'Approved') {
      statusBadge = `<span class="badge badge-success" style="box-shadow: 0 0 10px rgba(52, 211, 153, 0.3);"><i class="fa-solid fa-circle-check"></i> Sanctioned & Approved</span>`;
    } else if (l.status === 'Rejected') {
      statusBadge = `<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Rejected</span>`;
    }

    return `
      <tr>
        <td style="color: var(--primary); font-weight: 600;">${l.leave_type}</td>
        <td style="font-family: monospace; font-weight: 500;">${l.start_date} to ${l.end_date}</td>
        <td style="font-size: 0.85rem; max-width: 250px;">${l.reason || 'N/A'}</td>
        <td>${statusBadge}</td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${l.created_at ? l.created_at.split('T')[0] : 'Recently'}</td>
      </tr>
    `;
  }).join('');
}

// Employee Punch In Handler
async function handlePunchInAction(extraParams = {}) {
  if (!appState.currentUser) {
    showToast('Please log in first to punch in.', 'error');
    openLoginModal();
    return;
  }

  if (!checkMandatoryLocationAccess()) {
    return;
  }

  const isSelfie = Boolean(extraParams.selfieUrl && extraParams.selfieUrl.length > 0);
  const isQr = Boolean(extraParams.method && (extraParams.method.includes('QR Code') || extraParams.method.includes('QR Scan')));

  if (!isSelfie && !isQr) {
    showToast('Mandatory Verification: Check-in requires Selfie Identity or QR Scan verification.', 'warning');
    openMandatoryVerificationModal();
    return;
  }

  const payload = {
    action: 'punch_in',
    employeeId: appState.currentUser.id,
    employeeName: appState.currentUser.name,
    method: extraParams.method || (isSelfie ? 'Selfie Verified Punch' : 'QR Code Pass Scan'),
    lat: appState.userLocation.lat,
    lng: appState.userLocation.lng,
    selfieUrl: extraParams.selfieUrl || ''
  };

  const res = await apiFetch('api/attendance.php', payload);
  if (res.success) {
    showToast(res.message, 'success');
    if (typeof confetti === 'function') {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    }
    loadInitialData();
  } else {
    showToast(res.message, 'error');
  }
}

// Employee Punch Out Handler
async function handlePunchOutAction() {
  if (!appState.currentUser) return;
  const res = await apiFetch('api/attendance.php', {
    action: 'punch_out',
    employeeId: appState.currentUser.id
  });
  if (res.success) {
    showToast(res.message, 'success');
    loadInitialData();
  } else {
    showToast(res.message, 'error');
  }
}

// Employee Login Submit Handler
async function handleEmployeeLoginSubmit(e) {
  e.preventDefault();
  const loginId = document.getElementById('login-emp-id').value.trim();
  const password = document.getElementById('login-emp-pass').value.trim();

  const res = await apiFetch('api/auth.php', { action: 'login_employee', loginId, password });

  if (res.success) {
    closeModal('modal-emp-login');
    appState.currentUser = res.employee;
    saveSession();
    refreshUI();

    if (res.isFirstLogin) {
      openModal('modal-first-login');
    } else {
      showToast(res.message, 'success');
    }
  } else {
    showToast(res.message, 'error');
  }
}

// First Time Password Change Submit
async function handleFirstPasswordSubmit(e) {
  e.preventDefault();
  const newPassword = document.getElementById('first-new-pass').value;

  const res = await apiFetch('api/auth.php', {
    action: 'change_password',
    employeeId: appState.currentUser.id,
    newPassword
  });

  if (res.success) {
    closeModal('modal-first-login');
    showToast(res.message, 'success');
    appState.currentUser.is_first_login = 0;
    saveSession();
    refreshUI();
  } else {
    showToast(res.message, 'error');
  }
}

// Logout Handlers (Decoupled & Independent Sessions)
function handleLogout() {
  appState.currentUser = null;
  saveSession();
  refreshUI();
  showToast('Employee session logged out.', 'info');
  if (appState.activeRole === 'employee') {
    openLoginModal();
  }
}

function handleAdminLogout() {
  appState.isAdminAuthenticated = false;
  appState.adminData = null;
  saveSession();
  refreshUI();
  showToast('Administrator session locked and logged out.', 'info');
  if (appState.activeRole === 'admin') {
    openAdminLoginModal();
  }
}

// Apply Leave Submit
async function handleLeaveSubmit(e) {
  e.preventDefault();
  if (!appState.currentUser) {
    showToast('Please log in to submit a leave request.', 'error');
    openLoginModal();
    return;
  }

  const payload = {
    action: 'apply_leave',
    employeeId: appState.currentUser.id,
    employeeName: appState.currentUser.name,
    leaveType: document.getElementById('leave-type').value,
    startDate: document.getElementById('leave-start-date').value,
    endDate: document.getElementById('leave-end-date').value,
    reason: document.getElementById('leave-reason').value
  };

  const res = await apiFetch('api/leaves.php', payload);
  if (res.success) {
    closeModal('modal-leave');
    showToast(res.message, 'success');
    loadInitialData();
  } else {
    showToast(res.message, 'error');
  }
}

// Render Admin Dashboard Tables & Stat Cards
function renderAdminDashboard() {
  const lockBarrier = document.getElementById('admin-lock-barrier');
  const dashboardContent = document.getElementById('admin-dashboard-content');
  if (!lockBarrier || !dashboardContent) return;

  checkAdminStatus();

  if (!appState.isAdminAuthenticated) {
    lockBarrier.style.display = 'block';
    dashboardContent.style.display = 'none';
    return;
  }

  lockBarrier.style.display = 'none';
  dashboardContent.style.display = 'block';

  // Render Stats
  document.getElementById('stat-total-emp').textContent = appState.employees.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const presentToday = appState.attendanceLogs.filter(l => l.date === todayStr && l.attendance_status === 'Present').length;
  document.getElementById('stat-present-today').textContent = presentToday;
  const pendingLeaves = appState.leaves.filter(l => l.status === 'Pending').length;
  document.getElementById('stat-pending-leaves').textContent = pendingLeaves;
  document.getElementById('stat-geofence-radius').textContent = `${appState.geofenceConfig.allowed_radius_meters}m`;

  // Render Master Attendance Table
  renderMasterAttendanceTable(appState.attendanceLogs);

  // Render Employee Directory
  renderEmployeeDirectoryTable();

  // Render Leave Approvals
  renderLeaveApprovalsTable();

  // Render Admin Access Requests
  renderAdminAccessRequestsTable();
}

function renderMasterAttendanceTable(logs) {
  const tbody = document.getElementById('admin-attendance-tbody');
  if (!tbody) return;

  if (!logs || logs.length === 0) {
    tbody.innerHTML = `<tr><td colSpan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">No attendance logs registered in database yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(log => {
    const selfieUrl = log.selfie_url || log.selfieUrl || '';
    const selfieHtml = selfieUrl ? `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <img src="${selfieUrl}" class="selfie-thumb" onclick="openSelfieViewModal('${log.id}')" title="Click to view selfie photo" alt="Selfie" />
        <button class="btn btn-secondary btn-sm" onclick="openSelfieViewModal('${log.id}')" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">
          <i class="fa-solid fa-camera"></i> View
        </button>
      </div>
    ` : `<span style="color: var(--text-dim); font-size: 0.8rem;"><i class="fa-solid fa-camera-slash" style="opacity: 0.5;"></i> No Photo</span>`;

    return `
      <tr>
        <td style="font-weight: 600; color: #fff;">${log.employee_name} <span style="font-size: 0.75rem; color: var(--text-muted);">(${log.employee_id})</span></td>
        <td style="font-family: monospace;">${log.date}</td>
        <td style="color: #34d399; font-weight: 600;">${log.check_in_time}</td>
        <td>${log.check_out_time}</td>
        <td style="color: var(--primary); font-size: 0.85rem;">${log.method}</td>
        <td>${selfieHtml}</td>
        <td><span class="badge ${log.location_status.includes('In-Bounds') ? 'badge-success' : 'badge-warning'}">${log.location_status}</span></td>
        <td><span class="badge ${log.attendance_status === 'Present' ? 'badge-success' : 'badge-danger'}">${log.attendance_status}</span></td>
      </tr>
    `;
  }).join('');
}

// Selfie Lightbox Viewer for Admin & User
function openSelfieViewModal(logId) {
  const log = appState.attendanceLogs.find(l => String(l.id) === String(logId));
  if (!log) {
    showToast('Attendance log record not found.', 'error');
    return;
  }

  const selfieUrl = log.selfie_url || log.selfieUrl;
  if (!selfieUrl) {
    showToast('No selfie photo associated with this attendance record.', 'warning');
    return;
  }

  const imgElem = document.getElementById('view-selfie-img');
  const metaElem = document.getElementById('view-selfie-meta');

  if (imgElem) {
    imgElem.src = selfieUrl;
  }

  if (metaElem) {
    metaElem.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.6rem;">
        <div>
          <h4 style="font-size: 1.1rem; color: #fff; margin-bottom: 0.15rem;">${log.employee_name}</h4>
          <span style="font-family: monospace; font-size: 0.8rem; color: var(--primary); font-weight: 600;">ID: ${log.employee_id}</span>
        </div>
        <span class="badge ${log.attendance_status === 'Present' ? 'badge-success' : 'badge-danger'}">${log.attendance_status}</span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.85rem; color: var(--text-main);">
        <div><i class="fa-solid fa-calendar-day" style="color: var(--primary); margin-right: 0.35rem;"></i> <strong>Date:</strong> ${log.date}</div>
        <div><i class="fa-solid fa-clock" style="color: #34d399; margin-right: 0.35rem;"></i> <strong>Check-In:</strong> ${log.check_in_time}</div>
        <div><i class="fa-solid fa-right-from-bracket" style="color: var(--warning); margin-right: 0.35rem;"></i> <strong>Check-Out:</strong> ${log.check_out_time || '--:--'}</div>
        <div><i class="fa-solid fa-fingerprint" style="color: var(--secondary); margin-right: 0.35rem;"></i> <strong>Method:</strong> ${log.method}</div>
      </div>
      ${log.location_status ? `
        <div style="margin-top: 0.75rem; font-size: 0.82rem; color: var(--text-muted); border-top: 1px dashed var(--border-color); padding-top: 0.6rem;">
          <i class="fa-solid fa-location-dot" style="color: var(--info); margin-right: 0.35rem;"></i> <strong>Location Verification:</strong> ${log.location_status}
        </div>
      ` : ''}
    `;
  }

  openModal('modal-view-selfie');
}

function filterMasterLogs() {
  const query = document.getElementById('attendance-search').value.toLowerCase();
  const filtered = appState.attendanceLogs.filter(l =>
    l.employee_name.toLowerCase().includes(query) || l.employee_id.toLowerCase().includes(query) || l.date.includes(query)
  );
  renderMasterAttendanceTable(filtered);
}

function renderEmployeeDirectoryTable() {
  const tbody = document.getElementById('admin-employees-tbody');
  const empCountBadge = document.getElementById('admin-emp-count');
  if (!tbody) return;

  if (empCountBadge) empCountBadge.textContent = `${appState.employees.length} Employees`;

  if (appState.employees.length === 0) {
    tbody.innerHTML = `<tr><td colSpan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">No employees registered yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = appState.employees.map(emp => `
    <tr>
      <td style="font-family: monospace; font-weight: 700; color: var(--primary);">${emp.id}</td>
      <td style="font-weight: 600; color: #fff;">${emp.name}</td>
      <td>${emp.email}</td>
      <td>${emp.department || 'General'}</td>
      <td>${emp.position || 'Staff'}</td>
      <td><span class="badge ${emp.is_first_login == 1 ? 'badge-warning' : 'badge-neutral'}">${emp.is_first_login == 1 ? 'Yes' : 'No'}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="handleResetEmployeePass('${emp.id}')" title="Reset Password"><i class="fa-solid fa-key" style="color: var(--warning);"></i></button>
        <button class="btn btn-secondary btn-sm" onclick="handleDeleteEmployee('${emp.id}')" title="Delete Employee"><i class="fa-solid fa-trash" style="color: #f87171;"></i></button>
      </td>
    </tr>
  `).join('');
}

function renderLeaveApprovalsTable() {
  const tbody = document.getElementById('admin-leaves-tbody');
  if (!tbody) return;

  const validLeaves = (appState.leaves || []).filter(l => 
    l && l.employee_id && String(l.employee_id) !== 'undefined' && l.employee_name && String(l.employee_name) !== 'undefined'
  );

  if (validLeaves.length === 0) {
    tbody.innerHTML = `<tr><td colSpan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No leave applications submitted.</td></tr>`;
    return;
  }

  tbody.innerHTML = validLeaves.map(l => `
    <tr>
      <td style="font-weight: 600; color: #fff;">${l.employee_name} <span style="font-size: 0.75rem; color: var(--text-muted);">(${l.employee_id})</span></td>
      <td style="color: var(--primary); font-weight: 500;">${l.leave_type}</td>
      <td style="font-family: monospace;">${l.start_date} to ${l.end_date}</td>
      <td style="max-width: 200px; font-size: 0.85rem;">${l.reason}</td>
      <td><span class="badge ${l.status === 'Approved' ? 'badge-success' : (l.status === 'Rejected' ? 'badge-danger' : 'badge-warning')}">${l.status}</span></td>
      <td>
        ${l.status === 'Pending' ? `
          <button class="btn btn-success btn-sm" onclick="handleUpdateLeaveStatus(${l.id}, 'Approved')"><i class="fa-solid fa-check"></i></button>
          <button class="btn btn-danger btn-sm" onclick="handleUpdateLeaveStatus(${l.id}, 'Rejected')"><i class="fa-solid fa-xmark"></i></button>
        ` : `<span style="font-size: 0.8rem; color: var(--text-muted);">${l.status}</span>`}
      </td>
    </tr>
  `).join('');
}

function renderAdminAccessRequestsTable() {
  const tbody = document.getElementById('admin-requests-tbody');
  if (!tbody) return;

  if (appState.adminRequests.length === 0) {
    tbody.innerHTML = `<tr><td colSpan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No pending administrator requests.</td></tr>`;
    return;
  }

  tbody.innerHTML = appState.adminRequests.map(req => `
    <tr>
      <td style="font-weight: 600; color: #fff;">${req.name}</td>
      <td>${req.email}</td>
      <td style="font-size: 0.85rem; max-width: 220px;">${req.reason || 'N/A'}</td>
      <td style="font-family: monospace; font-size: 0.8rem;">${req.created_at || 'Recently'}</td>
      <td><span class="badge ${req.status === 'Approved' ? 'badge-success' : (req.status === 'Rejected' ? 'badge-danger' : 'badge-warning')}">${req.status}</span></td>
      <td>
        ${req.status === 'Pending' ? `
          <button class="btn btn-success btn-sm" onclick="handleUpdateAdminRequest(${req.id}, 'Approved')"><i class="fa-solid fa-check"></i> Approve</button>
          <button class="btn btn-danger btn-sm" onclick="handleUpdateAdminRequest(${req.id}, 'Rejected')"><i class="fa-solid fa-xmark"></i> Reject</button>
        ` : `<span style="font-size: 0.8rem; color: var(--text-muted);">${req.status}</span>`}
      </td>
    </tr>
  `).join('');
}

// Direct Admin Password Authentication (2FA Disabled)
async function handleAdminLoginStep1(e) {
  e.preventDefault();
  const email = document.getElementById('admin-login-email').value.trim();
  const password = document.getElementById('admin-login-pass').value.trim();

  const res = await apiFetch('api/auth.php', { action: 'login_admin', email, password });
  if (res.success) {
    closeModal('modal-admin-login');
    showToast('Administrator authenticated successfully!', 'success');
    appState.isAdminAuthenticated = true;
    appState.adminData = res.admin;
    saveSession();
    renderAdminDashboard();
    if (window.confetti) {
      window.confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }
  } else {
    showToast(res.message, 'error');
  }
}

// Admin Access Request Submit
async function handleAdminRequestSubmit(e) {
  e.preventDefault();
  const payload = {
    action: 'request_admin_access',
    name: document.getElementById('admin-req-name').value,
    email: document.getElementById('admin-req-email').value,
    password: document.getElementById('admin-req-pass').value,
    reason: document.getElementById('admin-req-reason').value
  };

  const res = await apiFetch('api/auth.php', payload);
  if (res.success) {
    closeModal('modal-admin-login');
    showToast(res.message, 'success');
    loadInitialData();
  } else {
    showToast(res.message, 'error');
  }
}

// Main Admin First-Time Registration Submit
async function handleRegisterMainAdminSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('admin-setup-name').value;
  const email = document.getElementById('admin-setup-email').value;
  const password = document.getElementById('admin-setup-pass').value;
  const department = document.getElementById('admin-setup-dept').value;
  const position = document.getElementById('admin-setup-pos').value;

  const res = await apiFetch('api/auth.php', {
    action: 'register_main_admin',
    name,
    email,
    password,
    department,
    position
  });

  if (res.success) {
    closeModal('modal-admin-login');
    showToast(res.message, 'success', 8000);
    appState.isAdminAuthenticated = true;
    appState.adminData = res.admin;
    saveSession();
    await loadInitialData();
    if (window.confetti) {
      window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  } else {
    showToast(res.message, 'error');
  }
}

// Switch Admin Auth Modal Tabs
function switchAdminTab(tab) {
  const setupForm = document.getElementById('admin-setup-form');
  const step1 = document.getElementById('admin-login-step1');
  const step2 = document.getElementById('admin-login-step2');
  const reqForm = document.getElementById('admin-request-form');

  const setupTabBtn = document.getElementById('tab-btn-admin-setup');
  const loginTabBtn = document.getElementById('tab-btn-admin-login');
  const reqTabBtn = document.getElementById('tab-btn-admin-req');
  const headerTitle = document.getElementById('admin-modal-header-title');

  if (tab === 'setup') {
    if (setupForm) setupForm.style.display = 'block';
    if (step1) step1.style.display = 'none';
    if (step2) step2.style.display = 'none';
    if (reqForm) reqForm.style.display = 'none';

    if (setupTabBtn) setupTabBtn.className = 'btn btn-primary btn-sm';
    if (loginTabBtn) loginTabBtn.className = 'btn btn-secondary btn-sm';
    if (reqTabBtn) reqTabBtn.className = 'btn btn-secondary btn-sm';

    if (headerTitle) headerTitle.innerHTML = '<i class="fa-solid fa-user-shield" style="color: var(--warning);"></i> Initial Main Admin Setup';
  } else if (tab === 'login') {
    if (setupForm) setupForm.style.display = 'none';
    if (step1) step1.style.display = 'block';
    if (step2) step2.style.display = 'none';
    if (reqForm) reqForm.style.display = 'none';

    if (setupTabBtn) setupTabBtn.className = 'btn btn-secondary btn-sm';
    if (loginTabBtn) loginTabBtn.className = 'btn btn-primary btn-sm';
    if (reqTabBtn) reqTabBtn.className = 'btn btn-secondary btn-sm';

    if (headerTitle) headerTitle.innerHTML = '<i class="fa-solid fa-shield-halved" style="color: var(--primary);"></i> Admin Authentication';
  } else {
    if (setupForm) setupForm.style.display = 'none';
    if (step1) step1.style.display = 'none';
    if (step2) step2.style.display = 'none';
    if (reqForm) reqForm.style.display = 'block';

    if (setupTabBtn) setupTabBtn.className = 'btn btn-secondary btn-sm';
    if (loginTabBtn) loginTabBtn.className = 'btn btn-secondary btn-sm';
    if (reqTabBtn) reqTabBtn.className = 'btn btn-primary btn-sm';

    if (headerTitle) headerTitle.innerHTML = '<i class="fa-solid fa-user-plus" style="color: var(--info);"></i> Request Admin Access';
  }
}

// Add Single Employee Submit
async function handleAddEmployeeSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('new-emp-id').value.trim();
  const name = document.getElementById('new-emp-name').value.trim();
  const email = document.getElementById('new-emp-email').value.trim();
  const department = document.getElementById('new-emp-dept').value.trim();
  const position = document.getElementById('new-emp-pos').value.trim();
  const password = document.getElementById('new-emp-pass').value.trim();

  if (!password || password.length < 4) {
    showToast('Login password must be at least 4 characters long.', 'warning');
    return;
  }

  const payload = {
    action: 'add_employee',
    id,
    name,
    email,
    department,
    position,
    password
  };

  const res = await apiFetch('api/employees.php', payload);
  if (res.success) {
    closeModal('modal-add-emp');
    showToast(res.message, 'success');
    document.getElementById('new-emp-id').value = '';
    document.getElementById('new-emp-name').value = '';
    document.getElementById('new-emp-email').value = '';
    document.getElementById('new-emp-dept').value = '';
    document.getElementById('new-emp-pos').value = '';
    document.getElementById('new-emp-pass').value = '';
    loadInitialData();
  } else {
    showToast(res.message, 'error');
  }
}

// Process Bulk Excel Import
async function processExcelImport() {
  const fileInput = document.getElementById('excel-file-input');
  if (!fileInput.files || fileInput.files.length === 0) {
    showToast('Please select an Excel file first.', 'error');
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = async function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      const jsonRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);

      const employeesToImport = jsonRows.map(row => ({
        id: String(row.ID || row.Id || row.id || ('EMP-' + rand(100, 999))),
        name: String(row.Name || row.name || row['Full Name'] || 'Unknown'),
        email: String(row.Email || row.email || 'user@company.com'),
        department: String(row.Department || row.department || 'General'),
        position: String(row.Position || row.position || 'Staff')
      }));

      const res = await apiFetch('api/employees.php', {
        action: 'bulk_add_employees',
        employees: employeesToImport
      });

      if (res.success) {
        closeModal('modal-excel-import');
        showToast(res.message, 'success');
        loadInitialData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('Error parsing Excel file: ' + err.message, 'error');
    }
  };

  reader.readAsArrayBuffer(file);
}

// Export Attendance Logs to Excel (Full Month Roster & Approved Leaves Integration)
function exportAttendanceToExcel() {
  const employees = appState.employees || [];
  const logs = appState.attendanceLogs || [];
  const leaves = appState.leaves || [];

  if (employees.length === 0 && logs.length === 0) {
    showToast('No employee or attendance records available to export.', 'warning');
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const todayStr = now.toISOString().split('T')[0];

  // Total days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create list of date strings for current month (YYYY-MM-DD)
  const monthDates = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const monthStr = String(month + 1).padStart(2, '0');
    monthDates.push(`${year}-${monthStr}-${dayStr}`);
  }

  const dailyReportData = [];
  const summaryMap = {};

  // Build target employees list
  const targetEmployees = employees.length > 0 ? employees : Array.from(new Set(logs.map(l => l.employee_id))).map(id => {
    const log = logs.find(l => l.employee_id === id);
    return { id, name: log ? log.employee_name : id, department: 'General' };
  });

  targetEmployees.forEach(emp => {
    summaryMap[emp.id] = {
      'Employee ID': emp.id,
      'Employee Name': emp.name,
      'Department': emp.department || 'General',
      'Total Days Tracked': 0,
      'Present Days': 0,
      'Late Entries': 0,
      'Approved Leaves': 0,
      'Absent Days': 0,
      'Attendance Score (%)': '0%'
    };

    monthDates.forEach(dateStr => {
      const isFuture = dateStr > todayStr;
      
      // 1. Check if employee has an attendance log for this date
      const log = logs.find(l => 
        (l.employee_id || '').toLowerCase() === emp.id.toLowerCase() && l.date === dateStr
      );

      // 2. Check if employee has an APPROVED leave covering this date
      const approvedLeave = leaves.find(l => {
        const isEmpMatch = (l.employee_id || '').toLowerCase() === emp.id.toLowerCase();
        const isApproved = (l.status || '').toLowerCase() === 'approved';
        const inRange = l.start_date && l.end_date && dateStr >= l.start_date && dateStr <= l.end_date;
        return isEmpMatch && isApproved && inRange;
      });

      let status = 'Absent';
      let checkIn = '--:--';
      let checkOut = '--:--';
      let method = 'N/A';
      let selfie = 'No';
      let location = 'N/A';
      let notes = '';

      if (log) {
        status = log.attendance_status || 'Present';
        checkIn = log.check_in_time || '--:--';
        checkOut = log.check_out_time || '--:--';
        method = log.method || 'Direct Punch';
        selfie = (log.selfie_url || log.selfieUrl) ? 'Yes' : 'No';
        location = log.location_status || 'N/A';
        notes = log.notes || (approvedLeave ? `On Approved ${approvedLeave.leave_type}` : '');
      } else if (approvedLeave) {
        status = `On Leave (${approvedLeave.leave_type})`;
        method = 'Approved Leave Application';
        notes = `Approved Leave: ${approvedLeave.reason || approvedLeave.leave_type}`;
      } else if (isFuture) {
        status = 'Scheduled / Upcoming';
      }

      // Update Summary metrics for days up to today
      if (!isFuture) {
        summaryMap[emp.id]['Total Days Tracked']++;
        if (log) {
          if (status.includes('Present')) {
            summaryMap[emp.id]['Present Days']++;
          } else if (status.includes('Late')) {
            summaryMap[emp.id]['Present Days']++;
            summaryMap[emp.id]['Late Entries']++;
          } else {
            summaryMap[emp.id]['Present Days']++;
          }
        } else if (approvedLeave) {
          summaryMap[emp.id]['Approved Leaves']++;
        } else {
          summaryMap[emp.id]['Absent Days']++;
        }
      }

      dailyReportData.push({
        'Date': dateStr,
        'Employee ID': emp.id,
        'Employee Name': emp.name,
        'Department': emp.department || 'General',
        'Attendance Status': status,
        'Check-In Time': checkIn,
        'Check-Out Time': checkOut,
        'Verification Method': method,
        'Selfie Attached': selfie,
        'Location Verification': location,
        'Notes / Details': notes
      });
    });

    // Calculate Attendance Score %
    const summary = summaryMap[emp.id];
    const totalTracked = summary['Total Days Tracked'];
    if (totalTracked > 0) {
      const activeDays = summary['Present Days'] + summary['Approved Leaves'];
      const score = Math.round((activeDays / totalTracked) * 100);
      summary['Attendance Score (%)'] = `${score}%`;
    }
  });

  const summaryData = Object.values(summaryMap);

  // Build Excel Workbook with 2 Sheets
  const workbook = XLSX.utils.book_new();

  const sheet1 = XLSX.utils.json_to_sheet(dailyReportData);
  XLSX.utils.book_append_sheet(workbook, sheet1, 'Monthly Daily Roster');

  const sheet2 = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, sheet2, 'Monthly Employee Summary');

  const monthName = now.toLocaleString('default', { month: 'long' });
  const fileName = `SmartPulse_Monthly_Attendance_Report_${monthName}_${year}.xlsx`;

  XLSX.writeFile(workbook, fileName);
  showToast(`Full monthly attendance report exported successfully! (${monthName} ${year})`, 'success', 5000);
}

// Manual Attendance Entry Submit
async function handleManualLogSubmit(e) {
  e.preventDefault();
  const payload = {
    action: 'manual_add_log',
    employeeId: document.getElementById('manual-emp-select').value,
    employeeName: document.getElementById('manual-emp-select').options[document.getElementById('manual-emp-select').selectedIndex].text,
    date: document.getElementById('manual-date').value,
    checkInTime: document.getElementById('manual-checkin').value,
    checkOutTime: document.getElementById('manual-checkout').value,
    attendanceStatus: document.getElementById('manual-status').value
  };

  const res = await apiFetch('api/attendance.php', payload);
  if (res.success) {
    closeModal('modal-manual-log');
    showToast(res.message, 'success');
    loadInitialData();
  } else {
    showToast(res.message, 'error');
  }
}

// Open Manual Log Modal & Populate Select
function openManualLogModal() {
  const select = document.getElementById('manual-emp-select');
  if (select) {
    select.innerHTML = appState.employees.map(e => `<option value="${e.id}">${e.name} (${e.id})</option>`).join('');
  }
  openModal('modal-manual-log');
}

// Approve/Reject Leave Application
async function handleUpdateLeaveStatus(leaveId, status) {
  const res = await apiFetch('api/leaves.php', {
    action: 'update_leave_status',
    leaveId,
    status
  });
  if (res.success) {
    showToast(res.message, 'success');
    loadInitialData();
  } else {
    showToast(res.message, 'error');
  }
}

// Approve/Reject Admin Access Request
async function handleUpdateAdminRequest(requestId, status) {
  const res = await apiFetch('api/auth.php', {
    action: 'update_admin_request',
    requestId,
    status
  });
  if (res.success) {
    showToast(res.message, 'success');
    loadInitialData();
  } else {
    showToast(res.message, 'error');
  }
}

// Reset Employee Password
async function handleResetEmployeePass(id) {
  if (!confirm(`Reset password for employee ${id} back to default 'Emp@101'?`)) return;
  const res = await apiFetch('api/employees.php', { action: 'reset_password', id });
  if (res.success) {
    showToast(res.message, 'success');
    loadInitialData();
  } else {
    showToast(res.message, 'error');
  }
}

// Delete Employee
async function handleDeleteEmployee(id) {
  if (!confirm(`Are you sure you want to delete employee ${id} from the database?`)) return;
  const res = await apiFetch('api/employees.php', { action: 'delete_employee', id });
  if (res.success) {
    showToast(res.message, 'success');
    loadInitialData();
  } else {
    showToast(res.message, 'error');
  }
}

// Save Geofence Settings Submit
async function handleSaveGeofence(e) {
  e.preventDefault();
  const payload = {
    action: 'update_config',
    officeName: document.getElementById('geo-office-name').value,
    hqLat: document.getElementById('geo-hq-lat').value,
    hqLng: document.getElementById('geo-hq-lng').value,
    allowedRadiusMeters: document.getElementById('geo-radius').value,
    enforceGeofence: document.getElementById('geo-enforce').checked
  };

  const res = await apiFetch('api/geofence.php', payload);
  if (res.success) {
    showToast(res.message, 'success');
    appState.geofenceConfig = res.config;
    fetchLiveUserLocation();
    renderAdminDashboard();
  } else {
    showToast(res.message, 'error');
  }
}

// Update Geofence UI Elements
function updateGeofenceUI() {
  if (document.getElementById('geo-office-name')) {
    document.getElementById('geo-office-name').value = appState.geofenceConfig.office_name || '';
    document.getElementById('geo-hq-lat').value = appState.geofenceConfig.hq_lat || 19.1864;
    document.getElementById('geo-hq-lng').value = appState.geofenceConfig.hq_lng || 73.1919;
    document.getElementById('geo-radius').value = appState.geofenceConfig.allowed_radius_meters || 200;
    document.getElementById('geo-enforce').checked = appState.geofenceConfig.enforce_geofence == 1;
  }
}

function setCurrentLocationAsHQ() {
  if (!appState.userLocation.granted || appState.userLocation.lat === null || appState.userLocation.lng === null) {
    showToast('Fetching your live GPS coordinates... Please click Allow when prompted.', 'info');
    fetchLiveUserLocation(true);
    return;
  }

  const latElem = document.getElementById('geo-hq-lat');
  const lngElem = document.getElementById('geo-hq-lng');

  if (latElem && lngElem) {
    latElem.value = appState.userLocation.lat;
    lngElem.value = appState.userLocation.lng;
    showToast(`Updated HQ coordinates to your current GPS position (${appState.userLocation.lat.toFixed(4)}, ${appState.userLocation.lng.toFixed(4)})! Click "Save Configuration" to apply.`, 'success', 6000);
  }
}

async function quickSetHQToCurrentLocation() {
  if (!appState.userLocation.lat || !appState.userLocation.lng) {
    showToast('Live GPS coordinates not available.', 'error');
    return;
  }

  const payload = {
    action: 'update_config',
    officeName: appState.geofenceConfig.office_name || 'Current HQ Office',
    hqLat: appState.userLocation.lat,
    hqLng: appState.userLocation.lng,
    allowedRadiusMeters: appState.geofenceConfig.allowed_radius_meters || 500,
    enforceGeofence: true
  };

  const res = await apiFetch('api/geofence.php', payload);
  if (res.success) {
    showToast('Office HQ location calibrated to your current position! You are now in-bounds.', 'success', 5000);
    appState.geofenceConfig = res.config;
    updateGeofenceUI();
    fetchLiveUserLocation();
    renderAdminDashboard();
  } else {
    showToast(res.message, 'error');
  }
}

function checkAdminStatus() {
  const hasAdmin = appState.employees.some(e => e.role === 'admin');

  const lockBadge = document.getElementById('admin-lock-badge');
  const lockTitle = document.getElementById('admin-lock-title');
  const lockDesc = document.getElementById('admin-lock-desc');
  const authBtn = document.getElementById('btn-admin-auth-trigger');
  const setupTabBtn = document.getElementById('tab-btn-admin-setup');
  const reqTabBtn = document.getElementById('tab-btn-admin-req');

  if (!hasAdmin) {
    if (lockBadge) lockBadge.style.display = 'inline-flex';
    if (lockTitle) lockTitle.textContent = 'First-Time Setup: Register Main Administrator';
    if (lockDesc) lockDesc.textContent = 'No Main Administrator account configured. Register the primary administrator account now. Once registered, initial registration will automatically lock.';
    if (authBtn) authBtn.innerHTML = '<i class="fa-solid fa-user-shield"></i> Register Main Administrator';

    if (setupTabBtn) setupTabBtn.style.display = 'block';
    if (reqTabBtn) reqTabBtn.style.display = 'none';
  } else {
    if (lockBadge) lockBadge.style.display = 'none';
    if (lockTitle) lockTitle.textContent = 'Administrator Dashboard Locked';
    if (lockDesc) lockDesc.textContent = 'Admin Email & Password verification or Master 2FA Authentication is required to view employee rosters, modify geofence coordinates, and approve leave requests.';
    if (authBtn) authBtn.innerHTML = '<i class="fa-solid fa-key"></i> Authenticate / Request Admin Access';

    if (setupTabBtn) setupTabBtn.style.display = 'none';
    if (reqTabBtn) reqTabBtn.style.display = 'block';
  }

  return hasAdmin;
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}
function openLoginModal() { openModal('modal-emp-login'); }
function openAdminLoginModal() {
  const hasAdmin = checkAdminStatus();
  if (!hasAdmin) {
    switchAdminTab('setup');
  } else {
    switchAdminTab('login');
  }
  openModal('modal-admin-login');
}
function openAddEmpModal() { openModal('modal-add-emp'); }
function openExcelImportModal() { openModal('modal-excel-import'); }
function openLeaveModal() { openModal('modal-leave'); }
function openMandatoryVerificationModal() {
  if (!appState.currentUser) {
    showToast('Please log in first to punch in.', 'error');
    openLoginModal();
    return;
  }
  if (!checkMandatoryLocationAccess()) {
    return;
  }
  openModal('modal-mandatory-verification');
}

// Selfie Webcam Camera Capture
function openSelfieModal() {
  if (!appState.currentUser) {
    showToast('Please log in to punch in with Selfie Identity.', 'error');
    openLoginModal();
    return;
  }
  if (!checkMandatoryLocationAccess()) {
    return;
  }
  openModal('modal-selfie');

  const video = document.getElementById('selfie-video');
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => {
        selfieStream = stream;
        video.srcObject = stream;
      })
      .catch(err => {
        showToast('Webcam access denied: ' + err.message, 'error');
      });
  }
}

function stopSelfieCamera() {
  if (selfieStream) {
    selfieStream.getTracks().forEach(track => track.stop());
    selfieStream = null;
  }
}

function captureSelfieAndCheckIn() {
  const video = document.getElementById('selfie-video');
  const canvas = document.getElementById('selfie-canvas');
  if (!video || !canvas) return;

  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const selfieDataUrl = canvas.toDataURL('image/jpeg', 0.7);
  stopSelfieCamera();
  closeModal('modal-selfie');

  handlePunchInAction({ method: 'Selfie Verified Punch', selfieUrl: selfieDataUrl });
}

// QR Code Scanner Handler
function openQrScannerModal() {
  if (!appState.currentUser) {
    showToast('Please log in to punch in with QR Scan.', 'error');
    openLoginModal();
    return;
  }
  if (!checkMandatoryLocationAccess()) {
    return;
  }
  openModal('modal-qr-scan');

  try {
    html5QrScanner = new Html5Qrcode('qr-reader');
    html5QrScanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        stopQrScanner();
        closeModal('modal-qr-scan');
        handlePunchInAction({ method: `QR Code (${decodedText.substring(0, 15)})` });
      },
      (errorMessage) => { }
    ).catch(err => {
      console.warn('QR Camera initialization error:', err);
    });
  } catch (err) {
    console.error('Html5Qrcode error:', err);
  }
}

function stopQrScanner() {
  if (html5QrScanner) {
    html5QrScanner.stop().then(() => html5QrScanner.clear()).catch(err => { });
    html5QrScanner = null;
  }
}

// Office Kiosk QR Display Modal
function openKioskQrModal() {
  openModal('modal-kiosk-qr');
  const container = document.getElementById('kiosk-qr-display');
  const qrCodeText = appState.geofenceConfig.office_qr_code || 'GLOBAL-HQ-AMBERNATH-SECURITY-PASS-2026';
  document.getElementById('kiosk-qr-text').textContent = qrCodeText;

  // Use Google Chart API QR Generator for clean vector QR render
  container.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeText)}" alt="HQ Office QR Code" style="width: 200px; height: 200px; display: block;">`;
}

// Toast Notifications Helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-circle-xmark';
  if (type === 'warning') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
window.showToast = showToast;

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Database Backup & Maintenance Helpers
function exportSystemBackup() {
  if (typeof DBEngine === 'undefined') return;
  const jsonStr = DBEngine.exportDatabaseJSON();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SmartPulse_AMS_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Database backup downloaded successfully!', 'success');
}

function importSystemBackup(fileInput) {
  if (!fileInput.files || !fileInput.files[0]) return;
  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = async function (e) {
    const res = DBEngine.importDatabaseJSON(e.target.result);
    if (res.success) {
      showToast(res.message, 'success');
      await loadInitialData();
    } else {
      showToast(res.message, 'error');
    }
  };
  reader.readAsText(file);
}

function resetSystemData() {
  if (confirm('Are you sure you want to perform a complete system reset? This will erase all database records and restart in First-Time Main Admin registration mode.')) {
    localStorage.clear();
    appState.currentUser = null;
    appState.isAdminAuthenticated = false;
    saveSession();
    DBEngine.resetToDefaults();
    showToast('System reset complete! Starting fresh in First-Time Setup Mode.', 'success');
    loadInitialData();
  }
}
