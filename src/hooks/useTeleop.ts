import {useMowersStore} from '@/stores/mowersStore';
import {useCallback, useEffect, useRef} from 'react';

const PUBLISH_INTERVAL_MS = 100;

export function useTeleop() {
  const vel = useRef({vx: 0, vz: 0});
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const publish = useCallback(() => {
    const {mowers, selected} = useMowersStore.getState();
    mowers[selected]?.publishTeleop(vel.current.vx, vel.current.vz);
  }, []);

  const setVelocity = useCallback(
    (vx: number, vz: number) => {
      vel.current = {vx: Math.max(-1, Math.min(1, vx)), vz: Math.max(-1, Math.min(1, vz))};

      const moving = vx !== 0 || vz !== 0;
      const wasMoving = interval.current !== null;

      if (moving && !wasMoving) {
        publish();
        interval.current = setInterval(publish, PUBLISH_INTERVAL_MS);
      } else if (!moving && wasMoving) {
        clearInterval(interval.current!);
        interval.current = null;
        publish();
      }
    },
    [publish],
  );

  useEffect(() => {
    return () => {
      if (interval.current !== null) clearInterval(interval.current);
      vel.current = {vx: 0, vz: 0};
      publish();
    };
  }, []);

  return {setVelocity};
}
