# SmartPulse Attendance Management System 🚀

A modern, production-ready Attendance Management System featuring **QR Code check-in**, **GPS Geofence radius verification**, **Webcam selfie identity verification fallback**, **Leave Management**, **Admin Tabular Dashboard**, and **Excel (`.xlsx`) Export**.

---

## 🌟 Key Features

1. **QR Code Attendance System**:
   - **Stationary Kiosk Generator**: Admin can generate & print QR codes for office desks and entry gates.
   - **Mobile/Desktop Camera QR Scanner**: Scan office QR codes to check in.
2. **GPS Geofence Verification**:
   - **Haversine Distance Radar**: Calculates exact distance (in meters) between user GPS and Office HQ.
   - **Configurable Radius Perimeter**: Set allowed radius (e.g. 50m, 200m, 500m).
3. **Selfie Capture Verification (Fallback)**:
   - Live Webcam Feed snapshot for employees outside the allowed geofence radius or when QR scan is unavailable.
   - Automatic watermark with timestamp & GPS status attached directly to attendance logs.
4. **Leave Management System**:
   - Apply for Casual, Sick, Earned, or Unpaid leaves with duration calculator.
   - Admin panel to **Approve** or **Reject** pending employee leave requests.
5. **Admin Tabular Dashboard**:
   - Live analytics: Total Staff, Present Rate, Late Arrivals, Geofence Alerts.
   - Master Directory Table with search, status filters, and selfie photo viewer.
6. **Excel Report Export**:
   - Download complete attendance logs formatted cleanly into `.xlsx` spreadsheets (includes Summary Overview & Detailed Log sheets).

---

## 📁 Project Folder Structure

```
attendance-management-system/
├── package.json
├── vite.config.js
├── index.html
├── README.md
├── server/                          # Production Express API Backend
│   └── index.js                    # API Endpoints for Attendance, Leaves & Geofence
└── src/
    ├── main.jsx                    # Application Entrypoint
    ├── App.jsx                     # Main Layout & Role Switcher
    ├── styles/
    │   └── index.css               # Modern Glassmorphic Dark Design System
    ├── context/
    │   └── AttendanceContext.jsx    # Global State Manager & GPS Geolocation Tracker
    ├── components/
    │   ├── common/                 # Header, StatusBadge, Navbar
    │   ├── employee/               # CheckInCard, QRScannerModal, SelfieCaptureModal, LeaveApplicationModal
    │   └── admin/                  # DashboardOverview, AttendanceTable, GeofenceSettings, LeaveApprovalTable, QrGeneratorModal
    └── utils/
        ├── geofence.js             # Haversine Distance Formula
        ├── excelExporter.js        # XLSX Excel File Builder
        └── storage.js              # LocalStorage & Realistic Seed Data
```

---

## 🛠️ How to Run Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

3. **Start Express Backend API** (Optional for full-stack integration):
   ```bash
   npm run server
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```

---

## 🚀 Live Deployment Guide

### Deploying Frontend to Vercel / Netlify:
1. Push project repository to GitHub.
2. Connect repository to [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
3. Set build command to `npm run build` and output folder to `dist`.
4. Deploy!

### Deploying Full-Stack / Backend to Render / Railway:
1. Connect repository to [Render](https://render.com) or [Railway](https://railway.app).
2. Set start command to `npm run server`.
3. Set environment variable `PORT=5000`.
