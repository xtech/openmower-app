import {AreaProps} from '@/stores/schemas';
import {area as turfArea} from '@turf/area';
import {multiPolygon, polygon} from '@turf/helpers';
import {Feature, Polygon, type MultiPolygon} from 'geojson';

export const getBiggestArea = (areas: Feature<Polygon, AreaProps>[]) => {
  if (areas.length === 0) return null;
  return areas.reduce(
    (max, curr) => {
      const currArea = turfArea(curr);
      return currArea > max.area ? {feature: curr, area: currArea} : max;
    },
    {feature: areas[0], area: turfArea(areas[0])},
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
