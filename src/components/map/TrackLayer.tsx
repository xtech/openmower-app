'use client';

import type { PastTrack } from '@/hooks/useJobTrack';
import { useTrackFeatures, type TrackFeatures } from '@/hooks/useTrackFeatures';
import { featureCollection, point } from '@turf/helpers';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import type { ExpressionSpecification, LineLayerSpecification } from 'maplibre-gl';
import { RLayer, RSource } from 'maplibre-react-components';
import { useMemo } from 'react';

const SHOW_TRACK_POINTS = false;

const linePaint: LineLayerSpecification['paint'] = {
  'line-color': '#fbb03b',
  'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 12, 1, 25, 2],
  'line-opacity': ['case', ['==', ['get', 'blades'], true], 1, 0.5] as ExpressionSpecification,
  'line-dasharray': ['case', ['==', ['get', 'blades'], true], ['literal', [1, 0]], ['literal', [3, 3]]],
};
const pointPaint = { 'circle-radius': 3, 'circle-color': '#1565C0', 'circle-opacity': 0.6 } as const;

const emptyLine: Feature<LineString> = {
  type: 'Feature',
  geometry: { type: 'LineString', coordinates: [] },
  properties: {},
};
const emptyLineCollection: FeatureCollection<LineString> = featureCollection([]);
const emptyPoints: FeatureCollection<Point> = featureCollection([]);

interface TrackLayerProps {
  visible?: boolean;
  pastTrack?: PastTrack | null;
  loading?: boolean;
}

export default function TrackLayer({ visible = true, pastTrack = null, loading = false }: TrackLayerProps) {
  const { live, history } = useTrackFeatures(pastTrack, loading);

  const visibility = visible ? 'visible' : 'none';
  const layout: LineLayerSpecification['layout'] = { 'line-join': 'round', 'line-cap': 'butt', visibility };

  return (
    <>
      <RSource id="track-history-source" type="geojson" data={history ?? emptyLineCollection} />
      <RLayer id="track-history-layer" source="track-history-source" type="line" layout={layout} paint={linePaint} />

      <RSource id="track-live-source" type="geojson" data={live ?? emptyLine} />
      <RLayer id="track-live-layer" source="track-live-source" type="line" layout={layout} paint={linePaint} />

      {SHOW_TRACK_POINTS && <TrackPointsLayer live={live} history={history} />}
    </>
  );
}

function TrackPointsLayer({ live, history }: TrackFeatures) {
  const livePoints = useMemo(() => (live ? lineToPoints(live) : emptyPoints), [live]);
  const historyPoints = useMemo(() => (history ? collectionToPoints(history) : emptyPoints), [history]);

  return (
    <>
      <RSource id="track-history-points-source" type="geojson" data={historyPoints} />
      <RLayer id="track-history-points-layer" source="track-history-points-source" type="circle" paint={pointPaint} />

      <RSource id="track-live-points-source" type="geojson" data={livePoints} />
      <RLayer id="track-live-points-layer" source="track-live-points-source" type="circle" paint={pointPaint} />
    </>
  );
}

function lineToPoints(line: Feature<LineString>): FeatureCollection<Point> {
  return featureCollection(line.geometry.coordinates.map((coord) => point(coord)));
}

function collectionToPoints(collection: FeatureCollection<LineString>): FeatureCollection<Point> {
  return featureCollection(collection.features.flatMap((f) => f.geometry.coordinates.map((coord) => point(coord))));
}
