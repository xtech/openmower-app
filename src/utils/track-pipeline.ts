import { type PositionWithAttributes, type TrackAttributes } from '@/stores/schemas';
import { type RelativePoint } from '@/utils/coordinates';
import { decimateFilter } from '@/utils/decimate';
import { rdpSimplify } from '@/utils/rdp';
import { immerable } from 'immer';

/*
 * Two-layer GPS track pipeline: "Live" (raw) + "History" (simplified).
 *
 * Positions are pre-processed by a median filter on the mower, so they're
 * relatively smooth. They arrive every ~150 ms and are appended to a raw
 * buffer that renders as the live layer.
 *
 * To avoid a gap between layers, the live line is prefixed with the last
 * vertex of the history.
 *
 * The history is a list of segments, each carrying its own attributes
 * (e.g. bladesOn). When attributes change, the current buffer is force-flushed
 * under the old attributes and a new segment is started whose first point
 * duplicates the previous segment's last point (bridge vertex) so segments
 * connect without gaps or overdraw.
 *
 * When the live buffer exceeds COMPACTION_THRESHOLD, the oldest ~80% of
 * points are moved into the history through two reduction passes:
 *
 *   1. Decimation — drops points that are close together and on the
 *      same heading, keeping those where distance or heading change is
 *      significant. A heartbeat guarantees at least every 10th point is kept.
 *   2. Ramer-Douglas-Peucker — further reduces the decimated result by
 *      removing points that don't deviate from the simplified line.
 *
 * Both passes run on the full buffer with the last point of the history
 * prepended. This gives them extra context to steer the simplification
 * toward better curves at the boundaries. Afterward, only points that
 * originated from the oldest 80% are kept; the prefix and suffix points
 * are discarded from the simplified result so they aren't added to the
 * history prematurely.
 *
 * All points in the pipeline are stored as RelativePoint (x/y offsets from
 * the UTM datum). Conversion to absolute/GeoJSON coordinates happens
 * exclusively in useTrackLayers.ts.
 */

// --- Compaction ---
const COMPACTION_THRESHOLD = 60; // Threshold to move raw points to history
const CONTEXT_WINDOW = 10; // Padded window for RDP boundary stability

// --- Decimation ---
const DIST_THRESHOLD = 0.1; // 10 cm — minimum movement to keep a point
const NOISE_DIST_THRESHOLD = 0.03; // 3 cm — minimum movement to trust heading vector
const HEADING_THRESHOLD_RAD = 8 * (Math.PI / 180); // 8° heading change
const HEARTBEAT_POSITIONS = 10;

// --- RDP ---
const RDP_EPSILON = 0.01; // 1 cm — stay fairly close to the original path

export interface TrackSegment {
  points: RelativePoint[];
  attributes: TrackAttributes;
}

export class TrackPipeline {
  [immerable] = true;
  buffer: RelativePoint[] = [];
  historySegments: TrackSegment[] = [];
  attributes: TrackAttributes = { job_id: '', session_id: '', blades: false };

  seedFromHistory(
    segments: { attributes: TrackAttributes; points: [number, number][] }[],
    buffer: [number, number][],
  ): void {
    this.historySegments = segments.map((seg) => ({
      attributes: { ...seg.attributes },
      points: seg.points.map(([x, y]) => ({ x, y })),
    }));
    this.buffer = buffer.map(([x, y]) => ({ x, y }));
    this.attributes = segments.at(-1)?.attributes ?? { job_id: '', session_id: '', blades: false };
  }

  addPoint(position: PositionWithAttributes): void {
    if (position.attributes.job_id !== this.attributes.job_id && this.attributes.job_id !== '') {
      this.buffer = [];
      this.historySegments = [];
    } else if (!this._attributesMatch(this.attributes, position.attributes)) {
      this.compact(true); // flush remaining buffer under OLD attributes
    }
    this.attributes = position.attributes;
    this.buffer.push({ x: position.x, y: position.y });
    if (this.buffer.length > COMPACTION_THRESHOLD) {
      this.compact();
    }
  }

  /**
   * Moves points from buffer into simplified historySegments.
   */
  private compact(flushAll = false): void {
    if (this.buffer.length <= CONTEXT_WINDOW && !flushAll) return;
    const main = flushAll ? this.buffer : this.buffer.slice(0, -CONTEXT_WINDOW);
    let suffix = flushAll ? [] : this.buffer.slice(-CONTEXT_WINDOW);

    // Prefix: reach back to the last segment's tail to ensure RDP continuity
    const lastSeg = this.historySegments[this.historySegments.length - 1];
    let prefix: RelativePoint[] = [];
    if (lastSeg && lastSeg.points.length > 0) {
      prefix = [lastSeg.points[lastSeg.points.length - 1]];
    }

    // Points must be spread by reference (see object-identity comment below).
    const window = [...prefix, ...main, ...suffix];
    if (window.length < 2) {
      this.buffer = suffix;
      return;
    }

    const decimated = decimateFilter(
      window,
      DIST_THRESHOLD,
      NOISE_DIST_THRESHOLD,
      HEADING_THRESHOLD_RAD,
      HEARTBEAT_POSITIONS,
    );
    const simplified = rdpSimplify(decimated, RDP_EPSILON);
    // Object-identity filter: mainSet and the simplified array must share the
    // same RelativePoint references — do NOT reconstruct points (e.g. via map
    // or spread) between building `main` and building `window`, or the Set
    // lookup will never match and committed will always be empty.
    const mainSet = new Set(main);
    const committed = simplified.filter((p) => mainSet.has(p));

    if (committed.length > 0) {
      if (lastSeg && this._attributesMatch(lastSeg.attributes, this.attributes)) {
        lastSeg.points.push(...committed);
      } else {
        // Start new segment + bridge the gap to previous segment
        const lastPoint = lastSeg?.points.at(-1);
        const bridge = lastPoint ? [lastPoint] : [];
        const points = [...bridge, ...committed];
        if (points.length >= 2) {
          this.historySegments.push({ points, attributes: { ...this.attributes } });
        } else {
          // Not enough points to form a renderable segment yet; leave committed
          // points in the suffix so they accumulate with the next batch.
          suffix = [...committed, ...suffix];
        }
      }
    }

    this.buffer = suffix;
  }

  private _attributesMatch(a: TrackAttributes, b: TrackAttributes): boolean {
    return a.blades === b.blades;
  }
}
