import type {Area, AreaProps, MapData} from '@/stores/schemas';
import type {AreaFeature} from '@/types/geojson';
import {
  datumToRelative,
  pointsToAbsolute,
  pointsToRelative,
  pointToAbsolute,
  type AbsolutePoint,
  type RelativePoint,
  type UtmPoint,
} from '@/utils/coordinates';
import area from '@turf/area';
import type {Feature, FeatureCollection, Point, Polygon} from 'geojson';
import {produce} from 'immer';

// Remove consecutive duplicate or near-duplicate points (within 1mm) — floating point artifacts from the mower.
// Compares against the last *kept* point so removal is transitive.
const DEDUPE_EPSILON = 0.001; // meters
function dedupePoints(points: RelativePoint[]): RelativePoint[] {
  return points.reduce<RelativePoint[]>((acc, p) => {
    const prev = acc[acc.length - 1];
    if (!prev || Math.abs(p.x - prev.x) >= DEDUPE_EPSILON || Math.abs(p.y - prev.y) >= DEDUPE_EPSILON) {
      acc.push(p);
    }
    return acc;
  }, []);
}

function areaToFeature(area: Area, datum: UtmPoint): Feature<Polygon, AreaProps> {
  return {
    type: 'Feature',
    id: area.id,
    properties: area.properties,
    geometry: {
      type: 'Polygon',
      coordinates: [pointsToAbsolute(dedupePoints(area.outline), datum)],
    },
  };
}

function featureToArea(feature: AreaFeature, datum: UtmPoint): Area {
  return {
    id: feature.id as string,
    properties: feature.properties,
    outline: pointsToRelative(feature.geometry.coordinates[0] as AbsolutePoint[], datum),
  };
}

function pointToFeature(type: string, point: RelativePoint, datum: UtmPoint): Feature<Point> {
  return {
    type: 'Feature',
    properties: {
      type: type,
    },
    geometry: {
      type: 'Point',
      coordinates: pointToAbsolute(point, datum),
    },
  };
}

function convertDatum(map: MapData) {
  const {lat, long} = map.datum!;
  return datumToRelative([long, lat]);
}

export function mapToFeatures(map?: MapData): FeatureCollection {
  if (!map || !map.datum) {
    return {type: 'FeatureCollection', features: []};
  }
  const datum = convertDatum(map);
  return {
    type: 'FeatureCollection',
    features: [
      ...map.docking_stations.map((dock) => pointToFeature('docking_station', dock.position, datum)),
      ...map.areas.map((area) => areaToFeature(area, datum)),
    ],
  };
}

export function featuresToMap(map: MapData, features: FeatureCollection) {
  const datum = convertDatum(map);
  return produce(map, (draft) => {
    draft.areas = features.features
      .filter((feature) => feature.geometry.type === 'Polygon')
      .map((feature) => featureToArea(feature as AreaFeature, datum));

    // TODO: Convert docking stations (but we don't say the orientation, so we can't convert them back).
  });
}

export function getFeatureDescription(feature: Feature) {
  const type = feature.geometry.type;
  const properties = feature.properties;

  if (properties?.name) {
    return `${type}: ${properties.name}`;
  }

  if (type === 'Polygon') {
    let subType = 'Polygon';
    if (properties?.type === 'mow') {
      subType = 'Working Area';
    } else if (properties?.type === 'nav') {
      subType = 'Navigation Area';
    }
    return `${subType} (${area(feature.geometry).toFixed(2)} m²)`;
  }

  if (type === 'LineString') {
    const coordinates = feature.geometry.coordinates;
    return `LineString (${coordinates.length} points)`;
  }

  if (type === 'Point') {
    if (properties?.type === 'docking_station') {
      return 'Docking station';
    }
    return 'Point';
  }

  return type;
}
