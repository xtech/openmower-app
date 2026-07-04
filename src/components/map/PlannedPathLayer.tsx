'use client';

import type {Datum, PlannedPath} from '@/stores/schemas';
import {datumToRelative, pointToAbsolute} from '@/utils/coordinates';
import {featureCollection} from '@turf/helpers';
import type {Feature, FeatureCollection, LineString} from 'geojson';
import type {ExpressionSpecification, LineLayerSpecification} from 'maplibre-gl';
import {RLayer, RSource} from 'maplibre-react-components';
import {useMemo} from 'react';

type PathProps = {is_outline: boolean};

// Interior fill passes: solid grey. Outline (perimeter) passes: lighter, dashed.
const linePaint: LineLayerSpecification['paint'] = {
  'line-color': ['case', ['==', ['get', 'is_outline'], true], '#aaaaaa', '#888888'] as ExpressionSpecification,
  'line-width': 1.5,
  'line-opacity': ['case', ['==', ['get', 'is_outline'], true], 0.7, 0.8] as ExpressionSpecification,
  'line-dasharray': ['case', ['==', ['get', 'is_outline'], true], ['literal', [2, 2]], ['literal', [1, 0]]],
};

const emptyCollection: FeatureCollection<LineString, PathProps> = featureCollection([]);

interface PlannedPathLayerProps {
  visible?: boolean;
  datum: Datum | null;
  // The whole-job plan to draw (fetched from history for the current or a selected past job).
  plannedPath?: PlannedPath | null;
}

/**
 * Planned-path layer: renders the slic3r planned mowing path as grey lines in the map frame.
 * The plan is fetched from history (via useJobPlannedPath) for whichever job is shown -- current or
 * a selected past one -- so it stays visible after the job ends. Outline (perimeter) passes are
 * drawn lighter/dashed. Rendered declaratively as a GeoJSON FeatureCollection of LineStrings.
 */
export default function PlannedPathLayer({visible = true, datum, plannedPath = null}: PlannedPathLayerProps) {
  const data = useMemo<FeatureCollection<LineString, PathProps>>(() => {
    if (!plannedPath || !datum) return emptyCollection;
    const utm = datumToRelative([datum.long, datum.lat]);
    const features: Feature<LineString, PathProps>[] = plannedPath.paths
      .filter((path) => path.points.length >= 2)
      .map((path) => ({
        type: 'Feature',
        properties: {is_outline: path.is_outline},
        geometry: {
          type: 'LineString',
          coordinates: path.points.map(([x, y]) => pointToAbsolute({x, y}, utm)),
        },
      }));
    return featureCollection(features);
  }, [plannedPath, datum]);

  const visibility = visible ? 'visible' : 'none';
  const layout: LineLayerSpecification['layout'] = {'line-join': 'round', 'line-cap': 'round', visibility};

  return (
    <>
      <RSource id="planned-path-source" type="geojson" data={data} />
      <RLayer id="planned-path-layer" source="planned-path-source" type="line" layout={layout} paint={linePaint} />
    </>
  );
}
