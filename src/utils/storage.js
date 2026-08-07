// Storage Configuration

export const DEFAULT_GEOFENCE_CONFIG = {
  officeName: "Global Tech HQ - Ambernath, Maharashtra",
  hqLat: 19.1864,
  hqLng: 73.1919,
  radiusMeters: 200 // Allowed radius in meters
};

// Default starter employee when initialized fresh (empty state)
export const INITIAL_EMPLOYEES = [];

export const INITIAL_ATTENDANCE_LOGS = [];
export const INITIAL_LEAVES = [];

// Helper to load or initialize storage
export function getStorageData(key, fallbackData) {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : fallbackData;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallbackData;
  }
}

export function saveStorageData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}
