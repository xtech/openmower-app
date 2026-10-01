type Point = { x: number; y: number };

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % (2 * Math.PI);
  return d > Math.PI ? 2 * Math.PI - d : d;
}

/**
 * Decimate a sequence of points, keeping a point only when:
 *  - it moved more than `distThreshold` metres from the last kept point, OR
 *  - the heading changed by more than `headingThresholdRad` (only checked when
 *    movement exceeds `noiseDistThreshold` to avoid noise-induced false triggers), OR
 *  - `heartbeatPoints` points have passed without keeping one (heartbeat).
 */
export function decimateFilter(
  points: Point[],
  distThreshold: number,
  noiseDistThreshold: number,
  headingThresholdRad: number,
  heartbeatPoints: number,
): Point[] {
  if (points.length === 0) return [];
  const out: Point[] = [points[0]];
  let lastHeading: number | null = null;
  let pointsSinceKept = 0;

  const distThresholdSq = distThreshold * distThreshold;
  const noiseDistThresholdSq = noiseDistThreshold * noiseDistThreshold;

  for (let i = 1; i < points.length; i++) {
    const last = out[out.length - 1];
    const curr = points[i];
    pointsSinceKept++;

    const dx = curr.x - last.x;
    const dy = curr.y - last.y;
    const distSq = dx * dx + dy * dy;

    // Only compute/check heading when we've moved enough to trust the vector.
    let heading: number | null = lastHeading;
    let headingChanged = false;
    if (distSq > noiseDistThresholdSq) {
      heading = Math.atan2(dy, dx);
      headingChanged = lastHeading !== null && angleDiff(lastHeading, heading) > headingThresholdRad;
    }

    if (distSq > distThresholdSq || headingChanged || pointsSinceKept >= heartbeatPoints) {
      out.push(curr);
      lastHeading = heading;
      pointsSinceKept = 0;
    }
  }

  return out;
}
