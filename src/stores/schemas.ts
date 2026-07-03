import {z} from 'zod/v4';

////////////////////////////////////////////////////////////////////////////////////////////////////
// Capabilities
////////////////////////////////////////////////////////////////////////////////////////////////////

// Simple string to unsigned integer map
export const capabilitiesSchema = z.record(z.string(), z.int().gte(1));
export type Capabilities = z.infer<typeof capabilitiesSchema>;

////////////////////////////////////////////////////////////////////////////////////////////////////
// State
////////////////////////////////////////////////////////////////////////////////////////////////////

const numericBoolean = z.union([z.literal(0), z.literal(1)]).transform((v) => v === 1);
const percentage = z
  .number()
  .min(0)
  .max(1)
  .transform((v) => Math.round(v * 100));

const gpsPercentage = z
  .number()
  .max(1)
  .transform((v) => Math.round(Math.max(0, v) * 100));

export const stateSchema = z.object({
  battery_percentage: percentage,
  current_state: z.string(),
  current_action_progress: z.number(),
  current_area: z.number(),
  current_path: z.number(),
  current_path_index: z.number(),
  current_sub_state: z.string(),
  emergency: numericBoolean,
  gps_percentage: gpsPercentage,
  is_charging: numericBoolean,
  pose: z.object({
    heading: z.number(),
    heading_accuracy: z.number(),
    heading_valid: numericBoolean,
    pos_accuracy: z.number(),
    x: z.number(),
    y: z.number(),
  }),
});

export type State = z.infer<typeof stateSchema>;
export type StateOptionalPose = Omit<State, 'pose'> & {pose?: State['pose']};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Simulation control (from sim/state/json topic and sim.* RPCs)
////////////////////////////////////////////////////////////////////////////////////////////////////

export const simStateSchema = z.object({
  emergency_active: z.boolean(),
  emergency_latch: z.boolean(),
  emergency_reason: z.number().int(),
  movement_allowed: z.boolean(),
  gps_good: z.boolean(),
  battery_voltage: z.number(),
  charging: z.boolean(),
  twist_override: z.boolean(),
  override_linear: z.number(),
  override_angular: z.number(),
});

export type SimState = z.infer<typeof simStateSchema>;

////////////////////////////////////////////////////////////////////////////////////////////////////
// Map
////////////////////////////////////////////////////////////////////////////////////////////////////

export const datumSchema = z.object({
  lat: z.number(),
  long: z.number(),
  height: z.number(),
});
export type Datum = z.infer<typeof datumSchema>;

const pointSchema = z.object({x: z.number(), y: z.number()});
const polygonSchema = z.array(pointSchema);
const areaSchema = z.object({
  id: z.string(),
  properties: z.looseObject({
    name: z.string().optional(),
    type: z.enum(['mow', 'nav', 'obstacle', 'draft']).default('draft'),
    active: z.boolean().default(true),
  }),
  outline: polygonSchema,
});
export type Area = z.infer<typeof areaSchema>;
export type AreaProps = Area['properties'];
export type AreaType = AreaProps['type'];

const dockingStationSchema = z.object({
  id: z.string(),
  properties: z.object({
    name: z.string().optional(),
    active: z.boolean().default(true),
  }),
  position: pointSchema,
  heading: z.number(),
});

export const mapSchema = z.object({
  datum: datumSchema.optional(),
  areas: z.array(areaSchema),
  docking_stations: z.array(dockingStationSchema),
});

export type MapData = z.infer<typeof mapSchema>;

////////////////////////////////////////////////////////////////////////////////////////////////////
// Legacy map
////////////////////////////////////////////////////////////////////////////////////////////////////

export const legacyAreaSchema = z.object({
  name: z.string(),
  obstacles: z.array(polygonSchema).nullable(),
  outline: polygonSchema,
});

export const legacyMapSchema = z.object({
  datum: datumSchema.optional(),
  docking_pose: z.object({
    heading: z.number().nullable(),
    x: z.number(),
    y: z.number(),
  }),
  meta: z.object({
    mapCenterX: z.number(),
    mapCenterY: z.number(),
    mapHeight: z.number(),
    mapWidth: z.number(),
  }),
  navigation_areas: z.array(legacyAreaSchema).nullable(),
  working_areas: z.array(legacyAreaSchema).nullable(),
});

export type LegacyArea = z.infer<typeof legacyAreaSchema>;
export type LegacyMapData = z.infer<typeof legacyMapSchema>;

////////////////////////////////////////////////////////////////////////////////////////////////////
// Position (from position/json topic)
////////////////////////////////////////////////////////////////////////////////////////////////////

export const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
  heading: z.number(),
  attributes: z.object({
    job_id: z.string(),
    session_id: z.string(),
    blades: z.boolean(),
  }),
});

export type PositionWithAttributes = z.infer<typeof positionSchema>;
export type Position = Omit<PositionWithAttributes, 'attributes'>;
export type TrackAttributes = PositionWithAttributes['attributes'];

////////////////////////////////////////////////////////////////////////////////////////////////////
// Events (from events/json topic and events.history RPC)
////////////////////////////////////////////////////////////////////////////////////////////////////

const baseEventSchema = z.looseObject({
  id: z.string(),
  t: z.number(),
  type: z.string(),
  x: z.number().optional(),
  y: z.number().optional(),
  job_id: z.string().optional(),
  session_id: z.string().optional(),
});

export const eventSchema = z.union([
  z.discriminatedUnion('type', [
    baseEventSchema.extend({type: z.literal('EMERGENCY'), active: z.boolean()}),
    baseEventSchema.extend({type: z.literal('BOOTED')}),
    baseEventSchema.extend({type: z.literal('GPS'), available: z.boolean()}),
    baseEventSchema.extend({type: z.literal('STATE'), state: z.string()}),
    baseEventSchema.extend({type: z.literal('BLADES'), enabled: z.boolean()}),
    baseEventSchema.extend({type: z.literal('DOCKING'), reason: z.string()}),
    baseEventSchema.extend({
      type: z.literal('AREA'),
      area_id: z.string(),
      area_name: z.string(),
    }),
  ]),
  baseEventSchema,
]);

export type MowerEvent = z.infer<typeof eventSchema>;

export const BASE_EVENT_KEYS = new Set(Object.keys(baseEventSchema.shape));

////////////////////////////////////////////////////////////////////////////////////////////////////
// Defaults
////////////////////////////////////////////////////////////////////////////////////////////////////

export const mapDefaults: MapData = {
  datum: undefined,
  areas: [],
  docking_stations: [],
};

export const fallbackDatum = {lat: 48.0, long: 11.0, height: 0} satisfies Datum;

export const stateDefaults: StateOptionalPose = {
  battery_percentage: 100,
  current_action_progress: 0.0,
  current_area: -1,
  current_path: -1,
  current_path_index: -1,
  current_state: 'UNKNOWN',
  current_sub_state: '',
  emergency: false,
  gps_percentage: 0.0,
  is_charging: false,
  pose: undefined,
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// ROS params
////////////////////////////////////////////////////////////////////////////////////////////////////

export const rosParamsSchema = z
  .object({
    '/ll/services/power/battery_full_voltage': z.number(),
    '/ll/services/power/battery_empty_voltage': z.number(),
    '/ll/services/power/battery_critical_voltage': z.number(),
    '/ll/services/power/battery_critical_high_voltage': z.number(),
    '/ll/services/gps/datum_lat': z.number(),
    '/ll/services/gps/datum_long': z.number(),
    '/ll/services/gps/datum_height': z.number(),
  })
  .partial()
  .catchall(z.unknown());

export type RosParams = z.infer<typeof rosParamsSchema>;
