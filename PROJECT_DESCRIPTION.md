# SmartPulse AMS - Executive Project Description & Technical Overview

**System Title**: SmartPulse AMS (SmartPulse Attendance Management System)  
**Target Audience**: HR Department, IT Management, Project Leads, & Executive Leadership  
**Technology Stack**: HTML5, Vanilla CSS3 (Custom Glassmorphism UI), Vanilla JavaScript (ES6+), PHP Backend, SQLite Database  

---

## 📌 Executive Summary

**SmartPulse AMS** is an enterprise-grade, web-based Attendance & Leave Management System engineered to automate workforce time tracking, eliminate proxy check-ins, and streamline HR leave workflows. Built with a modern, glassmorphic dark-mode user interface, the system combines **live GPS geofencing**, **mandatory selfie camera verification**, **webcam QR code scanning**, and **automated monthly Excel roster generation**.

The platform is designed with a **dual-mode persistence architecture**: it seamlessly connects to a central server **PHP/SQLite database** for multi-device real-time synchronization, while maintaining an offline-capable client-side database fallback to ensure zero downtime.

---

## 🚀 Key Modules & Feature Highlights

### 1. 🛡️ Dual-Role Independent Security Portals
- **Employee Portal**:
  - Live digital clock and attendance check-in/check-out terminal.
  - Real-time geofence GPS location verification.
  - Mandatory multi-factor check-in choices (Webcam Selfie Verification or Office QR Pass Scan).
  - Personal daily attendance log history.
  - Dedicated **Sanctioned Holidays & Leave Tracker** with live status badges.
- **Admin Control Center**:
  - First-Time Admin Registration & Account Locking for maximum security.
  - Independent Administrator session management.
  - Real-time workforce metrics (Total Staff, Present Today, Pending Leaves, Active Geofence Radius).
  - Master Attendance Roster with **High-Resolution Selfie Photo Modal Viewer**.
  - Employee Registration (with custom initial login password assignment) & Directory Management.
  - Leave Application Approval/Rejection Workflow.
  - 1-Click System Geofence Location Calibration.

---

### 2. 📍 Mandatory GPS Geofence & Location Enforcement
- **Haversine Distance Engine**: Automatically calculates the precise physical distance (in meters) between the user's browser location and the configured Office Headquarters GPS coordinates.
- **Strict Boundary Rules**: System dynamically classifies punch-ins as `GPS Verified In-Bounds` or `Flagged Out-of-Bounds`.
- **1-Click Admin Calibration**: Includes a `Use My Current GPS Location` tool for quick headquarters location updates.

---

### 3. 📷 Anti-Proxy Verification (Selfie Camera & QR Scanning)
- **Selfie Identity Capture**: Integrates browser webcam access to capture high-definition photo proof at the moment of check-in.
- **Admin Photo Viewer**: Administrators can review attached selfie photos for every employee attendance log directly from the master table.
- **Office Kiosk QR Scanner**: Built-in HTML5 camera QR reader allowing employees to punch in via physical office QR codes.

---

### 4. 🌴 Leave Application & Sanctioned Holiday System
- **Employee Leave Filing**: Simple modal interface to apply for *Casual*, *Sick*, *Paid Annual*, or *Emergency* leaves with custom date ranges and absence reasons.
- **HR Approval Workflow**: Admins review pending requests with single-click Approve/Reject buttons.
- **Sanctioned Leave Notification Banner**: When HR sanctions a leave request, an instant green announcement banner appears on the employee's dashboard detailing the approved dates and category.

---

### 5. 📊 Automated Multi-Sheet Monthly Excel Reporting
- **Sheet 1: `Monthly Daily Roster`**:
  - Generates a day-by-day attendance sheet for every day of the month across all employees.
  - Automatically integrates **Approved Leaves** into the daily log (e.g. `On Leave (Casual Leave)`).
  - Reports check-in times, check-out times, verification methods, selfie status, and location flags.
- **Sheet 2: `Monthly Employee Summary`**:
  - Summarizes HR metrics per employee: *Total Tracked Days*, *Present Days*, *Late Entries*, *Approved Leaves*, *Absent Days*, and *Attendance Score (%)*.

---

### 6. 📱 100% Mobile & Cross-Device Responsiveness
- Optimized for desktop monitors, laptops, tablets, and mobile smartphones.
- Includes touch-accelerated horizontal table scrolling, responsive navigation bars, and mobile-friendly modal displays.

---

## 🛠️ Technical Architecture & Deployment

| Layer | Technology | Function |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5, Vanilla CSS (Variables, Flexbox/Grid, Animations), JavaScript ES6+ | Zero-framework high-performance interface with responsive glassmorphism. |
| **Backend API** | PHP 7.4+ / 8.x REST API (`api/auth.php`, `api/attendance.php`, etc.) | Handles authentication, punch-ins, leave workflow, and config endpoints. |
| **Database** | SQLite3 (`database/ams.sqlite`) & LocalStorage Fallback | Zero-configuration database requiring no MySQL setup; automatic fallback for offline use. |
| **Libraries** | SheetJS (`xlsx`), HTML5-QRCode, FontAwesome v6, Canvas Confetti | Excel export generation, camera QR scanning, and UI icons. |

---

## 💼 Business Benefits & Return on Investment (ROI)

1. **Eliminates Buddy Punching & Fraud**: Mandatory selfie capture and GPS geofence validation ensure physical presence at the workplace.
2. **Saves HR Administrative Time**: Instant 1-click Excel monthly report generation replaces manual spreadsheet compilation.
3. **Zero Maintenance & Infrastructure Cost**: Embedded SQLite database requires no expensive database servers or complex software maintenance.
4. **Seamless Deployment**: Deploys instantly to any standard web host (cPanel, HostPanel, Apache, Nginx) or runs directly in-browser.

---
*Document prepared for Executive & Management Review.*
