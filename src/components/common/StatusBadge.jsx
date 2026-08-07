import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, MapPin, Camera } from 'lucide-react';

export function StatusBadge({ type, value }) {
  if (type === 'location') {
    const isInside = value?.includes('Verified') || value?.includes('Inside');
    return (
      <span className={`badge ${isInside ? 'badge-success' : 'badge-danger'}`}>
        <MapPin size={12} />
        {value}
      </span>
    );
  }

  if (type === 'selfie') {
    return value ? (
      <span className="badge badge-info">
        <Camera size={12} />
        Selfie Captured
      </span>
    ) : (
      <span className="badge badge-neutral">
        N/A
      </span>
    );
  }

  if (type === 'attendance') {
    switch (value) {
      case 'Present':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> Present</span>;
      case 'Late':
        return <span className="badge badge-warning"><Clock size={12} /> Late Arrival</span>;
      case 'On Leave':
        return <span className="badge badge-info"><Clock size={12} /> On Leave</span>;
      case 'Absent':
        return <span className="badge badge-danger"><XCircle size={12} /> Absent</span>;
      default:
        return <span className="badge badge-neutral">{value}</span>;
    }
  }

  if (type === 'leave') {
    switch (value) {
      case 'Approved':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> Approved</span>;
      case 'Pending':
        return <span className="badge badge-warning"><Clock size={12} /> Pending Approval</span>;
      case 'Rejected':
        return <span className="badge badge-danger"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="badge badge-neutral">N/A</span>;
    }
  }

  return <span className="badge badge-neutral">{value}</span>;
}
