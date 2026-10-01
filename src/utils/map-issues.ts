import { generateId, getBiggestArea } from '@/utils/area-utils';
import unkinkPolygon from '@turf/unkink-polygon';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import type { Draft } from 'immer';
import sweeplineIntersections from 'sweepline-intersections';

export interface MapIssue {
  id: string;
  featureId: string;
  type: 'kinks';
  message: string;
  fix: (feature: Draft<Feature>, collection: Draft<FeatureCollection>) => void;
}

type DetectedIssue = Omit<MapIssue, 'id' | 'featureId'> | null;

// @turf/kinks produces false positives on dense/near-duplicate vertex polygons.
// sweeplineIntersections with false is the authoritative self-intersection check.
function hasSelfIntersections(poly: Feature<Polygon>): boolean {
  const pts = sweeplineIntersections(poly, false);
  return pts.length > 0;
}

function makePolygon(coords: number[][]): Feature<Polygon> {
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties: {} };
}

// Iteratively remove the vertex closest to each self-intersection until clean.
function removeKinkVertices(poly: Feature<Polygon>): Feature<Polygon> {
  let coords = [...poly.geometry.coordinates[0]];
  for (let attempt = 0; attempt < coords.length; attempt++) {
    const intersections = sweeplineIntersections(makePolygon(coords), false);
    if (intersections.length === 0) break;
    // Find the coordinate index closest to the first intersection point.
    const [ix, iy] = intersections[0];
    let nearest = -1;
    let minDist = Infinity;
    // Skip index 0 / last (closing vertex) to keep the ring closed.
    for (let i = 1; i < coords.length - 1; i++) {
      const dx = coords[i][0] - ix;
      const dy = coords[i][1] - iy;
      const d = dx * dx + dy * dy;
      if (d < minDist) {
        minDist = d;
        nearest = i;
      }
    }
    if (nearest === -1 || coords.length <= 4) break; // need at least a triangle
    coords = [...coords.slice(0, nearest), ...coords.slice(nearest + 1)];
    // Keep ring closed.
    coords[coords.length - 1] = coords[0];
  }
  return makePolygon(coords);
}

function checkKinks(feature: Feature): DetectedIssue {
  if (feature.geometry.type !== 'Polygon') return null;
  if (!hasSelfIntersections(feature as Feature<Polygon>)) return null;
  return {
    type: 'kinks',
    message: 'Self-intersection',
    fix: (feature) => {
      const pieces = unkinkPolygon(feature as Feature<Polygon>).features;
      let result = getBiggestArea(pieces);
      // Last resort: iteratively remove vertices nearest to each intersection point.
      if (hasSelfIntersections(result)) {
        result = removeKinkVertices(result);
      }
      (feature as Draft<Feature<Polygon>>).geometry = result.geometry;
    },
  };
}

export function detectFeatureIssues(feature: Feature): MapIssue[] {
  return [checkKinks(feature)]
    .filter((issue) => issue !== null)
    .map((issue) => ({ ...issue, id: generateId(), featureId: feature.id as string }));
}
