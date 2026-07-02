'use client';

import type {OpenMowerRpc} from '@/lib/rpc';
import {useSelectedMower} from '@/stores/mowersStore';
import type {SimState} from '@/stores/schemas';
import {useCallback, useState} from 'react';

export type SimAction = 'emergency' | 'movement' | 'battery' | 'gps' | 'dock' | 'twist' | 'displace';

export interface SimControl {
  /** null while no simulator has been detected (no retained sim/state/json message). */
  simState: SimState | null;
  available: boolean;
  /** The action currently being sent, or null when idle. */
  pending: SimAction | null;
  error: string | null;
  setEmergency: (active: boolean) => void;
  setMovementAllowed: (allowed: boolean) => void;
  setBatteryFull: (full: boolean) => void;
  setBatteryVolts: (volts: number) => void;
  setGpsGood: (good: boolean) => void;
  moveToDock: () => void;
  setTwist: (linear: number, angular: number, enabled?: boolean) => void;
  displace: (dx: number, dy: number, dheading?: number) => void;
}

export function useSimControl(): SimControl {
  const mowerId = useSelectedMower((m) => m?.id);
  const rpc = useSelectedMower((m) => m?.rpc);
  const simState = useSelectedMower((m) => m?.simState) ?? null;

  const [pending, setPending] = useState<SimAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (action: SimAction, fn: (rpc: OpenMowerRpc) => Promise<unknown>) => {
      if (!rpc || !mowerId) return;
      setPending(action);
      setError(null);
      try {
        await fn(rpc);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'RPC failed');
      } finally {
        setPending(null);
      }
    },
    [rpc, mowerId],
  );

  return {
    simState,
    available: simState !== null,
    pending,
    error,
    setEmergency: (active) => run('emergency', (r) => r.sim.emergency.set({active})),
    setMovementAllowed: (allowed) => run('movement', (r) => r.sim.movement.set({allowed})),
    setBatteryFull: (full) => run('battery', (r) => r.sim.battery.set({full})),
    setBatteryVolts: (volts) => run('battery', (r) => r.sim.battery.set({volts})),
    setGpsGood: (good) => run('gps', (r) => r.sim.gps.set({good})),
    moveToDock: () => run('dock', (r) => r.sim.dock.move()),
    setTwist: (linear, angular, enabled = true) => run('twist', (r) => r.sim.twist.set({linear, angular, enabled})),
    displace: (dx, dy, dheading = 0) => run('displace', (r) => r.sim.displace({dx, dy, dheading})),
  };
}
