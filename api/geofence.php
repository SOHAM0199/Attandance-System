<?php
/**
 * SmartPulse AMS - Geofence Settings & Configuration API
 */

require_once __DIR__ . '/db.php';

$input = json_decode(file_get_contents('php://input'), true) ?? $_REQUEST;
$action = $input['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'get_config':
        handleGetGeofenceConfig($pdo);
        break;
    case 'update_config':
        handleUpdateGeofenceConfig($pdo, $input);
        break;
    default:
        json_response(['success' => false, 'message' => 'Invalid geofence action.'], 400);
}

function handleGetGeofenceConfig($pdo) {
    $stmt = $pdo->query("SELECT * FROM geofence_config WHERE id = 1");
    $cfg = $stmt->fetch();
    json_response(['success' => true, 'config' => $cfg]);
}

function handleUpdateGeofenceConfig($pdo, $input) {
    $officeName = trim($input['officeName'] ?? 'HQ Office');
    $hqLat = (float)($input['hqLat'] ?? 19.1864);
    $hqLng = (float)($input['hqLng'] ?? 73.1919);
    $allowedRadiusMeters = (int)($input['allowedRadiusMeters'] ?? 200);
    $enforceGeofence = isset($input['enforceGeofence']) ? (int)(bool)$input['enforceGeofence'] : 1;
    $officeQrCode = trim($input['officeQrCode'] ?? 'GLOBAL-HQ-AMBERNATH-SECURITY-PASS-2026');

    $stmt = $pdo->prepare("
        INSERT OR REPLACE INTO geofence_config (id, office_name, hq_lat, hq_lng, allowed_radius_meters, enforce_geofence, office_qr_code, updated_at)
        VALUES (1, :offName, :lat, :lng, :radius, :enforce, :qr, CURRENT_TIMESTAMP)
    ");
    $stmt->execute([
        'offName' => $officeName,
        'lat' => $hqLat,
        'lng' => $hqLng,
        'radius' => $allowedRadiusMeters,
        'enforce' => $enforceGeofence,
        'qr' => $officeQrCode
    ]);

    json_response([
        'success' => true,
        'message' => 'HQ Geofence location and radius updated successfully!',
        'config' => [
            'office_name' => $officeName,
            'hq_lat' => $hqLat,
            'hq_lng' => $hqLng,
            'allowed_radius_meters' => $allowedRadiusMeters,
            'enforce_geofence' => $enforceGeofence,
            'office_qr_code' => $officeQrCode
        ]
    ]);
}
