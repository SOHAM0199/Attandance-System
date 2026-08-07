import React, { useState } from 'react';
import { FileSpreadsheet, Upload, Download, CheckCircle, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { parseEmployeesExcel, downloadSampleExcelTemplate } from '../../utils/excelImporter';

export function ExcelImportModal({ isOpen, onClose }) {
  const { employees, bulkAddEmployees } = useAttendance();

  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleFileSelection = async (file) => {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setSelectedFile(file);
    setError('');
    setLoading(true);

    try {
      const result = await parseEmployeesExcel(file, employees);
      if (!result.success) {
        setError(result.error || 'Failed to parse file.');
        setParsedData(null);
      } else {
        setParsedData(result);
      }
    } catch (err) {
      console.error(err);
      setError(`Error reading file: ${err.message || 'Unknown parsing error'}`);
      setParsedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedData || !parsedData.employees || parsedData.employees.length === 0) {
      return;
    }

    bulkAddEmployees(parsedData.employees);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedData(null);
    setError('');
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.45rem', borderRadius: '10px', color: '#10b981' }}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.1rem' }}>Import Employees from Excel / CSV</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Upload `.xlsx`, `.xls`, or `.csv` files to add multiple employees instantly.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body">
          {/* Top Info Banner & Template Download */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.82rem', color: '#a7f3d0', maxWidth: '400px' }}>
              <strong>Need formatted template?</strong> Download our pre-configured sample Excel file to populate your team data.
            </div>
            <button className="btn btn-secondary btn-sm" onClick={downloadSampleExcelTemplate} style={{ color: '#34d399', borderColor: 'rgba(16,185,129,0.3)', gap: '0.4rem', fontSize: '0.8rem' }}>
              <Download size={15} /> Sample Template (.xlsx)
            </button>
          </div>

          {/* Upload Zone (if no file parsed yet) */}
          {!parsedData && (
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{ 
                border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-color)'}`, 
                borderRadius: '14px', 
                padding: '2.5rem 1.5rem', 
                textAlign: 'center', 
                background: dragActive ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease',
                marginBottom: '1rem'
              }}
            >
              <Upload size={38} color={dragActive ? 'var(--primary)' : 'var(--text-muted)'} style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#fff', marginBottom: '0.35rem' }}>
                Drag & Drop your Excel file here
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) format
              </div>

              <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                Choose File
                <input 
                  type="file" 
                  accept=".xlsx,.xls,.csv" 
                  style={{ display: 'none' }} 
                  onChange={(e) => handleFileSelection(e.target.files[0])} 
                />
              </label>
            </div>
          )}

          {/* Loading Spinner */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin-icon" style={{ marginBottom: '0.5rem' }} />
              <div>Parsing spreadsheet contents...</div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', color: '#f87171', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {/* Parsed Data Preview Grid */}
          {parsedData && parsedData.employees && (
            <div>
              {/* Warning Notices */}
              {parsedData.warnings && parsedData.warnings.length > 0 && (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.78rem', color: '#fbbf24', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={15} /> Parsing Warnings ({parsedData.warnings.length}):
                  </div>
                  <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                    {parsedData.warnings.slice(0, 3).map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                    {parsedData.warnings.length > 3 && (
                      <li>...and {parsedData.warnings.length - 3} more notices.</li>
                    )}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fff' }}>
                  Preview Ready: <span style={{ color: '#34d399' }}>{parsedData.employees.length} Employees</span> found
                </div>
                <button className="btn btn-secondary btn-sm" onClick={handleReset} style={{ fontSize: '0.78rem' }}>
                  Select Different File
                </button>
              </div>

              {/* Table Container */}
              <div className="table-container" style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Email</th>
                      <th>Leave Quota (C/S/E)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.employees.map((emp, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--primary)' }}>{emp.id}</td>
                        <td style={{ fontWeight: '600', color: '#fff' }}>{emp.name}</td>
                        <td>{emp.role}</td>
                        <td>{emp.department}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{emp.email}</td>
                        <td>
                          <span style={{ background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                            {emp.leaveBalance.casual} / {emp.leaveBalance.sick} / {emp.leaveBalance.earned}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pinned Sticky Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {parsedData && parsedData.employees && (
            <button type="button" className="btn btn-success" onClick={handleConfirmImport}>
              <CheckCircle size={16} /> Import {parsedData.employees.length} Employees
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
