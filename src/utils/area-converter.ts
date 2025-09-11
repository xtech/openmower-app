import type {Area, AreaProps, AreaType, MapData} from '@/stores/schemas';
import {
  datumToRelative,
  pointsToAbsolute,
  pointToAbsolute,
  type RelativePoint,
  type UtmPoint,
} from '@/utils/coordinates';
import area from '@turf/area';
import type {Feature, FeatureCollection, Point, Polygon} from 'geojson';

function areaToFeature(area: Area, datum: UtmPoint): Feature<Polygon, AreaProps> {
  return {
    type: 'Feature',
    id: area.id,
    properties: area.properties,
    geometry: {
      type: 'Polygon',
      coordinates: [pointsToAbsolute(area.outline, datum)],
    },
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
      ...(map.docking_pose ? [pointToFeature('docking_pose', map.docking_pose, datum)] : []),
      ...(map.areas?.map((area) => areaToFeature(area, datum)) ?? []),
    ],
  };
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
    if (properties?.type === 'docking_pose') {
      return 'Docking Pose';
    }
    return 'Point';
  }

  return type;
}

export function getAreaFeatures(features: FeatureCollection, type: AreaType): Feature<Polygon, AreaProps>[] {
  return features.features.filter(
    (feature): feature is Feature<Polygon, AreaProps> =>
      feature.geometry.type === 'Polygon' && feature.properties?.type === type,
  );
}

export function formatAreaSize(squareMeters: number): string {
  return `${Math.round(squareMeters)}m²`;
}
