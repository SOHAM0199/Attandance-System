<?php
/**
 * SmartPulse Attendance Management System (AMS)
 * SQLite Database Connection & Schema Migration Helper
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

$dbDir = __DIR__ . '/../database';
if (!file_exists($dbDir)) {
    mkdir($dbDir, 0777, true);
}

$dbPath = $dbDir . '/ams.sqlite';

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec("PRAGMA foreign_keys = ON;");

    // Initialize Schema
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS employees (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            department TEXT,
            position TEXT,
            role TEXT DEFAULT 'employee',
            password TEXT NOT NULL,
            is_first_login INTEGER DEFAULT 1,
            status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS attendance_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id TEXT NOT NULL,
            employee_name TEXT NOT NULL,
            date TEXT NOT NULL,
            check_in_time TEXT NOT NULL,
            check_out_time TEXT DEFAULT '--:--',
            method TEXT NOT NULL,
            location_status TEXT NOT NULL,
            attendance_status TEXT NOT NULL,
            lat REAL,
            lng REAL,
            selfie_url TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS leaves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id TEXT NOT NULL,
            employee_name TEXT NOT NULL,
            leave_type TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            reason TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            admin_comment TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS geofence_config (
            id INTEGER PRIMARY KEY,
            office_name TEXT NOT NULL,
            hq_lat REAL NOT NULL,
            hq_lng REAL NOT NULL,
            allowed_radius_meters INTEGER NOT NULL,
            enforce_geofence INTEGER DEFAULT 1,
            office_qr_code TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admin_access_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL,
            reason TEXT,
            status TEXT DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS smtp_config (
            id INTEGER PRIMARY KEY,
            host TEXT DEFAULT 'smtp.gmail.com',
            port INTEGER DEFAULT 465,
            user TEXT DEFAULT '',
            pass TEXT DEFAULT '',
            from_email TEXT DEFAULT '',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS otp_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            otp TEXT NOT NULL,
            expires_at INTEGER NOT NULL
        );
    ");

    // Seed Geofence default if empty
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM geofence_config");
    $row = $stmt->fetch();
    if ($row['count'] == 0) {
        $stmtSeedGeo = $pdo->prepare("
            INSERT INTO geofence_config (id, office_name, hq_lat, hq_lng, allowed_radius_meters, enforce_geofence, office_qr_code)
            VALUES (1, 'Global Tech HQ - Ambernath, Maharashtra', 19.1864, 73.1919, 200, 1, 'GLOBAL-HQ-AMBERNATH-SECURITY-PASS-2026')
        ");
        $stmtSeedGeo->execute();
    }

    // Seed default SMTP config if empty
    $stmtSmtp = $pdo->query("SELECT COUNT(*) as count FROM smtp_config");
    $rowSmtp = $stmtSmtp->fetch();
    if ($rowSmtp['count'] == 0) {
        $stmtSeedSmtp = $pdo->prepare("
            INSERT INTO smtp_config (id, host, port, user, pass, from_email)
            VALUES (1, 'smtp.gmail.com', 465, '', '', '')
        ");
        $stmtSeedSmtp->execute();
    }

    // Clean database - No dummy seed records inserted


} catch (PDOException $e) {
    json_response(['success' => false, 'message' => 'SQLite Database Connection Error: ' . $e->getMessage()], 500);
}
