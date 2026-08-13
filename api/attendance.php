<?php
/**
 * SmartPulse AMS - Attendance Tracking API
 */

require_once __DIR__ . '/db.php';

$input = json_decode(file_get_contents('php://input'), true) ?? $_REQUEST;
$action = $input['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'punch_in':
        handlePunchIn($pdo, $input);
        break;
    case 'punch_out':
        handlePunchOut($pdo, $input);
        break;
    case 'get_user_logs':
        handleGetUserLogs($pdo, $input);
        break;
    case 'get_all_logs':
        handleGetAllLogs($pdo);
        break;
    case 'manual_add_log':
        handleManualAddLog($pdo, $input);
        break;
    default:
        json_response(['success' => false, 'message' => 'Invalid attendance action.'], 400);
}

function handlePunchIn($pdo, $input) {
    $employeeId = trim($input['employeeId'] ?? '');
    $employeeName = trim($input['employeeName'] ?? '');
    $method = trim($input['method'] ?? 'Geofence Direct Check-In');
    $userLat = isset($input['lat']) ? (float)$input['lat'] : null;
    $userLng = isset($input['lng']) ? (float)$input['lng'] : null;
    $selfieUrl = trim($input['selfieUrl'] ?? '');
    $notes = trim($input['notes'] ?? '');

    if (empty($employeeId) || empty($employeeName)) {
        json_response(['success' => false, 'message' => 'Employee ID and Name are required for check-in.'], 400);
    }

    if ($userLat === null || $userLng === null) {
        json_response(['success' => false, 'message' => 'Mandatory GPS location missing! Please grant location access to check in.'], 400);
    }

    $todayDate = date('Y-m-d');
    $nowTime = date('h:i A');

    // Check if already punched in today
    $stmtCheck = $pdo->prepare("SELECT * FROM attendance_logs WHERE LOWER(employee_id) = LOWER(:empId) AND date = :tdate ORDER BY id DESC LIMIT 1");
    $stmtCheck->execute(['empId' => $employeeId, 'tdate' => $todayDate]);
    $existing = $stmtCheck->fetch();

    if ($existing && $existing['check_out_time'] === '--:--') {
        json_response(['success' => false, 'message' => 'You are already punched in for today! Punch out first before re-checking in.'], 400);
    }

    // Geofence Radius Check
    $stmtGeo = $pdo->query("SELECT * FROM geofence_config WHERE id = 1");
    $geoCfg = $stmtGeo->fetch();

    $locationStatus = 'Verified (In-Bounds)';
    $attendanceStatus = 'Present';

    if ($geoCfg && $geoCfg['enforce_geofence'] == 1 && $userLat !== null && $userLng !== null) {
        $distanceMeters = calculateHaversineDistance($geoCfg['hq_lat'], $geoCfg['hq_lng'], $userLat, $userLng);
        if ($distanceMeters > $geoCfg['allowed_radius_meters']) {
            $locationStatus = "Out of Bounds (" . round($distanceMeters) . "m from HQ)";
            $attendanceStatus = "Flagged Geofence Violation";
        } else {
            $locationStatus = "Verified In-Bounds (" . round($distanceMeters) . "m)";
        }
    }

    $stmtInsert = $pdo->prepare("
        INSERT INTO attendance_logs (employee_id, employee_name, date, check_in_time, check_out_time, method, location_status, attendance_status, lat, lng, selfie_url, notes)
        VALUES (:empId, :empName, :tdate, :inTime, '--:--', :method, :locStatus, :attStatus, :lat, :lng, :selfie, :notes)
    ");
    $stmtInsert->execute([
        'empId' => $employeeId,
        'empName' => $employeeName,
        'tdate' => $todayDate,
        'inTime' => $nowTime,
        'method' => $method,
        'locStatus' => $locationStatus,
        'attStatus' => $attendanceStatus,
        'lat' => $userLat,
        'lng' => $userLng,
        'selfie' => $selfieUrl,
        'notes' => $notes
    ]);

    json_response([
        'success' => true,
        'message' => "Successfully punched in at {$nowTime}!",
        'log' => [
            'id' => $pdo->lastInsertId(),
            'employee_id' => $employeeId,
            'employee_name' => $employeeName,
            'date' => $todayDate,
            'check_in_time' => $nowTime,
            'check_out_time' => '--:--',
            'method' => $method,
            'location_status' => $locationStatus,
            'attendance_status' => $attendanceStatus
        ]
    ]);
}

function handlePunchOut($pdo, $input) {
    $employeeId = trim($input['employeeId'] ?? '');
    if (empty($employeeId)) {
        json_response(['success' => false, 'message' => 'Employee ID is required.'], 400);
    }

    $todayDate = date('Y-m-d');
    $nowTime = date('h:i A');

    $stmtCheck = $pdo->prepare("SELECT * FROM attendance_logs WHERE LOWER(employee_id) = LOWER(:empId) AND date = :tdate AND check_out_time = '--:--' ORDER BY id DESC LIMIT 1");
    $stmtCheck->execute(['empId' => $employeeId, 'tdate' => $todayDate]);
    $openLog = $stmtCheck->fetch();

    if (!$openLog) {
        json_response(['success' => false, 'message' => 'No active open check-in session found to punch out from today.'], 400);
    }

    $stmtUpdate = $pdo->prepare("UPDATE attendance_logs SET check_out_time = :outTime WHERE id = :id");
    $stmtUpdate->execute(['outTime' => $nowTime, 'id' => $openLog['id']]);

    json_response([
        'success' => true,
        'message' => "Successfully punched out at {$nowTime}. Have a great rest of your day!"
    ]);
}

function handleGetUserLogs($pdo, $input) {
    $employeeId = trim($input['employeeId'] ?? $_GET['employeeId'] ?? '');
    if (empty($employeeId)) {
        json_response(['success' => false, 'message' => 'Employee ID required.'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM attendance_logs WHERE LOWER(employee_id) = LOWER(:empId) ORDER BY date DESC, id DESC");
    $stmt->execute(['empId' => $employeeId]);
    $logs = $stmt->fetchAll();

    json_response(['success' => true, 'logs' => $logs]);
}

function handleGetAllLogs($pdo) {
    $stmt = $pdo->query("SELECT * FROM attendance_logs ORDER BY date DESC, id DESC");
    $logs = $stmt->fetchAll();
    json_response(['success' => true, 'logs' => $logs]);
}

function handleManualAddLog($pdo, $input) {
    $empId = trim($input['employeeId'] ?? '');
    $empName = trim($input['employeeName'] ?? '');
    $date = trim($input['date'] ?? date('Y-m-d'));
    $checkInTime = trim($input['checkInTime'] ?? '09:00 AM');
    $checkOutTime = trim($input['checkOutTime'] ?? '05:00 PM');
    $status = trim($input['attendanceStatus'] ?? 'Present');
    $method = trim($input['method'] ?? 'Manual Admin Override');

    if (empty($empId) || empty($empName)) {
        json_response(['success' => false, 'message' => 'Employee ID and Name are required.'], 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO attendance_logs (employee_id, employee_name, date, check_in_time, check_out_time, method, location_status, attendance_status)
        VALUES (:empId, :empName, :date, :inTime, :outTime, :method, 'Admin Verified', :status)
    ");
    $stmt->execute([
        'empId' => $empId,
        'empName' => $empName,
        'date' => $date,
        'inTime' => $checkInTime,
        'outTime' => $checkOutTime,
        'method' => $method,
        'status' => $status
    ]);

    json_response(['success' => true, 'message' => 'Manual attendance record added successfully!']);
}

function calculateHaversineDistance($lat1, $lon1, $lat2, $lon2) {
    $earthRadius = 6371000; // in meters
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat / 2) * sin($dLat / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon / 2) * sin($dLon / 2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $earthRadius * $c;
}
