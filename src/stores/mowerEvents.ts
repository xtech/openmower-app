import { BASE_EVENT_KEYS, type MowerEvent } from './schemas';

export interface MowerEventState {
  eventsByDate: Record<string, MowerEvent[]>;
  availableDates: string[];
  loadedDates: Record<string, true>;
  seenEventIds: Record<string, true>;
}

export const mowerEventDefaults: MowerEventState = {
  eventsByDate: {},
  availableDates: [],
  loadedDates: {},
  seenEventIds: {},
};

export function getTodayDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function sortEvents(events: MowerEvent[]): MowerEvent[] {
  return [...events].sort((a, b) => b.t - a.t);
}

function upsertEvents(state: MowerEventState, date: string, events: MowerEvent[]): void {
  const bucket = state.eventsByDate[date] ?? [];
  const existingIds = new Set(bucket.map((event) => event.id));

  for (const event of events) {
    if (existingIds.has(event.id) || state.seenEventIds[event.id]) {
      continue;
    }
    bucket.push(event);
    existingIds.add(event.id);
    state.seenEventIds[event.id] = true;
  }

  state.eventsByDate[date] = sortEvents(bucket);
}

export function applyLiveEvent(state: MowerEventState, event: MowerEvent): void {
  upsertEvents(state, getTodayDateKey(), [event]);
}

export function seedTodayEvents(state: MowerEventState, events: MowerEvent[]): void {
  upsertEvents(state, getTodayDateKey(), events);
  state.loadedDates[getTodayDateKey()] = true;
}

export function seedHistoryEvents(state: MowerEventState, date: string, events: MowerEvent[]): void {
  upsertEvents(state, date, events);
  state.loadedDates[date] = true;
}

export function setAvailableDates(state: MowerEventState, dates: string[]): void {
  state.availableDates = [...dates].sort().reverse();
}

const EVENT_ATTRIBUTE_LABELS: Record<string, string> = {
  active: 'Active',
  available: 'available',
  state: 'state',
  enabled: 'enabled',
  reason: 'reason',
  area_id: 'area_id',
  area_name: 'area_name',
  job_id: 'Job',
  session_id: 'Session',
  x: 'X',
  y: 'Y',
};

const KNOWN_ATTRIBUTE_ORDER = Object.keys(EVENT_ATTRIBUTE_LABELS);

/** Known event types in lifecycle order; extend as new types are modeled. */
export const KNOWN_EVENT_TYPE_ORDER = ['BOOTED', 'GPS', 'STATE', 'AREA', 'BLADES', 'DOCKING', 'EMERGENCY'] as const;

export function getEventExtraAttributes(event: MowerEvent): Record<string, unknown> {
  return Object.fromEntries(Object.entries(event).filter(([key]) => !BASE_EVENT_KEYS.has(key)));
}

export function getOrderedEventExtraAttributeEntries(event: MowerEvent): [string, unknown][] {
  const attrs = getEventExtraAttributes(event);
  const known = KNOWN_ATTRIBUTE_ORDER.flatMap((key) => (key in attrs ? [[key, attrs[key]] as [string, unknown]] : []));
  const unknown = Object.entries(attrs)
    .filter(([key]) => !KNOWN_ATTRIBUTE_ORDER.includes(key))
    .sort(([a], [b]) => a.localeCompare(b));
  return [...known, ...unknown].filter(([key]) => !isEventTitleAttribute(event, key));
}

/** Attributes already reflected in {@link getEventLabel}; omit from chips. */
function isEventTitleAttribute(event: MowerEvent, key: string): boolean {
  switch (event.type) {
    case 'EMERGENCY':
      return key === 'active';
    case 'GPS':
      return key === 'available';
    case 'STATE':
      return key === 'state';
    case 'BLADES':
      return key === 'enabled';
    case 'DOCKING':
      return key === 'reason';
    case 'AREA':
      return key === 'area_name' || key === 'area_id';
    default:
      return false;
  }
}

export function sortEventTypes(types: string[]): string[] {
  const knownSet = new Set<string>(KNOWN_EVENT_TYPE_ORDER);
  const known = KNOWN_EVENT_TYPE_ORDER.filter((type) => types.includes(type));
  const unknown = types.filter((type) => !knownSet.has(type)).sort((a, b) => a.localeCompare(b));
  return [...known, ...unknown];
}

export function getEventAttributeLabel(key: string): string {
  return EVENT_ATTRIBUTE_LABELS[key] ?? key;
}

export function formatEventAttributeValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'yes' : 'no';
  }
  if (value === null || value === undefined) {
    return String(value);
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function formatEventAttributeChip(key: string, value: unknown): string {
  return `${getEventAttributeLabel(key)}: ${formatEventAttributeValue(value)}`;
}

const STATE_LABELS: Record<string, string> = {
  IDLE: 'Idle',
  DOCKING: 'Docking',
  MOWING: 'Mowing',
  UNDOCKING: 'Undocking',
};

function getStateLabel(state: string): string {
  return STATE_LABELS[state] ?? state;
}

export function getEventLabel(event: MowerEvent): string {
  switch (event.type) {
    case 'EMERGENCY':
      return event.active ? 'Emergency active' : 'Emergency cleared';
    case 'BOOTED':
      return 'Mower started';
    case 'GPS':
      return event.available ? 'GPS available' : 'GPS unavailable';
    case 'STATE': {
      return event.state ? `State changed to "${getStateLabel(String(event.state))}"` : 'State changed';
    }
    case 'BLADES':
      return event.enabled ? 'Blades on' : 'Blades off';
    case 'DOCKING': {
      return event.reason ? `Docking: ${event.reason}` : 'Docking';
    }
    case 'AREA': {
      return event.area_name ? `Starting to mow area "${event.area_name}"` : 'Starting to mow next area';
    }
    default:
      return getEventTypeLabel(event.type);
  }
}

export function getEventTypeLabel(type: string): string {
  switch (type) {
    case 'EMERGENCY':
      return 'Emergency';
    case 'BOOTED':
      return 'Mower started';
    case 'GPS':
      return 'GPS';
    case 'STATE':
      return 'State';
    case 'BLADES':
      return 'Blades';
    case 'DOCKING':
      return 'Docking';
    case 'AREA':
      return 'Area';
    default:
      return type;
  }
}

export function parseDateKey(date: string): Date {
  // date is YYYYMMDD; construct as YYYY-MM-DDT12:00:00 to avoid timezone issues
  return new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T12:00:00`);
}

export function formatEventDateLabel(date: string): string {
  return parseDateKey(date).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
