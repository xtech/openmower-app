'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import type {LineageObject, PlannerPayload, Comments} from '@/lib/planner/types';

// colours mirror f2c_poc/poc_slicer.py stage PNGs
const CAT = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b',
  '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

function colorOf(o: LineageObject): string {
  switch (o.kind) {
    case 'ring':
      return '#e8873b';
    case 'fragment':
      return '#3aa63a';
    case 'lane': {
      const k = (o.meta.kind as string) || 'straight';
      return k === 'merged' ? '#1f77b4' : k === 'bent' ? '#ff7f0e' : '#2ca02c';
    }
    case 'block':
      return CAT[((o.meta.order_index as number) || 0) % CAT.length];
    case 'island':
      return '#17becf';
    case 'uturn':
      return '#d62728';
    case 'transit':
      return '#1f77b4';
    case 'pinch':
      return '#9467bd';
    case 'uncovered':
      return '#d62728';
    default:
      return '#555';
  }
}

interface Box {
  minx: number;
  miny: number;
  w: number;
  h: number;
}

function bounds(payload: PlannerPayload): Box {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  const eat = (pts: [number, number][]) => {
    for (const [x, y] of pts) {
      minx = Math.min(minx, x); miny = Math.min(miny, y);
      maxx = Math.max(maxx, x); maxy = Math.max(maxy, y);
    }
  };
  eat(payload.domains.area);
  for (const o of payload.lineage.objects) eat(o.geometry.coords);
  if (!isFinite(minx)) return {minx: 0, miny: 0, w: 10, h: 10};
  const pad = Math.max(1, (maxx - minx) * 0.05);
  return {minx: minx - pad, miny: miny - pad,
    w: maxx - minx + 2 * pad, h: maxy - miny + 2 * pad};
}

const d = (pts: [number, number][]) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');

export default function StageViewer({
  payload, stageKey, selectedId, onSelect, comments,
}: {
  payload: PlannerPayload;
  stageKey: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  comments: Comments;
}) {
  const objById = useMemo(() => {
    const m = new Map<string, LineageObject>();
    for (const o of payload.lineage.objects) m.set(o.id, o);
    return m;
  }, [payload]);
  const stage = payload.stages.find((s) => s.key === stageKey);
  const active = (stage?.ids ?? []).map((id) => objById.get(id)!).filter(Boolean);

  const initial = useMemo(() => bounds(payload), [payload]);
  const [view, setView] = useState<Box>(initial);
  useEffect(() => setView(initial), [initial]);

  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{x: number; y: number; box: Box} | null>(null);

  const viewBox = `${view.minx} ${-(view.miny + view.h)} ${view.w} ${view.h}`;

  const toWorld = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    const fx = (clientX - r.left) / r.width;
    const fy = (clientY - r.top) / r.height;
    return {x: view.minx + fx * view.w, y: view.miny + (1 - fy) * view.h};
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const f = e.deltaY > 0 ? 1.12 : 1 / 1.12;
    const w = toWorld(e.clientX, e.clientY);
    setView((v) => ({
      minx: w.x - (w.x - v.minx) * f,
      miny: w.y - (w.y - v.miny) * f,
      w: v.w * f,
      h: v.h * f,
    }));
  };
  const onDown = (e: React.PointerEvent) => {
    drag.current = {x: e.clientX, y: e.clientY, box: view};
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const r = svgRef.current!.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.x) / r.width) * view.w;
    const dy = ((e.clientY - drag.current.y) / r.height) * view.h;
    setView({...drag.current.box,
      minx: drag.current.box.minx - dx,
      miny: drag.current.box.miny + dy});
  };
  const onUp = () => (drag.current = null);

  const strokeW = (o: LineageObject) => (o.id === selectedId ? 4 : o.kind === 'fragment' ? 1 : 2);

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      onWheel={onWheel}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onClick={(e) => {
        if (e.target === svgRef.current) onSelect(null);
      }}
      style={{width: '100%', height: '100%', background: '#fafafa',
        touchAction: 'none', cursor: drag.current ? 'grabbing' : 'grab'}}
    >
      <g transform="scale(1,-1)">
        {/* domains: nav fill, then area + obstacle outlines */}
        {payload.domains.nav_areas.map((nv, i) => (
          <path key={`nav${i}`} d={d(nv) + ' Z'} fill="#00000014" stroke="#aaa"
            strokeDasharray="0.3 0.2" strokeWidth={1}
            vectorEffect="non-scaling-stroke" />
        ))}
        <path d={d(payload.domains.area) + ' Z'} fill="none" stroke="#111"
          strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {payload.domains.obstacles.map((ob, i) => (
          <path key={`ob${i}`} d={d(ob) + ' Z'} fill="#00000010" stroke="#111"
            strokeWidth={2} vectorEffect="non-scaling-stroke" />
        ))}

        {/* active-stage features, clickable */}
        {active.map((o) => {
          const poly = o.geometry.type === 'polygon';
          const path = d(o.geometry.coords) + (poly ? ' Z' : '');
          const col = colorOf(o);
          const sel = o.id === selectedId;
          const dashed = o.kind === 'transit';
          return (
            <g key={o.id} style={{cursor: 'pointer'}}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(o.id);
              }}>
              {/* fat transparent hit target */}
              <path d={path} fill="none" stroke="transparent" strokeWidth={12}
                vectorEffect="non-scaling-stroke" />
              <path d={path}
                fill={o.kind === 'uncovered' ? '#d6272866' : 'none'}
                stroke={col}
                strokeWidth={strokeW(o)}
                strokeDasharray={dashed ? '4 3' : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity={sel ? 1 : 0.92} />
              {comments[o.id]?.trim() && (
                <path d={path} fill="none" stroke="#ffb300" strokeWidth={7}
                  strokeOpacity={0.5} vectorEffect="non-scaling-stroke" />
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
