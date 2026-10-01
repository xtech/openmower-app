import { useSelectedMower } from '@/stores/mowersStore';
import type { MowerEvent } from '@/stores/schemas';

const EMPTY_EVENTS: MowerEvent[] = [];
const EMPTY_DATES: string[] = [];

export function useSelectedMowerActiveEmergency(): boolean {
  return useSelectedMower((mower) => mower?.state.emergency ?? false);
}

export function useSelectedMowerEventsForDate(date: string): MowerEvent[] {
  const events = useSelectedMower((mower) => mower?.events.eventsByDate[date]);
  return events ?? EMPTY_EVENTS;
}

export function useSelectedMowerAvailableDates(): string[] {
  const dates = useSelectedMower((mower) => mower?.events.availableDates);
  return dates ?? EMPTY_DATES;
}

export function useSelectedMowerIsDateLoaded(date: string): boolean {
  return useSelectedMower((mower) => Boolean(mower?.events.loadedDates[date]));
}
