import * as XLSX from 'xlsx';

const DEFAULT_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
];

/**
 * Parses uploaded Excel / CSV file into normalized employee objects
 */
export async function parseEmployeesExcel(file, existingEmployees = []) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert worksheet to JSON rows
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rawRows || rawRows.length === 0) {
          return resolve({ success: false, error: "The uploaded file contains no data rows.", employees: [] });
        }

        const existingIds = new Set(existingEmployees.map(emp => emp.id.trim().toLowerCase()));

        const parsedEmployees = [];
        const warnings = [];

        rawRows.forEach((row, index) => {
          // Normalize column header keys (case-insensitive & whitespace trimmed)
          const normalizedRow = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.trim().toLowerCase()] = String(row[key]).trim();
          });

          // Helper key lookup
          const getValue = (keys) => {
            for (const k of keys) {
              if (normalizedRow[k] !== undefined && normalizedRow[k] !== "") {
                return normalizedRow[k];
              }
            }
            return "";
          };

          const rawName = getValue(["name", "full name", "employee name", "emp name", "fullname"]);
          let rawId = getValue(["id", "emp id", "employee id", "empid", "code"]);
          const role = getValue(["role", "position", "designation", "job title", "title"]) || "Staff Member";
          const department = getValue(["department", "dept", "team"]) || "General";
          const email = getValue(["email", "email address", "mail"]) || (rawName ? `${rawName.toLowerCase().replace(/\s+/g, '.')}@company.com` : "");

          const casualLeave = Number(getValue(["casual leave", "casual", "cl"])) || 12;
          const sickLeave = Number(getValue(["sick leave", "sick", "sl"])) || 8;
          const earnedLeave = Number(getValue(["earned leave", "earned", "el", "paid leave"])) || 15;

          // Skip completely empty rows
          if (!rawName && !rawId) {
            return;
          }

          // Auto-generate ID if missing
          if (!rawId) {
            const nextIndex = existingEmployees.length + parsedEmployees.length + 101;
            rawId = `EMP-${nextIndex}`;
            warnings.push(`Row ${index + 2}: Missing Employee ID for '${rawName || 'Unnamed'}'. Auto-assigned ID: ${rawId}`);
          }

          const cleanId = rawId.toUpperCase();
          const cleanName = rawName || `Employee ${cleanId}`;

          // Check duplicate ID within file or existing employees
          if (existingIds.has(cleanId.toLowerCase())) {
            warnings.push(`Row ${index + 2}: Duplicate Employee ID '${cleanId}' already exists. Skipped.`);
            return;
          }

          existingIds.add(cleanId.toLowerCase());

          const avatar = DEFAULT_AVATARS[parsedEmployees.length % DEFAULT_AVATARS.length];

          parsedEmployees.push({
            id: cleanId,
            name: cleanName,
            role: role,
            department: department,
            email: email,
            avatar: avatar,
            leaveBalance: {
              casual: casualLeave,
              sick: sickLeave,
              earned: earnedLeave
            }
          });
        });

        resolve({
          success: true,
          employees: parsedEmployees,
          warnings: warnings,
          totalRows: rawRows.length
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Downloads a sample formatted Excel template for employee bulk import
 */
export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      "Employee ID": "EMP-201",
      "Full Name": "Sarah Jenkins",
      "Role": "Senior UI/UX Designer",
      "Department": "Design",
      "Email": "sarah.jenkins@company.com",
      "Casual Leave": 12,
      "Sick Leave": 8,
      "Earned Leave": 15
    },
    {
      "Employee ID": "EMP-202",
      "Full Name": "David Chen",
      "Role": "Backend Engineer",
      "Department": "Engineering",
      "Email": "david.chen@company.com",
      "Casual Leave": 12,
      "Sick Leave": 8,
      "Earned Leave": 15
    },
    {
      "Employee ID": "EMP-203",
      "Full Name": "Priya Sharma",
      "Role": "HR Operations Specialist",
      "Department": "Human Resources",
      "Email": "priya.sharma@company.com",
      "Casual Leave": 14,
      "Sick Leave": 10,
      "Earned Leave": 18
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  worksheet['!cols'] = [
    { wch: 15 }, // ID
    { wch: 22 }, // Name
    { wch: 25 }, // Role
    { wch: 18 }, // Dept
    { wch: 28 }, // Email
    { wch: 14 }, // Casual
    { wch: 14 }, // Sick
    { wch: 14 }  // Earned
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Import Template");

  XLSX.writeFile(workbook, "Employee_Import_Template.xlsx");
}
