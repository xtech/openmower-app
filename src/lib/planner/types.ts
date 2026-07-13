// Types for the planner studio payload — the JSON-RPC `planCoverage`
// result produced by f2c_poc/plan_export.py. Hand-written (not run through
// genrpc) so the deeply-nested lineage stays readable and the call can use
// a longer-than-10s timeout.

export type Geometry = {
  type: 'line' | 'polygon' | 'point';
  coords: [number, number][];
};

export interface LineageOp {
  name: string;
  reason: string;
  params: Record<string, unknown>;
}

export interface LineageObject {
  id: string;
  stage: string;
  kind: string;
  geometry: Geometry;
  meta: Record<string, unknown>;
  parents: string[];
  op: LineageOp;
}

export interface LineageEvent {
  op: string;
  reason: string;
  inputs: string[];
  outputs: string[];
  params: Record<string, unknown>;
}

export interface Lineage {
  objects: LineageObject[];
  events: LineageEvent[];
}

export interface Stage {
  n: number;
  key: string;
  name: string;
  time_s: number;
  ids: string[];
}

export interface PlannerReport {
  hard: string[];
  soft: string[];
}

export interface PlannerDomains {
  area: [number, number][];
  obstacles: [number, number][][];
  nav_areas: [number, number][][];
  expected_cover_m2: number;
}

export interface PlannerPayload {
  angle_deg: number;
  params: Record<string, unknown>;
  stats: Record<string, unknown> & {
    stage_times?: Record<string, number>;
    plan_time_s?: number;
    double_mowed_pct?: number;
  };
  stage_times: Record<string, number>;
  report: PlannerReport;
  stages: Stage[];
  lineage: Lineage;
  domains: PlannerDomains;
}

// The spec sent as JSON-RPC params to planCoverage.
export interface PlannerSpec {
  area: [number, number][];
  obstacles: [number, number][][];
  nav_areas: [number, number][][];
  params: Record<string, unknown>;
}

// Per-object user feedback, keyed by object id, persisted in localStorage.
export type Comments = Record<string, string>;
