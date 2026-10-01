type Point = { x: number; y: number };

function pointToSegmentDistSq(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ex = point.x - lineStart.x;
    const ey = point.y - lineStart.y;
    return ex * ex + ey * ey;
  }
  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq;
  const px = lineStart.x + t * dx;
  const py = lineStart.y + t * dy;
  const ex = point.x - px;
  const ey = point.y - py;
  return ex * ex + ey * ey;
}

export function rdpSimplify(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let maxDistSq = 0;
  let maxIdx = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const distSq = pointToSegmentDistSq(points[i], points[0], points[end]);
    if (distSq > maxDistSq) {
      maxDistSq = distSq;
      maxIdx = i;
    }
  }

  const epsilonSq = epsilon * epsilon;
  if (maxDistSq > epsilonSq) {
    const left = rdpSimplify(points.slice(0, maxIdx + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[end]];
}
