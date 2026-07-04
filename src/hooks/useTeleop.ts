import {useMowersStore} from '@/stores/mowersStore';
import {useCallback, useEffect, useRef, useState} from 'react';

const PUBLISH_INTERVAL_MS = 100;

interface UseTeleopOptions {
  /**
   * When true, the publish interval keeps running (sending the latest velocity,
   * even 0,0) after the stick returns to centre. Only an explicit release() call
   * stops it. Used by the Simulation tab joystick. Default: false (map behavior).
   */
  holdUntilRelease?: boolean;
}

interface UseTeleopResult {
  setVelocity: (vx: number, vz: number) => void;
  /** Only meaningful when holdUntilRelease is true. */
  release: () => void;
  /** True while the hold-mode interval is running. */
  active: boolean;
}

export function useTeleop(options: UseTeleopOptions = {}): UseTeleopResult {
  const {holdUntilRelease = false} = options;

  const vel = useRef({vx: 0, vz: 0});
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [active, setActive] = useState(false);

  const publish = useCallback(() => {
    const {mowers, selected} = useMowersStore.getState();
    mowers[selected]?.publishTeleop(vel.current.vx, vel.current.vz);
  }, []);

  const stopInterval = useCallback(() => {
    if (interval.current !== null) {
      clearInterval(interval.current);
      interval.current = null;
    }
  }, []);

  const release = useCallback(() => {
    stopInterval();
    vel.current = {vx: 0, vz: 0};
    publish();
    setActive(false);
  }, [stopInterval, publish]);

  const setVelocity = useCallback(
    (vx: number, vz: number) => {
      vel.current = {vx: Math.max(-1, Math.min(1, vx)), vz: Math.max(-1, Math.min(1, vz))};

      if (holdUntilRelease) {
        if (interval.current === null) {
          publish();
          interval.current = setInterval(publish, PUBLISH_INTERVAL_MS);
          setActive(true);
        }
        // interval keeps running; next tick picks up the updated vel ref
      } else {
        const moving = vx !== 0 || vz !== 0;
        const wasMoving = interval.current !== null;

        if (moving && !wasMoving) {
          publish();
          interval.current = setInterval(publish, PUBLISH_INTERVAL_MS);
        } else if (!moving && wasMoving) {
          stopInterval();
          publish();
        }
      }
    },
    [holdUntilRelease, publish, stopInterval],
  );

  useEffect(() => {
    return () => {
      stopInterval();
      vel.current = {vx: 0, vz: 0};
      publish();
    };
  }, []);

  return {setVelocity, release, active};
}
