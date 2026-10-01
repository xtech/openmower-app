import { useMapContext } from '@/contexts/MapContext';
import { type PastTrack } from '@/hooks/useJobTrack';
import { useSelectedMower } from '@/stores/mowersStore';
import { type TrackAttributes } from '@/stores/schemas';
import {
  datumToRelative,
  pointToAbsolute,
  type AbsolutePoint,
  type RelativePoint,
  type UtmPoint,
} from '@/utils/coordinates';
import { type TrackSegment } from '@/utils/track-pipeline';
import { lineString } from '@turf/helpers';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import { useMemo, useRef } from 'react';

export interface TrackFeatures {
  live: Feature<LineString> | null;
  history: FeatureCollection<LineString> | null;
}

class TrackCache {
  private historyFeatures: Feature<LineString>[] = [];
  private historyCollection: FeatureCollection<LineString> | null = null;
  private liveCoords: AbsolutePoint[] = [];
  private lastLiveFeature: Feature<LineString> | null = null;

  constructor(private _datum: UtmPoint) {}

  get datum(): UtmPoint {
    return this._datum;
  }

  sync(buffer: RelativePoint[], historySegments: TrackSegment[], liveAttributes: TrackAttributes): TrackFeatures {
    const convert = (p: RelativePoint): AbsolutePoint => pointToAbsolute(p, this._datum);
    const history = this.syncHistory(historySegments, convert);
    const live = this.syncLive(buffer, liveAttributes, historySegments, convert);
    return { live, history };
  }

  private syncHistory(
    historySegments: TrackSegment[],
    convert: (p: RelativePoint) => AbsolutePoint,
  ): FeatureCollection<LineString> | null {
    let changed = false;

    if (historySegments.length !== this.historyFeatures.length) {
      this.historyFeatures.length = historySegments.length;
      changed = true;
    }

    for (let i = 0; i < historySegments.length; i++) {
      const seg = historySegments[i];
      const cachedCoords = this.historyFeatures[i]?.geometry.coordinates as AbsolutePoint[] | undefined;
      const cachedLen = cachedCoords?.length ?? 0;
      const newLen = seg.points.length;

      if (newLen === cachedLen && this.historyFeatures[i]) {
        continue; // Unchanged — keep existing reference
      }

      let coords: AbsolutePoint[];
      if (newLen > cachedLen && cachedCoords) {
        coords = [...cachedCoords, ...seg.points.slice(cachedLen).map(convert)]; // Grew — append only new tail
      } else {
        coords = seg.points.map(convert); // Shrunk, new, or no cached data — rebuild
      }

      if (coords.length >= 2) {
        this.historyFeatures[i] = lineString(coords, seg.attributes);
      } else {
        delete this.historyFeatures[i];
      }
      changed = true;
    }

    if (changed) {
      const features = this.historyFeatures.filter(
        (f): f is Feature<LineString> => f != null && f.geometry.coordinates.length >= 2,
      );
      this.historyCollection = features.length === 0 ? null : { type: 'FeatureCollection', features };
    }

    return this.historyCollection;
  }

  private syncLive(
    buffer: RelativePoint[],
    liveAttributes: TrackAttributes,
    historySegments: TrackSegment[],
    convert: (p: RelativePoint) => AbsolutePoint,
  ): Feature<LineString> | null {
    const cachedLen = this.liveCoords.length;
    const newLen = buffer.length;

    if (newLen > cachedLen) {
      this.liveCoords = [...this.liveCoords, ...buffer.slice(cachedLen).map(convert)]; // Grew — append only new tail
    } else if (newLen < cachedLen) {
      this.liveCoords = buffer.map(convert); // Shrunk (compaction) — rebuild
    }
    // Equal length: liveCoords is still valid

    // Live feature is always re-wrapped so the bridge prefix and properties
    // are always up to date (O(1) — reuses cached coords array).
    const lastSegLastPoint = historySegments.at(-1)?.points.at(-1);
    const lastHistoryPoint = lastSegLastPoint ? convert(lastSegLastPoint) : undefined;
    const liveWithBridge = lastHistoryPoint ? [lastHistoryPoint, ...this.liveCoords] : this.liveCoords;
    const live = liveWithBridge.length >= 2 ? lineString(liveWithBridge, liveAttributes) : null;
    if (live !== null) this.lastLiveFeature = live;
    // Fall back to the last valid live feature to avoid a flash of missing track
    // during the brief gap after a buffer flush (0–1 points).
    return live ?? this.lastLiveFeature;
  }
}

export function useTrackFeatures(pastTrack: PastTrack | null = null, loading = false): TrackFeatures {
  const buffer = useSelectedMower((s) => s?.track.buffer ?? ([] as RelativePoint[]));
  const historySegments = useSelectedMower((s) => s?.track.historySegments ?? ([] as TrackSegment[]));
  const liveAttributes = useSelectedMower((s) => s?.track.attributes ?? ({ blades: false } as TrackAttributes));

  const { datumOrFallback } = useMapContext();
  const utmDatum = useMemo(() => datumToRelative([datumOrFallback.long, datumOrFallback.lat]), [datumOrFallback]);

  // Track the job identity the cache was built for: null means live job.
  const cacheJobId = useRef<string | null | undefined>(undefined);

  // Reset the cache when the datum changes or when switching between jobs
  // (including switching between live and any historical job). Without this,
  // stale segment coordinates from the previous job bleed into the new one.
  const cache = useRef<TrackCache>(null);
  const jobId = pastTrack?.jobId ?? null;
  if (!cache.current || cache.current.datum !== utmDatum || cacheJobId.current !== jobId) {
    cache.current = new TrackCache(utmDatum);
    cacheJobId.current = jobId;
  }

  // While switching jobs, show nothing.
  if (loading) {
    return { live: null, history: null };
  }

  // When a historical job is selected, render only its segments with no live buffer.
  if (pastTrack !== null) {
    return cache.current.sync([], pastTrack.segments, { blades: false } as TrackAttributes);
  }

  // useMemo is intentionally omitted: sync() is cheap (incremental),
  // and calling it on every render is simpler and avoids stale-closure risks.
  return cache.current.sync(buffer, historySegments, liveAttributes);
}
