# SmartPulse AMS - Attendance Management System

SmartPulse AMS is a modern, responsive **Attendance Management System** featuring Geofencing GPS tracking, Webcam Selfie identity verification, Office Kiosk QR scanning, Excel import/export, and Two-Factor (2FA) Email OTP authentication.

Built with **Pure HTML5, CSS3, Vanilla JavaScript (ES6)** and a lightweight **Client-Side Storage Engine**, this project requires **ZERO dependencies (No XAMPP, No Apache, No PHP, No Node.js, No MySQL)**.

---

## 🚀 How to Run (Zero Dependencies Required)

### Method 1: Double-Click `index.html` (Easiest)
1. Open the project folder on your computer.
2. Double-click **`index.html`** to open it in Chrome, Microsoft Edge, Firefox, or Safari.
3. That's it! The application runs 100% in your web browser with local data persistence.

### Method 2: Any Web Host / Static Server
Upload `index.html`, `css/`, and `js/` to any static web hosting platform (GitHub Pages, Netlify, Vercel, Firebase Hosting, cPanel).

---

## 🔒 Setup & Authentication Flow

1. **First-Time System Setup (Main Admin Registration)**:
   - When launching the application for the first time, switch to the **Admin Portal** or click **Register Main Administrator**.
   - Fill in your name, email address, password, department, and position title.
   - Upon registration, your account is set as the **Primary Main Administrator**.

2. **Automatic Admin Registration Lock**:
   - Immediately after the Main Administrator registers, open admin registration **automatically locks/closes**.
   - No additional admin accounts can be created directly.

3. **Subsequent Admin Access Requests**:
   - Other users who require administrative access can submit a request under **Request Access**.
   - The Main Admin can review and **Approve** or **Reject** pending requests inside the **Admin Dashboard**.

4. **Registering Employees**:
   - The Main Admin (and approved admins) can register employees individually using the **Register New Employee** modal or bulk import them from an Excel file (`.xlsx`, `.csv`).
   - Registered employees can then sign in via the **Employee Portal** to punch in/out, view personal attendance logs, and submit leave requests.

---

## 🌟 Key Features

1. **Employee Portal**:
   - Geofence-verified Punch In / Punch Out.
   - Real-time GPS location radar feedback.
   - Webcam Selfie Identity Check-In.
   - Office Kiosk QR Code Scanner Check-In.
   - Personal attendance history table.
   - Leave Application workflow.

2. **Administrator Dashboard**:
   - Master Attendance Directory with real-time search filters.
   - Add single employee or bulk import rosters from Excel (`.xlsx`, `.csv`).
   - Export master attendance logs to Excel report files.
   - Approve / Reject leave requests.
   - System Geofence HQ location & allowed radius configuration.
   - Admin access requests & approval management.
   - Two-Factor (2FA) OTP authentication.
   - Local JSON Database Backup & Restore.

