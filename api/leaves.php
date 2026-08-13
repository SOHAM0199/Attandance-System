<?php
/**
 * SmartPulse AMS - Leave Management API
 */

require_once __DIR__ . '/db.php';

$input = json_decode(file_get_contents('php://input'), true) ?? $_REQUEST;
$action = $input['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'apply_leave':
        handleApplyLeave($pdo, $input);
        break;
    case 'get_user_leaves':
        handleGetUserLeaves($pdo, $input);
        break;
    case 'get_all_leaves':
        handleGetAllLeaves($pdo);
        break;
    case 'update_leave_status':
        handleUpdateLeaveStatus($pdo, $input);
        break;
    default:
        json_response(['success' => false, 'message' => 'Invalid leave action.'], 400);
}

function handleApplyLeave($pdo, $input) {
    $empId = trim($input['employeeId'] ?? '');
    $empName = trim($input['employeeName'] ?? '');
    $leaveType = trim($input['leaveType'] ?? 'Casual Leave');
    $startDate = trim($input['startDate'] ?? '');
    $endDate = trim($input['endDate'] ?? '');
    $reason = trim($input['reason'] ?? '');

    if (empty($empId) || empty($empName) || empty($startDate) || empty($endDate) || empty($reason)) {
        json_response(['success' => false, 'message' => 'All leave application fields are mandatory.'], 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO leaves (employee_id, employee_name, leave_type, start_date, end_date, reason, status)
        VALUES (:empId, :empName, :ltype, :sdate, :edate, :reason, 'Pending')
    ");
    $stmt->execute([
        'empId' => $empId,
        'empName' => $empName,
        'ltype' => $leaveType,
        'sdate' => $startDate,
        'edate' => $endDate,
        'reason' => $reason
    ]);

    json_response([
        'success' => true,
        'message' => 'Leave application submitted successfully! Pending admin approval.',
        'leave' => [
            'id' => $pdo->lastInsertId(),
            'employee_id' => $empId,
            'employee_name' => $empName,
            'leave_type' => $leaveType,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'reason' => $reason,
            'status' => 'Pending'
        ]
    ]);
}

function handleGetUserLeaves($pdo, $input) {
    $empId = trim($input['employeeId'] ?? $_GET['employeeId'] ?? '');
    if (empty($empId)) {
        json_response(['success' => false, 'message' => 'Employee ID required.'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM leaves WHERE LOWER(employee_id) = LOWER(:empId) ORDER BY id DESC");
    $stmt->execute(['empId' => $empId]);
    $leaves = $stmt->fetchAll();

    json_response(['success' => true, 'leaves' => $leaves]);
}

function handleGetAllLeaves($pdo) {
    $stmt = $pdo->query("SELECT * FROM leaves ORDER BY id DESC");
    $leaves = $stmt->fetchAll();
    json_response(['success' => true, 'leaves' => $leaves]);
}

function handleUpdateLeaveStatus($pdo, $input) {
    $leaveId = (int)($input['leaveId'] ?? 0);
    $status = trim($input['status'] ?? ''); // 'Approved' or 'Rejected'
    $adminComment = trim($input['adminComment'] ?? '');

    if ($leaveId <= 0 || !in_array($status, ['Approved', 'Rejected'])) {
        json_response(['success' => false, 'message' => 'Invalid status update arguments.'], 400);
    }

    $stmt = $pdo->prepare("UPDATE leaves SET status = :status, admin_comment = :comment WHERE id = :id");
    $stmt->execute(['status' => $status, 'comment' => $adminComment, 'id' => $leaveId]);

    json_response([
        'success' => true,
        'message' => "Leave application #{$leaveId} has been {$status}."
    ]);
}
