/**
 * Calculates distance between two latitude/longitude points in meters using Haversine formula
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in meters

  return Math.round(distance);
}

/**
 * Checks if user coordinates are within target radius
 */
export function verifyGeofence(userLat, userLng, hqLat, hqLng, allowedRadiusMeters) {
  const distanceMeters = calculateDistance(userLat, userLng, hqLat, hqLng);
  const isWithin = distanceMeters <= allowedRadiusMeters;
  
  return {
    isWithin,
    distanceMeters,
    allowedRadiusMeters,
    statusText: isWithin 
      ? `Verified (${distanceMeters}m from HQ)`
      : `Out of Radius (${distanceMeters}m from HQ, Max: ${allowedRadiusMeters}m)`
  };
}
