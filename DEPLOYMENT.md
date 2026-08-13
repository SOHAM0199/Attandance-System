# SmartPulse AMS - Deployment & Server Setup Guide

This version of **SmartPulse Attendance Management System (AMS)** is built with **Pure HTML, CSS, and Vanilla JavaScript** on the frontend, powered by **PHP and SQLite** on the backend.

It requires **NO Node.js, NO React build steps, NO npm dependencies, and NO external MySQL server setup**! 

---

## 🚀 How to Deploy on a Live Server (cPanel, Hostinger, GoDaddy, Bluehost, Namecheap, Apache, Nginx)

### Step 1: Upload Files to Server
1. Download or clone this repository.
2. Open your hosting control panel (cPanel File Manager, Hostinger File Manager, or FTP client like FileZilla).
3. Upload all project files into your server's root folder (`public_html` or `www` or your target subdomain directory).

### Step 2: Set Folder Permissions for SQLite
1. Ensure the `database/` directory on your server has **Read & Write** permissions (`777` or `755` permissions).
2. That's it! When the web page or API is accessed for the first time, PHP automatically creates the SQLite database file `database/ams.sqlite` and initializes all tables and seed records.

---

## 💻 How to Test Locally on Your Computer

### Option A: Using Built-in PHP Server (Fastest)
1. Open PowerShell / Command Prompt / Terminal in the project folder.
2. Run:
   ```bash
   php -S localhost:8000
   ```
3. Open your browser and navigate to `http://localhost:8000`.

### Option B: Using XAMPP / WAMP / MAMP
1. Copy the project folder into your XAMPP `htdocs` directory (e.g. `C:\xampp\htdocs\attendance-management-system`).
2. Start Apache from XAMPP Control Panel.
3. Open browser to `http://localhost/attendance-management-system`.

---

## 🔒 Initial Admin & User Setup

- **First-Time Administrator Setup**:
  - The first time the system runs, navigate to the **Admin Portal** and click **Register Main Administrator**.
  - Provide your full name, email, password, and department title.
  - This registers you as the primary Main Admin and **locks open admin registration**.

- **Adding Employees**:
  - Log in as Main Admin and click **Register New Employee** (or use **Bulk Excel Import**) to add employees.
  - Employees can then sign into the **Employee Portal** using their credentials.

---

## 🛠 Features Included out-of-the-box
- **SQLite Data Storage**: Zero-configuration embedded database.
- **Geofence GPS Radius Verification**: Calculates Haversine distance from HQ coordinates.
- **Selfie Identity Verification**: Built-in webcam capture.
- **Office Kiosk QR Code Scanner**: Built-in HTML5 webcam QR scanner.
- **Excel Roster Import & Export**: Powered by SheetJS (`.xlsx`).
- **2FA Email OTP Dispatch**: Automatic SMTP mail dispatch.
