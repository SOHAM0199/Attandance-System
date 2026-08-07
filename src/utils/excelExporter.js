import * as XLSX from 'xlsx';

/**
 * Export Real-Time Monthly Attendance Matrix Calendar to Excel (.xlsx) file
 */
export function exportAttendanceToExcel(
  attendanceLogs = [], 
  employees = [], 
  filename = `Monthly_Attendance_Calendar_${new Date().toISOString().slice(0, 10)}.xlsx`
) {
  if ((!attendanceLogs || attendanceLogs.length === 0) && (!employees || employees.length === 0)) {
    alert("No attendance records or employee data available to export.");
    return;
  }

  // Determine Target Month & Year dynamically
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const monthName = now.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // 28 - 31

  // Extract unique employees roster
  let employeeRoster = [];
  if (employees && employees.length > 0) {
    employeeRoster = employees;
  } else {
    // Deduplicate from attendance logs
    const seen = new Set();
    (attendanceLogs || []).forEach(log => {
      if (!seen.has(log.employeeId)) {
        seen.add(log.employeeId);
        employeeRoster.push({
          id: log.employeeId,
          name: log.employeeName,
          department: log.department || 'General',
          role: 'Staff'
        });
      }
    });
  }

  // -------------------------------------------------------------
  // SHEET 1: REAL-TIME MONTHLY ATTENDANCE MATRIX CALENDAR
  // -------------------------------------------------------------
  const calendarRows = [];

  employeeRoster.forEach(emp => {
    const row = {
      "Employee ID": emp.id,
      "Employee Name": emp.name,
      "Department": emp.department || 'Engineering',
      "Job Role": emp.role || 'Staff'
    };

    let presentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let leaveCount = 0;
    let absentCount = 0;

    // Build real-time calendar date headers (e.g., "01 Aug (Sat)", "02 Aug (Sun)")
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const monthStr = String(month + 1).padStart(2, '0');
      const fullDateStr = `${year}-${monthStr}-${dayStr}`;
      const dateObj = new Date(year, month, day);
      const isSunday = dateObj.getDay() === 0;

      const dayNameShort = dateObj.toLocaleString('default', { weekday: 'short' });
      const monthShort = dateObj.toLocaleString('default', { month: 'short' });
      const calendarHeaderLabel = `${dayStr} ${monthShort} (${dayNameShort})`;

      // Find matching log for this employee on fullDateStr
      const log = (attendanceLogs || []).find(l => 
        l.employeeId.toLowerCase() === emp.id.toLowerCase() && l.date === fullDateStr
      );

      let statusSymbol = isSunday ? 'OFF' : '--';

      if (log) {
        if (log.attendanceStatus === 'Present') {
          statusSymbol = 'P';
          presentCount++;
        } else if (log.attendanceStatus === 'Late') {
          statusSymbol = 'L';
          lateCount++;
        } else if (log.attendanceStatus === 'Half Day') {
          statusSymbol = 'HD';
          halfDayCount++;
        } else if (log.attendanceStatus === 'On Leave' || log.leaveStatus === 'Approved') {
          statusSymbol = 'LV';
          leaveCount++;
        } else if (log.attendanceStatus === 'Absent') {
          statusSymbol = 'A';
          absentCount++;
        }
      }

      row[calendarHeaderLabel] = statusSymbol;
    }

    // Calculate Monthly Attendance Summary Metrics
    const totalWorkingDays = presentCount + lateCount + halfDayCount + leaveCount + absentCount;
    const rateVal = totalWorkingDays > 0 
      ? Math.round(((presentCount + lateCount + halfDayCount * 0.5) / totalWorkingDays) * 100)
      : 100;

    row["Total Present (P)"] = presentCount;
    row["Total Late (L)"] = lateCount;
    row["Total Half Day (HD)"] = halfDayCount;
    row["Total On Leave (LV)"] = leaveCount;
    row["Total Absent (A)"] = absentCount;
    row["Attendance Rate (%)"] = `${rateVal}%`;

    calendarRows.push(row);
  });

  // Create Matrix Sheet
  const matrixSheet = XLSX.utils.json_to_sheet(calendarRows);

  // Column Widths for Matrix Sheet
  const matrixCols = [
    { wch: 14 }, // Employee ID
    { wch: 22 }, // Employee Name
    { wch: 18 }, // Department
    { wch: 18 }  // Job Role
  ];

  // Calendar dates columns (wch 13 for "01 Aug (Sat)")
  for (let i = 1; i <= daysInMonth; i++) {
    matrixCols.push({ wch: 13 });
  }

  // Monthly summary stats columns
  matrixCols.push({ wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 18 });
  matrixSheet['!cols'] = matrixCols;

  // -------------------------------------------------------------
  // SHEET 2: SUMMARY & CODE LEGEND SHEET
  // -------------------------------------------------------------
  const summaryOverview = [
    { Parameter: "Report Name", Value: "Real-Time Monthly Attendance Calendar Matrix" },
    { Parameter: "Calendar Period", Value: `${monthName} ${year}` },
    { Parameter: "Total Registered Staff", Value: employeeRoster.length },
    { Parameter: "Total Logged Attendance Records", Value: (attendanceLogs || []).length },
    { Parameter: "Report Generation Timestamp", Value: new Date().toLocaleString() },
    { Parameter: "", Value: "" },
    { Parameter: "STATUS CODE", Value: "DESCRIPTION" },
    { Parameter: "P", Value: "Present (In Office / GPS Verified)" },
    { Parameter: "L", Value: "Late Arrival (Post 09:30 AM)" },
    { Parameter: "HD", Value: "Half Day Shift" },
    { Parameter: "LV", Value: "On Leave (Approved Casual/Sick/Earned)" },
    { Parameter: "A", Value: "Absent" },
    { Parameter: "OFF", Value: "Weekend / Scheduled Off" }
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryOverview);
  summarySheet['!cols'] = [{ wch: 32 }, { wch: 45 }];

  // -------------------------------------------------------------
  // SHEET 3: DETAILED ATTENDANCE LOG RECORDS
  // -------------------------------------------------------------
  const formattedLogsData = (attendanceLogs || []).map((record, idx) => ({
    "S.No": idx + 1,
    "Employee ID": record.employeeId,
    "Employee Name": record.employeeName,
    "Department": record.department || "General",
    "Date": record.date,
    "Check-In Time": record.checkInTime || "--:--",
    "Check-Out Time": record.checkOutTime || "--:--",
    "Duration": record.duration || "--",
    "Method": record.method || "GPS Radar",
    "GPS Geofence Status": record.locationStatus || "Inside HQ Radius",
    "Distance from HQ": record.distanceMeters !== undefined ? `${record.distanceMeters} meters` : "Verified",
    "Selfie Status": record.selfieCaptured ? "Captured & Verified" : "N/A",
    "Attendance Status": record.attendanceStatus,
    "Leave Status": record.leaveStatus || "N/A"
  }));

  const detailedSheet = XLSX.utils.json_to_sheet(formattedLogsData);
  detailedSheet['!cols'] = [
    { wch: 6 }, { wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 24 },
    { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 14 }
  ];

  // -------------------------------------------------------------
  // BUILD WORKBOOK
  // -------------------------------------------------------------
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, matrixSheet, `Calendar Matrix (${monthName})`);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary & Legend");
  XLSX.utils.book_append_sheet(workbook, detailedSheet, "Detailed Log Records");

  XLSX.writeFile(workbook, filename);
}
