import { LatLon, default as Utm } from 'geodesy/utm.js';

export type RelativePoint = { x: number; y: number };
export type AbsolutePoint = [longitude: number, latitude: number];
export type UtmPoint = Utm;

export function datumToRelative(absolute: AbsolutePoint): UtmPoint {
  return new LatLon(absolute[1], absolute[0]).toUtm();
}

export function pointToAbsolute(point: RelativePoint, datum: UtmPoint): AbsolutePoint {
  const { latitude, longitude } = new Utm(
    datum.zone,
    datum.hemisphere,
    datum.easting + point.x,
    datum.northing + point.y,
  ).toLatLon();
  return [longitude, latitude];
}

export function pointToRelative(point: AbsolutePoint, datum: UtmPoint): RelativePoint {
  const utmPoint = new LatLon(point[1], point[0]).toUtm(datum.zone);
  return { x: utmPoint.easting - datum.easting, y: utmPoint.northing - datum.northing };
}

export function pointsToAbsolute(points: RelativePoint[], datum: UtmPoint): AbsolutePoint[] {
  return points.map((point) => pointToAbsolute(point, datum));
}

export function pointsToRelative(points: AbsolutePoint[], datum: UtmPoint): RelativePoint[] {
  return points.map((point) => pointToRelative(point, datum));
}
