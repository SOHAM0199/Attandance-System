import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { MapPin, Save, Globe, Compass, CheckCircle2 } from 'lucide-react';

const LOCATION_PRESETS = [
  { name: "New Delhi HQ (Connaught Place)", lat: 28.6139, lng: 77.2090 },
  { name: "Bengaluru Tech Park", lat: 12.9716, lng: 77.5946 },
  { name: "Mumbai Business District (BKC)", lat: 19.0760, lng: 72.8777 },
  { name: "London Office (Canary Wharf)", lat: 51.5074, lng: -0.1278 }
];

export function GeofenceSettings() {
  const { geofenceConfig, updateGeofenceConfig } = useAttendance();

  const [officeName, setOfficeName] = useState(geofenceConfig.officeName);
  const [hqLat, setHqLat] = useState(geofenceConfig.hqLat);
  const [hqLng, setHqLng] = useState(geofenceConfig.hqLng);
  const [radiusMeters, setRadiusMeters] = useState(geofenceConfig.radiusMeters);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateGeofenceConfig({
      officeName,
      hqLat: Number(hqLat),
      hqLng: Number(hqLng),
      radiusMeters: Number(radiusMeters)
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const applyPreset = (preset) => {
    setOfficeName(preset.name);
    setHqLat(preset.lat);
    setHqLng(preset.lng);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <Globe color="var(--primary)" size={22} />
        <div>
          <h3 style={{ fontSize: '1.15rem' }}>Geofence Location Radius Configuration</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Configure GPS center point coordinates and perimeter boundary radius. Attendance submitted outside this radius requires selfie verification.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
          {/* Office Name */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Office Location / HQ Name
            </label>
            <input 
              type="text" 
              className="glass-input" 
              value={officeName} 
              onChange={(e) => setOfficeName(e.target.value)} 
              required 
            />
          </div>

          {/* Latitude */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Latitude (HQ Coords)
            </label>
            <input 
              type="number" 
              step="any"
              className="glass-input" 
              value={hqLat} 
              onChange={(e) => setHqLat(e.target.value)} 
              required 
            />
          </div>

          {/* Longitude */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Longitude (HQ Coords)
            </label>
            <input 
              type="number" 
              step="any"
              className="glass-input" 
              value={hqLng} 
              onChange={(e) => setHqLng(e.target.value)} 
              required 
            />
          </div>

          {/* Radius in Meters */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Allowed Geofence Radius Perimeter (Meters)
              </label>
              <strong style={{ color: 'var(--primary)' }}>{radiusMeters} Meters</strong>
            </div>
            <input 
              type="range" 
              min="50" 
              max="2000" 
              step="25"
              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              value={radiusMeters} 
              onChange={(e) => setRadiusMeters(e.target.value)} 
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              <span>50m (Tight Security)</span>
              <span>500m (Standard Campus)</span>
              <span>2000m (City District)</span>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
            Quick HQ Location Presets:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {LOCATION_PRESETS.map((preset, idx) => (
              <button 
                key={idx} 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => applyPreset(preset)}
              >
                <Compass size={12} /> {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button & Feedback */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {savedSuccess && (
            <span style={{ color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} /> Geofence configuration saved!
            </span>
          )}
          <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }}>
            <Save size={16} /> Save Geofence Settings
          </button>
        </div>
      </form>
    </div>
  );
}
