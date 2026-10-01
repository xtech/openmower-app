import { AreaProps } from '@/stores/schemas';
import { area as turfArea } from '@turf/area';
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { featureCollection, lineString, multiPolygon, polygon } from '@turf/helpers';
import { nearestPointOnLine } from '@turf/nearest-point-on-line';
import { pointOnFeature } from '@turf/point-on-feature';
import { polygonToLine } from '@turf/polygon-to-line';
import { polygonize } from '@turf/polygonize';
import { Feature, GeoJsonProperties, Polygon, type LineString, type MultiPolygon, type Position } from 'geojson';
import { customAlphabet } from 'nanoid';
import sweeplineIntersections from 'sweepline-intersections';

export const generateId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 32);

export const getBiggestArea = <P extends GeoJsonProperties = AreaProps>(areas: Feature<Polygon, P>[]) => {
  if (areas.length === 0) throw new Error('Cannot get biggest area from empty array');
  return areas.reduce(
    (max, curr) => {
      const currArea = turfArea(curr);
      return currArea > max.area ? { feature: curr, area: currArea } : max;
    },
    { feature: areas[0], area: turfArea(areas[0]) },
  ).feature;
};

export const removeMiniCoords = (feature: Feature<Polygon | MultiPolygon> | null) => {
  if (feature === null) return null;
  const coords = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  const filteredCoords = coords.filter((coord) => turfArea(polygon(coord)) >= 0.001);
  if (filteredCoords.length === 0) {
    return undefined;
  } else if (filteredCoords.length === 1) {
    return polygon(filteredCoords[0]);
  } else {
    return multiPolygon(filteredCoords);
  }
};

const insertPointsOnLine = (line: Feature<LineString>, points: Position[]) => {
  let newLine = line;
  for (const point of points) {
    const snapped = nearestPointOnLine(newLine, point);
    newLine = lineString(newLine.geometry.coordinates.toSpliced(snapped.properties.index + 1, 0, point));
  }
  return newLine;
};

export const splitPolygonWithLine = (
  polygon: Feature<Polygon>,
  cutterLine: Feature<LineString>,
): Feature<Polygon>[] => {
  if (polygon.geometry.coordinates.length !== 1) {
    throw new Error('Splitting is only implemented for polygons without holes');
  }

  const polygonLine = polygonToLine(polygon) as Feature<LineString>;

  const intersections: Position[] = sweeplineIntersections(featureCollection([polygonLine, cutterLine]), true);
  const lines = featureCollection([
    insertPointsOnLine(polygonLine, intersections),
    insertPointsOnLine(cutterLine, intersections),
  ]);

  const candidatePolys = polygonize(lines);
  const insidePolys = candidatePolys.features.filter((candidate) =>
    booleanPointInPolygon(pointOnFeature(candidate), polygon),
  );
  return insidePolys.length >= 2 ? insidePolys : [polygon];
};
