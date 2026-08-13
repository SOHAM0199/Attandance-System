<?php
/**
 * SmartPulse AMS - Employee Management API
 */

require_once __DIR__ . '/db.php';

$input = json_decode(file_get_contents('php://input'), true) ?? $_REQUEST;
$action = $input['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'get_employees':
        handleGetEmployees($pdo);
        break;
    case 'add_employee':
        handleAddEmployee($pdo, $input);
        break;
    case 'bulk_add_employees':
        handleBulkAddEmployees($pdo, $input);
        break;
    case 'reset_password':
        handleResetPassword($pdo, $input);
        break;
    case 'delete_employee':
        handleDeleteEmployee($pdo, $input);
        break;
    default:
        json_response(['success' => false, 'message' => 'Invalid employee action.'], 400);
}

function handleGetEmployees($pdo) {
    $stmt = $pdo->query("SELECT id, name, email, department, position, role, is_first_login, status, created_at FROM employees ORDER BY created_at DESC");
    $employees = $stmt->fetchAll();
    json_response(['success' => true, 'employees' => $employees]);
}

function handleAddEmployee($pdo, $input) {
    $id = trim($input['id'] ?? '');
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $department = trim($input['department'] ?? 'Engineering');
    $position = trim($input['position'] ?? 'Staff Member');
    $password = trim($input['password'] ?? 'Emp@101');

    if (empty($id) || empty($name) || empty($email)) {
        json_response(['success' => false, 'message' => 'Employee ID, Name, and Email are mandatory.'], 400);
    }

    // Check duplicate ID or Email
    $stmtCheck = $pdo->prepare("SELECT COUNT(*) as count FROM employees WHERE LOWER(id) = LOWER(:id) OR LOWER(email) = LOWER(:email)");
    $stmtCheck->execute(['id' => $id, 'email' => $email]);
    if ($stmtCheck->fetch()['count'] > 0) {
        json_response(['success' => false, 'message' => 'An employee with this ID or Email already exists.'], 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO employees (id, name, email, department, position, role, password, is_first_login, status)
        VALUES (:id, :name, :email, :dept, :pos, 'employee', :pass, 0, 'Active')
    ");
    $stmt->execute([
        'id' => $id,
        'name' => $name,
        'email' => $email,
        'dept' => $department,
        'pos' => $position,
        'pass' => $password
    ]);

    json_response([
        'success' => true,
        'message' => "Employee '{$name}' ({$id}) added successfully!",
        'employee' => [
            'id' => $id,
            'name' => $name,
            'email' => $email,
            'department' => $department,
            'position' => $position,
            'role' => 'employee',
            'is_first_login' => 1,
            'status' => 'Active'
        ]
    ]);
}

function handleBulkAddEmployees($pdo, $input) {
    $employeesList = $input['employees'] ?? [];
    if (empty($employeesList) || !is_array($employeesList)) {
        json_response(['success' => false, 'message' => 'No employee records provided for bulk import.'], 400);
    }

    $insertedCount = 0;
    $pdo->beginTransaction();

    try {
        $stmtCheck = $pdo->prepare("SELECT COUNT(*) as count FROM employees WHERE LOWER(id) = LOWER(:id) OR LOWER(email) = LOWER(:email)");
        $stmtInsert = $pdo->prepare("
            INSERT INTO employees (id, name, email, department, position, role, password, is_first_login, status)
            VALUES (:id, :name, :email, :dept, :pos, 'employee', :pass, 1, 'Active')
        ");

        foreach ($employeesList as $emp) {
            $id = trim($emp['id'] ?? '');
            $name = trim($emp['name'] ?? '');
            $email = trim($emp['email'] ?? '');
            $dept = trim($emp['department'] ?? 'General');
            $pos = trim($emp['position'] ?? 'Staff Member');
            $pass = trim($emp['password'] ?? 'Emp@101');

            if (empty($id) || empty($name) || empty($email)) continue;

            $stmtCheck->execute(['id' => $id, 'email' => $email]);
            if ($stmtCheck->fetch()['count'] == 0) {
                $stmtInsert->execute([
                    'id' => $id,
                    'name' => $name,
                    'email' => $email,
                    'dept' => $dept,
                    'pos' => $pos,
                    'pass' => $pass
                ]);
                $insertedCount++;
            }
        }

        $pdo->commit();
        json_response([
            'success' => true,
            'message' => "Successfully imported {$insertedCount} new employee records into SQLite database!"
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'Bulk import failed: ' . $e->getMessage()], 500);
    }
}

function handleResetPassword($pdo, $input) {
    $id = trim($input['id'] ?? '');
    $newPass = trim($input['newPassword'] ?? 'Emp@101');

    if (empty($id)) {
        json_response(['success' => false, 'message' => 'Employee ID is required.'], 400);
    }

    $stmt = $pdo->prepare("UPDATE employees SET password = :pass, is_first_login = 1 WHERE LOWER(id) = LOWER(:id)");
    $stmt->execute(['pass' => $newPass, 'id' => $id]);

    if ($stmt->rowCount() > 0) {
        json_response(['success' => true, 'message' => "Password for employee {$id} has been reset to '{$newPass}'."]);
    } else {
        json_response(['success' => false, 'message' => 'Employee not found.'], 404);
    }
}

function handleDeleteEmployee($pdo, $input) {
    $id = trim($input['id'] ?? '');
    if (empty($id)) {
        json_response(['success' => false, 'message' => 'Employee ID required.'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM employees WHERE LOWER(id) = LOWER(:id)");
    $stmt->execute(['id' => $id]);

    json_response(['success' => true, 'message' => "Employee {$id} removed from system directory."]);
}
