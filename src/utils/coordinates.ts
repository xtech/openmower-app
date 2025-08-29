/**
 * Coordinate conversion utilities for UTM to lat/lng
 *
 * Since the mower system uses UTM coordinates relative to a GPS datum,
 * we need to convert these to lat/lng for display on MapLibre GL maps.
 */

export interface Point {
  x: number;
  y: number;
}

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface UTMDatum {
  lat: number;
  long: number;
  height: number;
}

/**
 * Simple approximation for converting UTM offsets to lat/lng
 * This is a simplified conversion that assumes:
 * - Small distances (< 1km) from the datum
 * - Relatively flat terrain
 * - UTM coordinates are in meters
 *
 * For more precise conversions, a full UTM projection library would be needed.
 */
export function utmToLatLng(utmPoint: Point, datum: UTMDatum): LatLngPoint {
  // Approximate conversion factors (meters to degrees)
  // These are rough approximations and vary by latitude
  const metersPerDegreeLat = 111320; // roughly constant
  const metersPerDegreeLng = 111320 * Math.cos((datum.lat * Math.PI) / 180); // varies by latitude

  const lat = datum.lat + utmPoint.y / metersPerDegreeLat;
  const lng = datum.long + utmPoint.x / metersPerDegreeLng;

  return {lat, lng};
}

/**
 * Convert a polygon of UTM points to lat/lng
 */
export function utmPolygonToLatLng(utmPolygon: Point[], datum: UTMDatum): LatLngPoint[] {
  return utmPolygon.map((point) => utmToLatLng(point, datum));
}

/**
 * Calculate the bounds of UTM coordinates and convert to lat/lng bounds
 */
export function getMapBounds(
  points: Point[],
  datum: UTMDatum,
): {
  southwest: LatLngPoint;
  northeast: LatLngPoint;
} {
  if (points.length === 0) {
    const center = utmToLatLng({x: 0, y: 0}, datum);
    return {
      southwest: {lat: center.lat - 0.001, lng: center.lng - 0.001},
      northeast: {lat: center.lat + 0.001, lng: center.lng + 0.001},
    };
  }

  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));

  const southwest = utmToLatLng({x: minX, y: minY}, datum);
  const northeast = utmToLatLng({x: maxX, y: maxY}, datum);

  return {southwest, northeast};
}
