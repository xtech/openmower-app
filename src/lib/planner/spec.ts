// Build a planner spec {area, obstacles, nav_areas, params} from either an
// OpenMower map (schemas.ts MapData) or a raw PoC spec, plus a couple of
// built-in examples so the studio is usable without a connected mower.

import type {MapData} from '@/stores/schemas';
import type {PlannerSpec} from './types';

export const DEFAULT_PARAMS: Record<string, number | string | number[] | null> = {
  robot_width: 0.7,
  tool_width: 0.5,
  headland_rounds: 3,
  fill_overlap_rounds: 1.0,
  min_turning_radius: 0.2,
  disk_lateral_offset: 0.0,
  mow_pass_margin: 0.2,
  bend_max_dev: 0.8,
  merge_max_gap: 6.0,
  transit_wall_fade: 0.375,
  transit_wall_risk: 2.0,
  transit_grid_step: 2.5,
  ring_order: 'first',
  order: 'greedy',
  // angle_deg omitted => auto; start_point set from a docking station.
};

const ring = (pts: {x: number; y: number}[]): [number, number][] =>
  pts.map((p) => [p.x, p.y]);

export interface MowChoice {
  id: string;
  name: string;
}

// List the selectable mow areas of a map (import-all, plan-one).
export function mowAreas(map: MapData): MowChoice[] {
  return map.areas
    .filter((a) => a.properties.type === 'mow')
    .map((a) => ({id: a.id, name: a.properties.name || a.id}));
}

// Convert a map + chosen mow area into a planner spec. Obstacles and nav
// areas apply globally. `params` from the panel is the source of truth;
// the caller may pre-seed it from the area's properties.
export function buildSpecFromMap(
  map: MapData,
  activeAreaId: string,
  params: Record<string, unknown>,
): PlannerSpec {
  const active = map.areas.find((a) => a.id === activeAreaId);
  if (!active) throw new Error('active mow area not found');
  const obstacles = map.areas
    .filter((a) => a.properties.type === 'obstacle')
    .map((a) => ring(a.outline));
  const nav_areas = map.areas
    .filter((a) => a.properties.type === 'nav')
    .map((a) => ring(a.outline));
  const p: Record<string, unknown> = {...params};
  if (p.start_point == null && map.docking_stations.length > 0) {
    const d = map.docking_stations[0].position;
    p.start_point = [d.x, d.y];
  }
  return {area: ring(active.outline), obstacles, nav_areas, params: p};
}

// Detect and normalize an imported JSON file: either a PoC spec
// {area,...} or an OpenMower map {areas,...}. Returns the spec plus the
// mow choices (a PoC spec has a single implicit "area").
export function specFromImport(
  json: unknown,
  params: Record<string, unknown>,
): {spec: PlannerSpec; label: string} {
  const obj = json as Record<string, unknown>;
  if (Array.isArray(obj.area)) {
    // already a PoC spec; merge its params under the panel's
    const merged = {...params, ...((obj.params as object) || {})};
    return {
      spec: {
        area: obj.area as [number, number][],
        obstacles: (obj.obstacles as [number, number][][]) || [],
        nav_areas: (obj.nav_areas as [number, number][][]) || [],
        params: merged,
      },
      label: 'imported PoC spec',
    };
  }
  throw new Error('use an OpenMower map via the store, or a PoC spec JSON');
}

export interface Example {
  name: string;
  spec: PlannerSpec;
}

export const EXAMPLES: Example[] = [
  {
    name: 'Rectangle + tree',
    spec: {
      area: [
        [0, 0],
        [20, 0],
        [20, 14],
        [0, 14],
      ],
      obstacles: [
        [
          [8, 6],
          [12, 6],
          [12, 9],
          [8, 9],
        ],
      ],
      nav_areas: [],
      params: {...DEFAULT_PARAMS, angle_deg: 0, start_point: [0.5, 0.5]},
    },
  },
  {
    name: 'L-shape (auto angle)',
    spec: {
      area: [
        [0, 0],
        [24, 0],
        [24, 8],
        [10, 8],
        [10, 18],
        [0, 18],
      ],
      obstacles: [],
      nav_areas: [],
      params: {...DEFAULT_PARAMS, start_point: [0.5, 0.5]},
    },
  },
];
